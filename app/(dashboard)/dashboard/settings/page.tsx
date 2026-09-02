import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export default function SettingsPage() {
  return (<div className="space-y-6 max-w-3xl"><h1 className="text-2xl font-bold">Settings</h1>
    <Card><CardHeader><CardTitle>AI Settings</CardTitle><p className="text-sm text-zinc-400">Provider, API Key (encrypted, never exposed to browser), Model, Temperature</p></CardHeader><CardContent className="space-y-3"><Input placeholder="Provider: mock | openai | anthropic | groq" defaultValue="mock" /><Input placeholder="OpenAI API Key" type="password" /><Input placeholder="Model: gpt-4o-mini" defaultValue="gpt-4o-mini" /><Input placeholder="Temperature" defaultValue="0.7" /><Button>Save AI Settings</Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Video Settings</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="Default Resolution: 1080p" defaultValue="1080p" /><Input placeholder="Default FPS: 30" defaultValue="30" /><Button>Save</Button></CardContent></Card>
  </div>);
}
