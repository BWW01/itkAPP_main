import { asc, eq } from "drizzle-orm";
import { db } from "../../db";
import { curricula, curriculumGroups } from "../../db/schema";

export default defineEventHandler(async (event) => {
    await requireUserSession(event);

    const [rows, specs] = await Promise.all([
        db
            .select({
                id: curricula.id,
                code: curricula.code,
                name: curricula.name,
                major: curricula.major,
                totalCreditsRequired: curricula.totalCreditsRequired,
            })
            .from(curricula)
            .orderBy(asc(curricula.major), asc(curricula.name)),
        db
            .select({
                id: curriculumGroups.id,
                curriculumId: curriculumGroups.curriculumId,
                name: curriculumGroups.name,
            })
            .from(curriculumGroups)
            .where(eq(curriculumGroups.isSpecialization, true))
            .orderBy(asc(curriculumGroups.sortOrder)),
    ]);

    return rows.map((c) => ({
        ...c,
        specializations: specs
            .filter((s) => s.curriculumId === c.id)
            .map(({ id, name }) => ({ id, name })),
    }));
});