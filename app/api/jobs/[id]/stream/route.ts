import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const jobId = params.id;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial
      send({ type: 'connected', jobId, progress: 0, status: 'QUEUED' });

      let lastStatus = '';
      let interval = setInterval(async () => {
        try {
          const job = await prisma.processingJob.findFirst({
            where: { OR: [{ id: jobId }, { bullMqJobId: jobId }] }
          });
          if (!job) {
            send({ type: 'error', message: 'Job not found' });
            clearInterval(interval);
            controller.close();
            return;
          }

          if (job.status !== lastStatus || job.progress !== 0) {
            send({
              type: 'progress',
              jobId: job.id,
              bullMqJobId: job.bullMqJobId,
              status: job.status,
              progress: job.progress,
              error: job.error,
              result: job.result
            });
            lastStatus = job.status;
          }

          if (job.status === 'COMPLETED' || job.status === 'FAILED') {
            send({ type: 'done', status: job.status, progress: 100 });
            clearInterval(interval);
            controller.close();
          }
        } catch (e:any) {
          send({ type: 'error', message: e.message });
        }
      }, 1000);

      // Cleanup on abort
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
