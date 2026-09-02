'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(()=>{
    fetch(`/api/jobs?status=${filter==='all'?'':filter}`).then(r=>r.json()).then(d=> setJobs(d.data||[
      { id: 'job1', type: 'FFPROBE', status: 'COMPLETED', progress: 100, projectId: 'proj1', createdAt: new Date().toISOString() },
      { id: 'job2', type: 'TRANSCRIBE', status: 'PROCESSING', progress: 45, projectId: 'proj1', createdAt: new Date().toISOString() },
      { id: 'job3', type: 'CLIP_RENDER', status: 'FAILED', progress: 80, error: 'FFmpeg failed: invalid input', projectId: 'proj2', createdAt: new Date().toISOString() },
    ]));
  }, [filter]);

  async function retry(id: string) {
    const res = await fetch(`/api/admin/jobs/${id}/retry`, { method: 'POST' });
    const data = await res.json(); alert(data.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Processing Jobs</h2><div className="flex gap-2">{['all','QUEUED','PROCESSING','COMPLETED','FAILED'].map(s=><button key={s} onClick={()=>setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs border ${filter===s?'bg-violet-600 border-violet-600':'border-zinc-700'}`}>{s}</button>)}</div></div>
      <Card><CardContent className="p-0"><div className="overflow-auto"><table className="w-full text-sm"><thead className="border-b border-zinc-800"><tr className="text-left text-zinc-400"><th className="p-3">ID</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Progress</th><th className="p-3">Project</th><th className="p-3">Actions</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id} className="border-b border-zinc-800/50"><td className="p-3 font-mono text-xs">{j.id.slice(0,8)}</td><td className="p-3">{j.type}</td><td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${j.status==='COMPLETED'?'bg-emerald-600/20 text-emerald-400': j.status==='FAILED'?'bg-red-600/20 text-red-400':'bg-yellow-600/20 text-yellow-400'}`}>{j.status}</span></td><td className="p-3"><div className="w-20 h-2 bg-zinc-800 rounded-full"><div className="h-2 bg-violet-600 rounded-full" style={{ width: `${j.progress}%` }} /></div></td><td className="p-3 font-mono text-xs">{j.projectId?.slice(0,6)}</td><td className="p-3 flex gap-1">{j.status==='FAILED' && <Button size="sm" onClick={()=>retry(j.id)}>Retry</Button>}<Button size="sm" variant="outline">Logs</Button></td></tr>)}</tbody></table></div></CardContent></Card>
    </div>
  );
}
