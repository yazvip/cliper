import * as React from 'react';
import { cn } from '@/lib/utils';
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-2xl border border-zinc-800 bg-zinc-900/50', className)} {...props} />
)); Card.displayName='Card';
export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('p-6 pb-2', className)} {...props} />;
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('p-6 pt-0', className)} {...props} />;
export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />;
