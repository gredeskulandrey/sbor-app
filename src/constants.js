export const TOPICS = [
  { id: 'bars', label: 'Бары', ic: '🍸' },
  { id: 'rest', label: 'Рестораны', ic: '🍽️' },
  { id: 'concerts', label: 'Концерты', ic: '🎤' },
  { id: 'movies', label: 'Кино', ic: '🎬' },
  { id: 'museums', label: 'Музеи и выставки', ic: '🎭' },
  { id: 'sport', label: 'Спорт', ic: '⚽' },
  { id: 'yoga', label: 'Йога', ic: '🧘' },
  { id: 'boardgames', label: 'Настолки', ic: '🎲' },
  { id: 'travel', label: 'Путешествия', ic: '🧭' },
  { id: 'pcgames', label: 'Компьютерные игры', ic: '🎮' },
  { id: 'workshops', label: 'Мастер-классы', ic: '🛠️' },
  { id: 'picnics', label: 'Пикники', ic: '🧺' },
  { id: 'other', label: 'Другое', ic: '✨' },
];

export function catInfo(id) {
  return TOPICS.find((t) => t.id === id) || ONLINE_TAGS.find((t) => t.id === id) || { id, label: id, ic: '✨' };
}

// Отдельные темы, доступные только для онлайн-встреч
export const ONLINE_TAGS = [
  { id: 'pcgames', label: 'Компьютерные игры', ic: '🎮' },
  { id: 'coworking', label: 'Онлайн коворкинг', ic: '💻' },
  { id: 'itmeetup', label: 'IT-митап', ic: '👨‍💻' },
  { id: 'chat', label: 'Просто поболтать', ic: '💬' },
  { id: 'other', label: 'Другое', ic: '✨' },
];

// lon, lat, зум — центр каждого города для живой карты
export const CITY_COORDS = {
  'Москва': { lon: 37.6173, lat: 55.7558, z: 11 },
  'Санкт-Петербург': { lon: 30.3609, lat: 59.9311, z: 11 },
  'Краснодар': { lon: 38.9769, lat: 45.0355, z: 12 },
  'Ростов-на-Дону': { lon: 39.7015, lat: 47.2357, z: 12 },
  'Сочи': { lon: 39.7257, lat: 43.5855, z: 12 },
  'Казань': { lon: 49.1221, lat: 55.7963, z: 12 },
  'Екатеринбург': { lon: 60.6454, lat: 56.8389, z: 12 },
  'Новосибирск': { lon: 82.9346, lat: 55.0084, z: 11 },
  'Кемерово': { lon: 86.0621, lat: 55.3547, z: 12 },
  'Омск': { lon: 73.3645, lat: 54.9893, z: 11 },
  'Тюмень': { lon: 65.5343, lat: 57.1522, z: 12 },
};
export const CITIES = Object.keys(CITY_COORDS);

export function yandexMapEmbedUrl(city) {
  const c = CITY_COORDS[city] || CITY_COORDS['Москва'];
  return `https://yandex.ru/map-widget/v1/?ll=${c.lon}%2C${c.lat}&z=${c.z}&l=map`;
}
