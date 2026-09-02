'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ClipEditorPage({ params }: { params: { id: string } }) {
  const [clip, setClip] = useState<any>(null);
  const [captions, setCaptions] = useState<any[]>([]);
  const [style, setStyle] = useState('tiktok');
  const [crop, setCrop] = useState('smart');
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(()=>{
    fetch(`/api/clips/${params.id}/render`).then(r=>r.json()).then(d=> {
      if (d.status) { setClip(d.data); setCaptions(d.data.captions||[]); }
      else {
        setClip({ id: params.id, title: 'Demo Clip - Kesalahan Bisnis #1', hook: 'Jangan mulai bisnis sebelum tahu ini.', startTime: 12.4, endTime: 42.4, duration: 30, score: 92, aspectRatio: 'AR_9_16', captionStyle: 'tiktok', cropMode: 'smart' });
        setCaptions([
          { word: 'JANGAN', start: 12.4, end: 12.8 },
          { word: 'MULAI', start: 12.8, end: 13.1 },
          { word: 'BISNIS', start: 13.1, end: 13.6 },
          { word: 'SEBELUM', start: 13.6, end: 14.0 },
          { word: 'TAHU', start: 14.0, end: 14.3 },
          { word: 'INI!', start: 14.3, end: 14.8 },
        ]);
      }
    });
  }, [params.id]);

  async function save() {
    const res = await fetch(`/api/clips/${params.id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ title: clip.title, hook: clip.hook, captionStyle: style, cropMode: crop }) });
    const data = await res.json();
    if (data.status) alert('Saved!'); else alert(data.message);
  }

  async function render() {
    const res = await fetch(`/api/clips/${params.id}/render`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ captionStyle: style, cropMode: crop, captionMode: 'word' }) });
    const data = await res.json();
    alert(data.message);
  }

  if (!clip) return <div className="p-8">Loading editor...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card className="flex-1">
          <CardContent className="p-0 h-full">
            <div className="aspect-[9/16] max-h-[600px] mx-auto bg-black rounded-xl relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
              <div className="relative z-10 text-center p-6">
                <div className="text-5xl font-black tracking-tight" style={{ fontFamily: 'Anton' }}>
                  {captions[Math.floor(currentTime*2)%captions.length]?.word || 'JANGAN'}
                </div>
                <div className="mt-4 text-sm text-zinc-400">Preview 9:16 • {style} • {crop}</div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 h-1 bg-zinc-800 rounded-full"><div className="h-1 bg-violet-600 rounded-full" style={{ width: `${(currentTime/clip.duration)*100}%` }} /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><span className="text-xs text-zinc-400">Timeline</span><span className="text-xs ml-auto">{clip.startTime.toFixed(1)}s - {clip.endTime.toFixed(1)}s</span></div>
            <div className="h-16 bg-zinc-900 rounded-lg flex items-center px-2 gap-1 overflow-x-auto">
              {Array.from({length: 20}).map((_,i)=>(
                <div key={i} className="h-10 w-8 bg-zinc-800 rounded flex-shrink-0 border border-zinc-700" style={{ opacity: 0.5 + Math.random()*0.5 }} />
              ))}
              <div className="absolute w-0.5 h-16 bg-violet-500" style={{ left: `${(currentTime/clip.duration)*100}%` }} />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={()=>setCurrentTime(Math.max(0, currentTime-1))}>-1s</Button>
              <Button size="sm" onClick={()=>{ const id=setInterval(()=>setCurrentTime(t=>{ if(t>=clip.duration){clearInterval(id); return t;} return t+0.1; }),100); }}>Play</Button>
              <Button size="sm" variant="outline" onClick={()=>setCurrentTime(Math.min(clip.duration, currentTime+1))}>+1s</Button>
              <span className="text-xs text-zinc-400 ml-auto self-center">Trim • Split • Delete • Duplicate • Zoom</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 overflow-auto">
        <Card><CardHeader><CardTitle>Clip Info</CardTitle></CardHeader><CardContent className="space-y-3">
          <Input value={clip.title} onChange={e=>setClip({...clip, title:e.target.value})} placeholder="Title" />
          <Input value={clip.hook} onChange={e=>setClip({...clip, hook:e.target.value})} placeholder="Hook" />
          <div className="grid grid-cols-2 gap-2 text-xs"><div>Score: {clip.score}</div><div>Duration: {clip.duration}s</div></div>
          <div className="flex gap-2"><Button onClick={save} className="flex-1">Save</Button><Button onClick={render} variant="outline" className="flex-1">Render</Button></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Caption | Audio | Crop | Text | Effects</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><label className="text-xs text-zinc-400">Caption Style</label><div className="grid grid-cols-3 gap-2 mt-2">{['clean','bold','tiktok','podcast','minimal','gaming','highlight'].map(s=><button key={s} onClick={()=>setStyle(s)} className={`p-2 rounded-lg border text-xs capitalize ${style===s?'bg-violet-600 border-violet-600':'border-zinc-700'}`}>{s}</button>)}</div></div>
          <div><label className="text-xs text-zinc-400">Smart Crop Mode</label><div className="grid grid-cols-2 gap-2 mt-2">{['center','face','speaker','smart'].map(m=><button key={m} onClick={()=>setCrop(m)} className={`p-2 rounded-lg border text-xs capitalize ${crop===m?'bg-violet-600 border-violet-600':'border-zinc-700'}`}>{m}</button>)}</div><p className="text-[11px] text-zinc-500 mt-2">Smart crop uses face/speaker detection, not just center. Keeps face in upper third for 9:16.</p></div>
          <div><label className="text-xs text-zinc-400">Captions (word-by-word editable)</label><div className="mt-2 max-h-40 overflow-auto space-y-1">{captions.map((c,i)=><div key={i} className="flex gap-2 text-xs bg-zinc-900 p-2 rounded"><span className="text-zinc-500">{c.start.toFixed(1)}s</span><input className="flex-1 bg-transparent outline-none" value={c.word} onChange={e=>{ const nc=[...captions]; nc[i].word=e.target.value; setCaptions(nc); }} /></div>)}</div></div>
          <div><label className="text-xs text-zinc-400">Text Overlay / Emoji / Logo / Watermark</label><div className="mt-2 flex gap-2"><Button size="sm" variant="outline">Add Text</Button><Button size="sm" variant="outline">Emoji</Button><Button size="sm" variant="outline">Logo</Button></div></div>
          <div><label className="text-xs text-zinc-400">Audio</label><div className="mt-2 space-y-2"><div className="flex justify-between text-xs"><span>Original Volume</span><span>100%</span></div><div className="h-1 bg-zinc-800 rounded-full"><div className="h-1 bg-white w-full rounded-full" /></div><div className="flex justify-between text-xs"><span>Music Ducking</span><span>Auto</span></div><Button size="sm" variant="outline" className="w-full">Upload Background Music</Button></div></div>
        </CardContent></Card>
      </div>
    </div>
  );
}
