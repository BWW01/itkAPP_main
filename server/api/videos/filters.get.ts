import {count, desc} from "drizzle-orm";
import {db} from "../../db";
import {onlineVideos} from "../../db/schema";
import {semesterLabel} from "../../utils/onlineVideos";
import {parseVideoQuery, videoFilterSchema, videoWhere} from "../../utils/onlineVideosQuery";

const huCollator = new Intl.Collator("hu", {sensitivity: "base", numeric: true});

export default defineEventHandler(async (event) => {
    await requireUserSession(event);

    const filter = parseVideoQuery(videoFilterSchema, getQuery(event));

    const [semesterRows, subjectRows] = await Promise.all([
        db
            .select({
                key: onlineVideos.semester,
                order: onlineVideos.semesterOrder,
                count: count(),
            })
            .from(onlineVideos)
            .where(videoWhere(filter, "semester"))
            .groupBy(onlineVideos.semester, onlineVideos.semesterOrder)
            .orderBy(desc(onlineVideos.semesterOrder)),
        db
            .select({name: onlineVideos.subject, count: count()})
            .from(onlineVideos)
            .where(videoWhere(filter, "subject"))
            .groupBy(onlineVideos.subject),
    ]);

    return {
        semesters: semesterRows.map((s) => ({
            key: s.key,
            label: semesterLabel(s.key),
            count: s.count,
        })),
        subjects: subjectRows.sort((a, b) => huCollator.compare(a.name, b.name)),
    };
});