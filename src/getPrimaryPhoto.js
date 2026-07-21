import { supabase } from './supabaseClient.js';

export async function getPrimaryPhoto(profileId) {
  const { data } = await supabase
    .from('profile_photos')
    .select('photo_url')
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.photo_url || null;
}
