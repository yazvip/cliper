export type LogLevel = 'info' | 'warn' | 'error';
export interface LogEntry {
  level: LogLevel;
  service: string;
  message: string;
  userId?: string;
  projectId?: string;
  jobId?: string;
  meta?: any;
  timestamp: string;
}

export function logger(level: LogLevel, service: string, message: string, meta: { userId?: string; projectId?: string; jobId?: string; extra?: any } = {}) {
  const entry: LogEntry = {
    level, service, message,
    userId: meta.userId,
    projectId: meta.projectId,
    jobId: meta.jobId,
    meta: meta.extra,
    timestamp: new Date().toISOString()
  };
  const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[32m';
  console.log(`${color}[${entry.timestamp}] [${level.toUpperCase()}] [${service}] ${message}\x1b[0m`, meta.extra || '');
  return entry;
}
