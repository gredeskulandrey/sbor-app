// Подсказки при вводе адреса — идут через нашу собственную функцию (не напрямую
// в Яндекс из браузера). Передаём данные через параметры в самой ссылке (а не
// в теле запроса) — тело запроса у нас почему-то стабильно не долетало до функции.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function suggestAddress(query, city, cityCoords) {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({ text: `${city}, ${query}` });
  if (cityCoords) {
    params.set('ll', `${cityCoords.lon},${cityCoords.lat}`);
    params.set('spn', '0.3,0.3');
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/suggest-address?${params.toString()}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}
