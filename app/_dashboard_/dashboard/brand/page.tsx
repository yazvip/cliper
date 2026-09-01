'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BrandKitPage() {
  const [kits, setKits] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', brandName: '', primaryColor: '#8b5cf6', secondaryColor: '#000000' });

  useEffect(()=>{ fetch('/api/brand-kit').then(r=>r.json()).then(d=> setKits(d.data||[])); }, []);

  async function create() {
    const res = await fetch('/api/brand-kit', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.status) { setKits([data.data, ...kits]); setForm({ name: '', brandName: '', primaryColor: '#8b5cf6', secondaryColor: '#000000' }); }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Brand Kit</h1>
      <Card><CardHeader><CardTitle>Create Brand Kit - Auto applied to new clips</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3"><Input placeholder="Kit Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /><Input placeholder="Brand Name" value={form.brandName} onChange={e=>setForm({...form, brandName:e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-zinc-400">Primary Color</label><Input type="color" value={form.primaryColor} onChange={e=>setForm({...form, primaryColor:e.target.value})} /></div><div><label className="text-xs text-zinc-400">Secondary Color</label><Input type="color" value={form.secondaryColor} onChange={e=>setForm({...form, secondaryColor:e.target.value})} /></div></div>
        <Button onClick={create}>Create Brand Kit</Button>
      </CardContent></Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kits.map(k=>(
          <Card key={k.id}><CardContent className="p-4 flex gap-4"><div className="w-16 h-16 rounded-lg" style={{ background: k.primaryColor }} /><div><h3 className="font-semibold">{k.name}</h3><div className="text-xs text-zinc-400">{k.brandName} • {k.fontFamily}</div><div className="flex gap-2 mt-1"><div className="w-4 h-4 rounded-full" style={{ background: k.primaryColor }} /><div className="w-4 h-4 rounded-full" style={{ background: k.secondaryColor }} /></div></div></CardContent></Card>
        ))}
      </div>
    </div>
  );
}
