/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './components/**/*.{vue,js,ts}',
        './layouts/**/*.vue',
        './pages/**/*.vue',
        './app.vue'
    ],
    theme: {
        extend: {
            colors: {
                itk: {
                    50: '#FDF2F4',
                    100: '#FBE5E8',
                    200: '#F7CDD4',
                    300: '#F1A5B4',
                    400: '#E97086',
                    500: '#E5233E',
                    600: '#C9172E',
                    700: '#A71023',
                    800: '#8A1221',
                    900: '#741420',
                    950: '#41060E',
                },
            }
        }
    },
    plugins: [],
}

