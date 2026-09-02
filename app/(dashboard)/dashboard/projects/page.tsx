'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  useEffect(()=>{ fetch('/api/projects').then(r=>r.json()).then(d=> setProjects(d.data||[])).catch(()=> setProjects([
    { id: 'demo1', title: 'Podcast Bisnis Pemula', status: 'COMPLETED', clipsCount: 5, createdAt: new Date().toISOString(), thumbnailPath: null },
    { id: 'demo2', title: 'Gaming Highlight MLBB', status: 'PROCESSING', clipsCount: 3, createdAt: new Date().toISOString(), thumbnailPath: null },
  ])); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Projects</h1><Link href="/dashboard/upload"><Button>New Project</Button></Link></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map(p=>(
          <Card key={p.id} className="overflow-hidden hover:border-violet-600/50 transition">
            <div className="h-40 bg-zinc-800 flex items-center justify-center text-zinc-500">Thumbnail {p.title.slice(0,2)}</div>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start"><h3 className="font-semibold line-clamp-1">{p.title}</h3><Badge>{p.status}</Badge></div>
              <div className="flex justify-between text-xs text-zinc-400"><span>{p.clipsCount||0} clips</span><span>{new Date(p.createdAt).toLocaleDateString()}</span></div>
              <div className="flex gap-2"><Link href={`/dashboard/clipper?projectId=${p.id}`} className="flex-1"><Button variant="outline" className="w-full text-xs">Open Clipper</Button></Link><Link href={`/dashboard/clips?projectId=${p.id}`} className="flex-1"><Button className="w-full text-xs">View Clips</Button></Link></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
