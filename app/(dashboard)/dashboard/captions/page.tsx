import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export default function CaptionsPage() {
  return (<div className="space-y-6"><h1 className="text-2xl font-bold">Caption Styles</h1><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{['clean','bold','tiktok','podcast','minimal','gaming','highlight'].map(s=><Card key={s}><CardHeader><CardTitle className="capitalize">{s}</CardTitle></CardHeader><CardContent><div className="h-32 bg-black rounded-lg flex items-center justify-center"><span className="text-2xl font-black">CONTOH TEKS</span></div><p className="text-xs text-zinc-400 mt-2">Style: {s} • Font, size, color, background, stroke, shadow, animation</p></CardContent></Card>)}</div></div>);
}
