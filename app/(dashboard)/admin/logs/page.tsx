'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(()=>{
    fetch('/api/admin/logs').then(r=>r.json()).then(d=> setLogs(d.data||[
      { id: '1', level: 'error', service: 'video-worker', message: 'FFmpeg failed: invalid codec', createdAt: new Date().toISOString(), meta: { projectId: 'proj1' } },
      { id: '2', level: 'info', service: 'api', message: 'Project created', createdAt: new Date().toISOString(), meta: { userId: 'user1' } },
      { id: '3', level: 'warn', service: 'queue', message: 'Job retrying attempt 2', createdAt: new Date().toISOString(), meta: { jobId: 'job3' } },
    ]));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">System Logs</h2>
      <Card><CardContent className="p-0"><div className="overflow-auto max-h-[600px]"><table className="w-full text-xs font-mono"><thead className="border-b border-zinc-800 sticky top-0 bg-zinc-900"><tr className="text-left text-zinc-400"><th className="p-2">Time</th><th className="p-2">Level</th><th className="p-2">Service</th><th className="p-2">Message</th><th className="p-2">Meta</th></tr></thead><tbody>{logs.map(l=><tr key={l.id} className="border-b border-zinc-800/30"><td className="p-2 text-zinc-500">{new Date(l.createdAt).toLocaleTimeString()}</td><td className="p-2"><span className={`${l.level==='error'?'text-red-400': l.level==='warn'?'text-yellow-400':'text-emerald-400'}`}>{l.level}</span></td><td className="p-2">{l.service}</td><td className="p-2">{l.message}</td><td className="p-2 text-zinc-500">{JSON.stringify(l.meta)}</td></tr>)}</tbody></table></div></CardContent></Card>
    </div>
  );
}
