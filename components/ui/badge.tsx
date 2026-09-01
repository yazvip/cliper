import { cn } from '@/lib/utils';
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-violet-600/20 text-violet-300 border border-violet-600/30', className)} {...props} />;
}
