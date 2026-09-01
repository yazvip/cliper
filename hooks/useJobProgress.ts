'use client';
import { useEffect, useState } from 'react';

export interface JobProgress {
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  progress: number;
  error?: string;
  result?: any;
}

export function useJobProgress(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress>({ status: 'QUEUED', progress: 0 });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    // Try SSE first, fallback to polling
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource(`/api/jobs/${jobId}/stream`);
      eventSource.onopen = () => setConnected(true);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'progress' || data.type === 'connected') {
            setProgress({ status: data.status || 'PROCESSING', progress: data.progress || 0, error: data.error, result: data.result });
          }
          if (data.type === 'done') {
            setProgress(prev => ({ ...prev, status: data.status, progress: 100 }));
            eventSource?.close();
          }
        } catch {}
      };
      eventSource.onerror = () => {
        // Fallback to polling
        eventSource?.close();
        pollInterval = setInterval(async () => {
          const res = await fetch(`/api/jobs/${jobId}`);
          const json = await res.json();
          if (json.status && json.data) {
            setProgress({ status: json.data.status, progress: json.data.progress, error: json.data.error });
            if (json.data.status === 'COMPLETED' || json.data.status === 'FAILED') {
              if (pollInterval) clearInterval(pollInterval);
            }
          }
        }, 2000);
      };
    } catch {
      // Polling fallback
      pollInterval = setInterval(async () => {
        const res = await fetch(`/api/jobs/${jobId}`);
        const json = await res.json();
        if (json.status && json.data) {
          setProgress({ status: json.data.status, progress: json.data.progress });
        }
      }, 2000);
    }

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [jobId]);

  return { progress, connected };
}
