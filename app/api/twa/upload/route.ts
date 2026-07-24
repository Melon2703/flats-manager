import { NextResponse } from 'next/server';
import { authenticateTWA } from '@/lib/security';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  if (!authenticateTWA(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `receipt-${Date.now()}-${file.name || 'photo.jpg'}`;

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        const { data, error } = await supabase.storage.from('receipts').upload(fileName, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
          return NextResponse.json({ url: publicUrlData.publicUrl });
        }
      }

      // Fallback data URL for dev/test
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`;
      return NextResponse.json({ url: dataUrl });
    } else {
      const body = await req.json();
      if (body.receipt_base64) {
        const fileName = `receipt-${Date.now()}.jpg`;
        return NextResponse.json({ url: `data:image/jpeg;base64,${body.receipt_base64}` });
      }
      return NextResponse.json({ error: 'Unsupported media format' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
