import { NextResponse, type NextRequest } from 'next/server';
import { authenticateTWA } from '@/lib/auth';

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/twa')) {
    if (!authenticateTWA(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/twa/:path*',
};
