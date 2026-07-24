// Подсказки при вводе адреса — идут через нашу собственную функцию (не напрямую
// в Яндекс из браузера, у него не работают прямые запросы с сайта).
// Обращаемся к функции напрямую через fetch, в обход supabase.functions.invoke —
// у неё почему-то тело запроса не долетало до сервера в этом конкретном случае.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function suggestAddress(query, city, cityCoords) {
  if (!query || query.trim().length < 2) return [];

  const body = { text: `${city}, ${query}` };
  if (cityCoords) {
    body.ll = `${cityCoords.lon},${cityCoords.lat}`;
    body.spn = '0.3,0.3';
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/suggest-address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}
