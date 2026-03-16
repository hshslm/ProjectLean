import { supabase } from '@/integrations/supabase/client';

export async function uploadMealImage(
  base64DataUrl: string,
  userId: string
): Promise<string | null> {
  try {
    // Convert base64 data URL to Blob
    const res = await fetch(base64DataUrl);
    const blob = await res.blob();

    const filename = `${userId}/${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('meal-images')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('meal-images')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload meal image:', err);
    return null;
  }
}
