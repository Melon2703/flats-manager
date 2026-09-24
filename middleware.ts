import { NextResponse, type NextRequest } from 'next/server';
import { authenticateTWA } from '@/lib/auth';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/twa')) {
    if (!(await authenticateTWA(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  return await updateSession(req);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

