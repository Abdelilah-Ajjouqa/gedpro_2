import { proxyToApi } from '@/server/bff/proxy';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
async function handler(request: Request, { params }: Context) {
  const { path } = await params;
  return proxyToApi(request, path.map(encodeURIComponent).join('/'));
}
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
