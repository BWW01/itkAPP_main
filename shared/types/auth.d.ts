declare module '#auth-utils' {
    interface User {
        id: number
        login: string
        email: string | null
        name: string
        givenName: string
        familyName: string
    }
}

export {}