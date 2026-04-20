import { startSyncWorker } from "../utils/syncWorker";

export default defineNitroPlugin(() => {
    if (process.env.DISABLE_SYNC_WORKER === "true") return;
    startSyncWorker();
});