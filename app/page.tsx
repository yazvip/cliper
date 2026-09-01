import Link from 'next/link';
import { Scissors, Zap, Captions, Brain, Video, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl"><div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center"><Scissors className="w-5 h-5" /></div> AUTO CLIPPER</div>
        <div className="flex gap-3"><Link href="/login" className="px-4 py-2 rounded-lg hover:bg-white/10">Login</Link><Link href="/register" className="px-5 py-2 bg-violet-600 rounded-lg font-medium hover:bg-violet-700">Start Creating</Link></div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-600/30 text-violet-300 text-sm mb-6"><Sparkles className="w-4 h-4" /> AI Powered Video Repurposing</div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">Turn Long Videos<br/>Into <span className="text-violet-500">Viral Short Clips</span><br/>With AI</h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">Upload one video and automatically create engaging short-form content for TikTok, Reels, and Shorts. AI finds highlights, smart crop, auto captions.</p>
        <div className="flex gap-4 justify-center"><Link href="/register" className="px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-zinc-200">Start Creating - Free</Link><Link href="/dashboard" className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-xl font-medium text-lg hover:bg-zinc-800">Try Demo</Link></div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            { icon: Brain, title: 'AI Highlight Detection', desc: 'Scoring: Hook, Engagement, Emotion, Information. Bukan keyword matching.' },
            { icon: Video, title: 'Smart Auto Crop 9:16', desc: 'Face tracking & speaker detection, bukan crop tengah.' },
            { icon: Captions, title: 'Animated Captions', desc: 'Word-by-word, TikTok style, highlight kata aktif.' },
          ].map((f,i)=>(
            <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"><f.icon className="w-8 h-8 text-violet-500 mb-4" /><h3 className="font-semibold text-lg mb-2">{f.title}</h3><p className="text-zinc-400 text-sm">{f.desc}</p></div>
          ))}
        </div>

        <div className="mt-24">
          <h2 className="text-3xl font-bold mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['Upload','AI Analyze','Generate Clips','Customize','Export'].map((step, i)=>(
              <div key={i} className="relative p-6 rounded-xl bg-zinc-900 border border-zinc-800"><div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold mb-4">{i+1}</div><div className="font-medium">{step}</div></div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
