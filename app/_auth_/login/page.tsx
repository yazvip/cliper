'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    setLoading(false);
    if (data.status) router.push('/dashboard'); else alert(data.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-6">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle className="text-2xl">Login to Auto Clipper</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <Input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>{loading?'Loading...':'Login'}</Button>
          </form>
          <p className="text-sm text-zinc-400 mt-4 text-center">Belum punya akun? <Link href="/register" className="text-violet-400">Register</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
