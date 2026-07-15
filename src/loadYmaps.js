// Загружает скрипт Яндекс.Карт (JS API v3) один раз и переиспользует между экранами.
const YMAPS_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

let loadingPromise = null;

export function loadYmaps() {
  if (window.ymaps3) return window.ymaps3.ready.then(() => window.ymaps3);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${YMAPS_KEY}&lang=ru_RU`;
    script.onload = () => {
      window.ymaps3.ready.then(() => resolve(window.ymaps3));
    };
    script.onerror = () => reject(new Error('Не удалось загрузить Яндекс.Карты'));
    document.head.appendChild(script);
  });

  return loadingPromise;
}
