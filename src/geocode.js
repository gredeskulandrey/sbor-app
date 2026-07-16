// Превращаем текстовый адрес ("Клуб «Кубик», Арбат, Москва") в координаты (широта/долгота)
// через Яндекс.Геокодер — так место встречи можно по-настоящему поставить точкой на карте.
const GEOCODER_KEY = import.meta.env.VITE_YANDEX_GEOCODER_API_KEY;

export async function geocodeAddress(fullAddress) {
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${GEOCODER_KEY}&geocode=${encodeURIComponent(fullAddress)}&format=json&results=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const found = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  if (!found) return null;
  const [lon, lat] = found.Point.pos.split(' ').map(Number);
  return { lat, lon };
}
