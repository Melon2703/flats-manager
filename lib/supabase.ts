import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadMediaToStorage(
  fileBuffer: Buffer | ArrayBuffer | Uint8Array,
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const bucketName = 'flats-media';
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  ) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, { contentType, upsert: true });

      if (!error && data) {
        const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      }
    } catch (err) {
      console.error('Supabase storage upload error:', err);
    }
  }

  return `https://placeholder.supabase.co/storage/v1/object/public/${bucketName}/${fileName}`;
}

