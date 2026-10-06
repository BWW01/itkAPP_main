import {asc, count, desc, sql} from "drizzle-orm";
import {db} from "../../db";
import {onlineVideos} from "../../db/schema";
import {semesterLabel, youtubeThumbnail} from "../../utils/onlineVideos";
import {parseVideoQuery, videoListQuerySchema, videoWhere} from "../../utils/onlineVideosQuery";

export default defineEventHandler(async (event) => {
    await requireUserSession(event);

    const {limit, offset, ...filter} = parseVideoQuery(videoListQuerySchema, getQuery(event));
    const where = videoWhere(filter);

    const [rows, [totalRow]] = await Promise.all([
        db
            .select({
                id: onlineVideos.id,
                semester: onlineVideos.semester,
                subject: onlineVideos.subject,
                title: onlineVideos.title,
                uploader: onlineVideos.uploader,
                url: onlineVideos.url,
                youtubeId: onlineVideos.youtubeId,
            })
            .from(onlineVideos)
            .where(where)
            .orderBy(
                desc(onlineVideos.semesterOrder),
                asc(onlineVideos.subject),
                sql`${onlineVideos.legacyId} ASC NULLS LAST`,
                asc(onlineVideos.id),
            )
            .limit(limit)
            .offset(offset),
        db.select({total: count()}).from(onlineVideos).where(where),
    ]);

    return {
        total: totalRow?.total ?? 0,
        limit,
        offset,
        items: rows.map((r) => ({
            ...r,
            semesterLabel: semesterLabel(r.semester),
            thumbnailUrl: youtubeThumbnail(r.youtubeId),
        })),
    };
});