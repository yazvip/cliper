'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [name, setName] = useState('');

  useEffect(()=>{ fetch('/api/templates').then(r=>r.json()).then(d=> setTemplates(d.data||[])); }, []);

  async function create() {
    if (!name) return;
    const res = await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name, aspectRatio: 'AR_9_16', captionStyle: 'tiktok' }) });
    const data = await res.json();
    if (data.status) { setTemplates([data.data, ...templates]); setName(''); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Templates</h1>
      <Card><CardHeader><CardTitle>Create Template</CardTitle></CardHeader><CardContent className="flex gap-2"><Input placeholder="Template name e.g. TikTok Viral" value={name} onChange={e=>setName(e.target.value)} /><Button onClick={create}>Create</Button></CardContent></Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map(t=>(
          <Card key={t.id}><CardContent className="p-4 space-y-3"><div className="h-24 bg-zinc-800 rounded-lg flex items-center justify-center text-xs">{t.captionStyle} style</div><h3 className="font-semibold">{t.name}</h3><div className="text-xs text-zinc-400">{t.aspectRatio} • {t.fontFamily} • {t.primaryColor}</div><div className="flex gap-2"><Button size="sm" variant="outline" className="flex-1">Edit</Button><Button size="sm" variant="outline" className="flex-1">Duplicate</Button><Button size="sm" variant="outline">Delete</Button></div></CardContent></Card>
        ))}
      </div>
    </div>
  );
}
