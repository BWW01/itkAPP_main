import type {VariantProps} from 'class-variance-authority';
import {cva} from 'class-variance-authority';

export {default as Button} from './Button.vue';

export const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-38 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
    {
        variants: {
            variant: {
                // Filled - highest emphasis
                default:
                    'bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:brightness-110 active:brightness-90 active:shadow-sm',
                // Filled tonal - destructive
                destructive:
                    'bg-destructive/15 text-destructive hover:bg-destructive/25 active:bg-destructive/30',
                // Outlined - medium emphasis
                outline:
                    'border border-primary/50 text-primary bg-transparent hover:bg-primary/10 active:bg-primary/15',
                'outline-white':
                    'border border-white/50 text-white bg-transparent hover:bg-white/10 active:bg-white/15',
                // Tonal - filled with muted surface
                secondary:
                    'bg-primary/15 text-primary hover:bg-primary/20 active:bg-primary/25',
                // Text - lowest emphasis
                ghost:
                    'text-primary bg-transparent hover:bg-primary/10 active:bg-primary/15',
                link:
                    'text-primary underline-offset-4 hover:underline bg-transparent',
            },
            size: {
                default: 'h-10 px-6 py-2',
                xs: 'h-7 px-3 text-xs',
                sm: 'h-9 px-4 text-xs',
                lg: 'h-12 px-8 text-base',
                icon: 'h-10 w-10',
                'icon-sm': 'size-8',
                'icon-lg': 'size-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;