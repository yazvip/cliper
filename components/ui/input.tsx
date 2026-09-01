import * as React from 'react';
import { cn } from '@/lib/utils';
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input type={type} className={cn('flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600', className)} ref={ref} {...props} />
));
Input.displayName='Input';
