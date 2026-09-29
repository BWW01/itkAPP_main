export default defineEventHandler((event) => {
    if (!event.path.startsWith('/api/')) return

    const handled = handleCors(event, {
        origin: () => true,
        credentials: true,
        methods: '*',
        allowHeaders: '*',
        preflight: {
            statusCode: 204,
        },
    })

    if (handled) return
})