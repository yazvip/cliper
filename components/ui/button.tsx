import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const buttonVariants = cva('inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50', {
  variants: {
    variant: { default: 'bg-violet-600 text-white hover:bg-violet-700', outline: 'border border-zinc-700 hover:bg-zinc-800', ghost: 'hover:bg-zinc-800' },
    size: { default: 'h-10 px-4', sm: 'h-8 px-3', lg: 'h-12 px-8', icon: 'h-10 w-10' }
  }, defaultVariants: { variant: 'default', size: 'default' }
});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
));
Button.displayName = 'Button';
