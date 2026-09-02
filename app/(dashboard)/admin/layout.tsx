import Link from 'next/link';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-zinc-800 pb-4">
        <Link href="/admin" className="px-3 py-1.5 rounded-lg bg-violet-600 text-sm">Overview</Link>
        <Link href="/admin/users" className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-sm">Users</Link>
        <Link href="/admin/jobs" className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-sm">Jobs</Link>
        <Link href="/admin/logs" className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-sm">Logs</Link>
        <Link href="/admin/storage" className="px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-sm">Storage</Link>
      </div>
      {children}
    </div>
  );
}
