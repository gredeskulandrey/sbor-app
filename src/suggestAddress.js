// Подсказки при вводе адреса (Яндекс.Геосаджест) — помогает пользователю быстро
// найти нужную улицу и дом, не печатая адрес целиком вручную.
const SUGGEST_KEY = import.meta.env.VITE_YANDEX_SUGGEST_API_KEY;

export async function suggestAddress(query, city, cityCoords) {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    apikey: SUGGEST_KEY,
    text: `${city}, ${query}`,
    types: 'street,house',
    countries: 'ru',
    results: '6',
  });
  if (cityCoords) {
    params.set('ll', `${cityCoords.lon},${cityCoords.lat}`);
    params.set('spn', '0.3,0.3');
  }

  const res = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map((r) => ({
    text: r.title?.text || '',
    subtitle: r.subtitle?.text || '',
  }));
}
