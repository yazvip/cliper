'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClipperPage() {
  const [config, setConfig] = useState({ clipCount: 5, clipDuration: 30, aspectRatio: 'AR_9_16', platform: 'TIKTOK', style: 'VIRAL', aiIntensity: 'balanced' });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  async function generate() {
    setLoading(true);
    // Mock call - in real app POST /api/projects/:id/generate-clips
    setTimeout(()=> {
      setResults([
        { id: '1', start: 12.4, end: 42.4, score: 92, hook: 'Jangan mulai bisnis sebelum tahu ini.', reason: 'Strong hook + valuable info', title: 'Kesalahan Bisnis Pemula #1' },
        { id: '2', start: 65.2, end: 95.2, score: 88, hook: '90% orang melakukan kesalahan ini.', reason: 'High engagement', title: 'Kenapa Bisnis Gagal?' },
        { id: '3', start: 120.5, end: 150.5, score: 85, hook: 'Ini alasan bisnis Anda tidak berkembang.', reason: 'Emotional trigger', title: 'Rahasia Riset Pasar' },
      ]);
      setLoading(false);
    }, 2000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card><CardHeader><CardTitle>Generate Clips Config</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><label className="text-sm text-zinc-400">Jumlah Clip</label><div className="flex gap-2 mt-1">{[3,5,10].map(n=><button key={n} onClick={()=>setConfig({...config, clipCount:n})} className={`px-3 py-2 rounded-lg border text-sm ${config.clipCount===n?'bg-violet-600 border-violet-600':'border-zinc-700'}`}>{n}</button>)}</div></div>
          <div><label className="text-sm text-zinc-400">Durasi</label><div className="flex flex-wrap gap-2 mt-1">{[15,30,45,60,90].map(d=><button key={d} onClick={()=>setConfig({...config, clipDuration:d})} className={`px-3 py-1.5 rounded-lg border text-xs ${config.clipDuration===d?'bg-violet-600 border-violet-600':'border-zinc-700'}`}>{d}s</button>)}</div></div>
          <div><label className="text-sm text-zinc-400">Aspect Ratio</label><div className="flex gap-2 mt-1">{[{v:'AR_9_16',l:'9:16'},{v:'AR_16_9',l:'16:9'},{v:'AR_1_1',l:'1:1'}].map(r=><button key={r.v} onClick={()=>setConfig({...config, aspectRatio:r.v})} className={`px-3 py-1.5 rounded-lg border text-xs ${config.aspectRatio===r.v?'bg-violet-600 border-violet-600':'border-zinc-700'}`}>{r.l}</button>)}</div></div>
          <div><label className="text-sm text-zinc-400">Platform</label><select value={config.platform} onChange={e=>setConfig({...config, platform:e.target.value})} className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm"><option>TIKTOK</option><option>YOUTUBE_SHORTS</option><option>INSTAGRAM_REELS</option><option>FACEBOOK_REELS</option></select></div>
          <div><label className="text-sm text-zinc-400">Gaya</label><select value={config.style} onChange={e=>setConfig({...config, style:e.target.value})} className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm"><option>VIRAL</option><option>EDUCATIONAL</option><option>PODCAST</option><option>GAMING</option><option>MOTIVATIONAL</option><option>STORYTELLING</option></select></div>
          <div><label className="text-sm text-zinc-400">AI Intensity</label><div className="flex gap-2 mt-1">{['fast','balanced','deep'].map(i=><button key={i} onClick={()=>setConfig({...config, aiIntensity:i})} className={`px-3 py-1.5 rounded-lg border text-xs capitalize ${config.aiIntensity===i?'bg-violet-600 border-violet-600':'border-zinc-700'}`}>{i}</button>)}</div></div>
          <Button onClick={generate} disabled={loading} className="w-full mt-4">{loading?'AI Analyzing...':'GENERATE CLIPS'}</Button>
        </CardContent></Card>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold">Detected Highlights</h2>
        {results.length===0 && !loading && <Card><CardContent className="p-12 text-center text-zinc-500">Belum ada clip. Konfigurasi di kiri lalu Generate.</CardContent></Card>}
        {loading && <Card><CardContent className="p-12 text-center">Analyzing transcript with AI... Scoring hook, engagement, emotion...</CardContent></Card>}
        {results.map(r=>(
          <Card key={r.id} className="hover:border-violet-600/50 transition"><CardContent className="p-4 flex gap-4"><div className="w-24 h-32 bg-zinc-800 rounded-lg flex items-center justify-center text-xs">9:16<br/>Preview</div><div className="flex-1"><div className="flex justify-between"><h3 className="font-semibold">{r.title}</h3><span className="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded-full">Score {r.score}</span></div><p className="text-sm text-violet-300 mt-1">Hook: \"{r.hook}\"</p><p className="text-xs text-zinc-400 mt-1">⏱ {r.start.toFixed(1)}s - {r.end.toFixed(1)}s • {r.reason}</p><div className="flex gap-2 mt-3"><Button size="sm">Preview</Button><Button size="sm" variant="outline">Edit</Button><Button size="sm" variant="outline">Render</Button></div></div></CardContent></Card>
        ))}
      </div>
    </div>
  );
}
