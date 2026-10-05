// scripts/syncSubjects.ts
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import {subjects} from "../server/db/schema";

const spaceSubjectSchema = z.object({
    code: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(255),
    credit: z.string().regex(/^\d+$/).transform(Number),
});
const spaceResponseSchema = z.array(spaceSubjectSchema);

const res = await fetch(`https://space.itk.ppke.hu/api/subjects`);
if (!res.ok) {
    throw new Error(`Space API error: ${res.status}`);
}

const spaceSubjects = spaceResponseSchema.parse(await res.json());
console.log(`${spaceSubjects.length} tárgy érkezett a space-ből.`);

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const rows = spaceSubjects.map((s) => ({
    code: s.code,
    name: s.name,
    credits: s.credit,
}));

await db
    .insert(subjects)
    .values(rows)
    .onConflictDoUpdate({
        target: subjects.code,
        set: {name: sql`excluded.name`, credits: sql`excluded.credits`}
    })

await client.end();
console.log("✅ Subjects synced");