import { supabase } from './supabaseClient.js';

// Подсказки при вводе адреса — идут через нашу собственную функцию (не напрямую
// в Яндекс из браузера), потому что у этого сервиса Яндекса не работают
// прямые запросы с сайта.
export async function suggestAddress(query, city, cityCoords) {
  if (!query || query.trim().length < 2) return [];

  const body = { text: `${city}, ${query}` };
  if (cityCoords) {
    body.ll = `${cityCoords.lon},${cityCoords.lat}`;
    body.spn = '0.3,0.3';
  }

  const { data, error } = await supabase.functions.invoke('suggest-address', { body });
  if (error || !data?.results) return [];
  return data.results;
}
