'use client';
import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UploadPage() {
  const [file, setFile] = useState<File|null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('title', file.name.replace(/\.[^/.]+$/, ''));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/videos/upload');
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded/e.total)*100)); };
    xhr.onload = () => {
      if (xhr.status===200) { alert('Upload success! Project created.'); setFile(null); setProgress(0); }
      else alert('Upload failed: ' + xhr.responseText);
    };
    xhr.send(form);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Upload Video</h1>
      <Card>
        <CardHeader><CardTitle>Drag & Drop Video</CardTitle><p className="text-sm text-zinc-400">Support MP4, MOV, WEBM, MKV, AVI. Max 500MB.</p></CardHeader>
        <CardContent>
          <div onDragOver={e=>{e.preventDefault(); setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files[0]; if(f) setFile(f);}} className={`border-2 border-dashed rounded-2xl p-12 text-center transition ${dragOver?'border-violet-600 bg-violet-600/10':'border-zinc-700 bg-zinc-900'}`}>
            {!file ? (
              <><Upload className="w-12 h-12 mx-auto text-zinc-500 mb-4" /><p className="mb-4">Drop video here or click to browse</p><Button variant="outline" onClick={()=>inputRef.current?.click()}>Choose File</Button><input ref={inputRef} type="file" accept="video/*" hidden onChange={e=> setFile(e.target.files?.[0]||null)} /></>
            ) : (
              <div className="text-left bg-zinc-800 p-4 rounded-xl flex justify-between items-center"><div><div className="font-medium">{file.name}</div><div className="text-xs text-zinc-400">{(file.size/1024/1024).toFixed(2)} MB</div>{progress>0 && <div className="w-full h-2 bg-zinc-700 rounded-full mt-2"><div className="h-2 bg-violet-600 rounded-full" style={{width: `${progress}%`}} /></div>}</div><button onClick={()=>{setFile(null); setProgress(0);}}><X className="w-5 h-5" /></button></div>
            )}
          </div>
          {file && <div className="mt-6 flex gap-3"><Button onClick={handleUpload} className="flex-1">Upload & Create Project</Button><Button variant="outline" onClick={()=>{setFile(null); setProgress(0);}}>Cancel</Button></div>}
        </CardContent>
      </Card>
    </div>
  );
}
