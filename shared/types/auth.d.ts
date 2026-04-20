declare module '#auth-utils' {
    interface User {
        login: string
        email: string | null
        name: string
    }
}

export {}