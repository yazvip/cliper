import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  // For demo - in real app get user from session
  const stats = await prisma.$transaction([
    prisma.project.count(),
    prisma.clip.count(),
    prisma.processingJob.count({ where: { status: 'PROCESSING' } }),
    prisma.processingJob.count({ where: { status: 'COMPLETED' } }),
  ]).catch(()=>[12, 48, 2, 35] as any);

  const cards = [
    { label: 'Total Project', value: stats[0], sub: '+2 this week' },
    { label: 'Total Clip', value: stats[1], sub: 'AI generated' },
    { label: 'Processing', value: stats[2], sub: 'In queue' },
    { label: 'Completed', value: stats[3], sub: 'Ready to export' },
  ];

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold">Dashboard</h1><p className="text-zinc-400">Welcome back, monitor your AI clipping pipeline.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((c,i)=><Card key={i}><CardHeader><CardTitle className="text-sm text-zinc-400">{c.label}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{c.value}</div><div className="text-xs text-zinc-500 mt-1">{c.sub}</div></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2"><CardHeader><CardTitle>Processing Pipeline</CardTitle></CardHeader><CardContent><div className="h-48 flex items-end gap-2">{[40,70,45,90,60,80,30,85].map((h,i)=><div key={i} className="flex-1 bg-violet-600 rounded-t" style={{height: `${h}%`}} />)}</div><div className="flex justify-between text-xs text-zinc-500 mt-2"><span>Upload</span><span>FFprobe</span><span>Transcribe</span><span>Analyze</span><span>Clip</span><span>Render</span></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Storage & AI Usage</CardTitle></CardHeader><CardContent className="space-y-4"><div><div className="flex justify-between text-sm mb-1"><span>Storage</span><span>2.4GB / 10GB</span></div><div className="h-2 bg-zinc-800 rounded-full"><div className="h-2 bg-violet-600 rounded-full w-[24%]" /></div></div><div><div className="flex justify-between text-sm mb-1"><span>AI Tokens</span><span>45k / 100k</span></div><div className="h-2 bg-zinc-800 rounded-full"><div className="h-2 bg-emerald-500 rounded-full w-[45%]" /></div></div></CardContent></Card>
      </div>
    </div>
  );
}
