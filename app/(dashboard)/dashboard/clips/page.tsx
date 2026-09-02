'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ClipsPage() {
  const [clips, setClips] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(()=>{
    fetch('/api/clips').then(r=>r.json()).then(d=> setClips(d.data||[]));
  }, []);

  function toggle(id: string) { setSelected(s=> s.includes(id) ? s.filter(x=>x!==id) : [...s, id]); }

  async function bulkDownload() {
    const res = await fetch('/api/clips/export', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ clipIds: selected }) });
    const data = await res.json(); alert(`Export ${data.data?.count} clips ready. ${JSON.stringify(data.data?.clips?.slice(0,2))}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Clip Library</h1><div className="flex gap-2">{selected.length>0 && <><Button variant="outline" onClick={bulkDownload}>Download ZIP ({selected.length})</Button><Button variant="outline">Delete Selected</Button></>}<Link href="/dashboard/clipper"><Button>Generate More</Button></Link></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {clips.map(c=>(
          <Card key={c.id} className={`overflow-hidden hover:border-violet-600/50 transition ${selected.includes(c.id)?'border-violet-600 ring-1 ring-violet-600':''}`}>
            <div className="relative">
              <div className="h-56 bg-zinc-800 flex items-center justify-center text-zinc-500">9:16 Thumbnail<br/>{c.title?.slice(0,10)}</div>
              <input type="checkbox" checked={selected.includes(c.id)} onChange={()=>toggle(c.id)} className="absolute top-2 left-2" />
              <Badge className="absolute top-2 right-2">{c.status}</Badge>
              <div className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 bg-black/70 rounded">Score {c.score}</div>
            </div>
            <CardContent className="p-3 space-y-2">
              <h3 className="font-medium text-sm line-clamp-1">{c.title}</h3>
              <p className="text-xs text-violet-300 line-clamp-1">"{c.hook}"</p>
              <div className="flex justify-between text-[11px] text-zinc-400"><span>{c.duration}s</span><span>{c.aspectRatio}</span></div>
              <div className="flex gap-1"><Link href={`/dashboard/clips/${c.id}/edit`} className="flex-1"><Button size="sm" className="w-full text-xs">Edit</Button></Link><Button size="sm" variant="outline" className="flex-1 text-xs">Download</Button></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
