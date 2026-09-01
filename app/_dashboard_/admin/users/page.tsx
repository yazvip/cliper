'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(()=>{
    fetch('/api/admin/users').then(r=>r.json()).then(d=> setUsers(d.data||[
      { id: '1', email: 'demo@autoclipper.local', name: 'Demo User', role: 'USER', projectsCount: 3, createdAt: new Date().toISOString() },
      { id: '2', email: 'admin@autoclipper.local', name: 'Admin', role: 'ADMIN', projectsCount: 12, createdAt: new Date().toISOString() },
    ]));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Users Management</h2>
      <Card><CardContent className="p-0"><div className="overflow-auto"><table className="w-full text-sm"><thead className="border-b border-zinc-800"><tr className="text-left text-zinc-400"><th className="p-3">Email</th><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Projects</th><th className="p-3">Actions</th></tr></thead><tbody>{users.map(u=><tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50"><td className="p-3">{u.email}</td><td className="p-3">{u.name}</td><td className="p-3"><span className="px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 text-xs">{u.role}</span></td><td className="p-3">{u.projectsCount}</td><td className="p-3 flex gap-1"><Button size="sm" variant="outline">View</Button><Button size="sm" variant="outline" className="text-red-400">Suspend</Button></td></tr>)}</tbody></table></div></CardContent></Card>
    </div>
  );
}
