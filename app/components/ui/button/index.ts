import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Button } from './Button.vue';

export const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2rem] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
      variants: {
        variant: {
          default:
              'bg-primary text-primary-foreground shadow hover:bg-primary/90',
          destructive:
              'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
          outline:
              'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground',
          'outline-white':
              'border-2 border-white text-white bg-transparent hover:bg-white hover:text-primary',
          secondary:
              'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
          ghost: 'text-primary bg-transparent hover:bg-primary/10',
          link: 'text-primary underline-offset-4 hover:underline',
        },
        size: {
          default: 'h-10 px-6 py-2',
          xs: 'h-7 px-3 text-xs',
          sm: 'h-8 px-4 text-xs',
          lg: 'h-10 px-8 text-base',
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
