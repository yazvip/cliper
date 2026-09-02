import Link from 'next/link';
import { LayoutDashboard, Folder, Upload, Scissors, Clapperboard, Palette, Captions, Settings, Database, Key, BarChart3, Package } from 'lucide-react';

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/projects', icon: Folder, label: 'Projects' },
  { href: '/dashboard/upload', icon: Upload, label: 'Upload Video' },
  { href: '/dashboard/clipper', icon: Scissors, label: 'Auto Clipper' },
  { href: '/dashboard/clips', icon: Clapperboard, label: 'Clips' },
  { href: '/dashboard/templates', icon: Palette, label: 'Templates' },
  { href: '/dashboard/captions', icon: Captions, label: 'Captions' },
  { href: '/dashboard/brand', icon: Package, label: 'Brand Kit' },
  { href: '/dashboard/storage', icon: Database, label: 'Storage' },
  { href: '/dashboard/api', icon: Key, label: 'API' },
  { href: '/dashboard/usage', icon: BarChart3, label: 'Usage' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <aside className="w-64 border-r border-zinc-800 p-4 hidden md:flex flex-col gap-6">
        <div className="flex items-center gap-2 font-bold text-lg px-2"><div className="w-7 h-7 bg-violet-600 rounded-lg" /> AUTO CLIPPER</div>
        <nav className="flex flex-col gap-1">
          {nav.map(item=>(
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white text-sm transition">
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}
