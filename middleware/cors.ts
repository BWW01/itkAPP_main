const isLocalhost = (origin: string) => /^http:\/\/localhost(:\d+)?$/.test(origin);

export default defineEventHandler((event) => {
    if (!event.path.startsWith("/api/")) return;

    handleCors(event, {
        origin: isLocalhost,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowHeaders: ["Content-Type"],
        preflight: { statusCode: 204 },
    });
});