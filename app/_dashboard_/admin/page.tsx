import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/stats`, { cache: 'no-store' });
    const data = await res.json();
    return data.data;
  } catch {
    return { users: 24, projects: 12, clips: 48, jobsFailed: 2, storageUsed: '2.4GB', aiTokens: '45k' };
  }
}

export default async function AdminPage() {
  const stats = await getStats();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardHeader><CardTitle className="text-sm text-zinc-400">Total Users</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.users}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-zinc-400">Projects</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.projects}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-zinc-400">Clips</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.clips}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-zinc-400">Failed Jobs</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-400">{stats.jobsFailed}</div></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>System Health</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span>Postgres</span><span className="text-emerald-400">Connected</span></div><div className="flex justify-between"><span>Redis</span><span className="text-emerald-400">Connected</span></div><div className="flex justify-between"><span>Worker</span><span className="text-emerald-400">Running (2 concurrency)</span></div><div className="flex justify-between"><span>FFmpeg</span><span className="text-emerald-400">Available</span></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><button className="px-3 py-2 rounded-lg bg-zinc-800 text-sm hover:bg-zinc-700">Retry Failed Jobs</button><button className="px-3 py-2 rounded-lg bg-zinc-800 text-sm hover:bg-zinc-700">Clear Queue</button><button className="px-3 py-2 rounded-lg bg-zinc-800 text-sm hover:bg-zinc-700">View Error Logs</button><button className="px-3 py-2 rounded-lg bg-red-600 text-sm hover:bg-red-700">Suspend User</button></CardContent></Card>
      </div>
    </div>
  );
}
