import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { CITIES, CITY_COORDS, catInfo } from '../../constants.js';
import { loadYmaps } from '../../loadYmaps.js';

export default function MapTab({ city, onCityChange, onOpenEvent }) {
  const [showCityList, setShowCityList] = useState(false);
  const [events, setEvents] = useState([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const ymaps3Ref = useRef(null);
  const markersRef = useRef([]); // храним свои маркеры, чтобы потом корректно их убирать

  // Загружаем события выбранного города
  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_online', false)
      .eq('city', city)
      .not('lat', 'is', null);
    setEvents(data || []);
  }

  // Создаём карту один раз
  useEffect(() => {
    let cancelled = false;
    loadYmaps().then((ymaps3) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      ymaps3Ref.current = ymaps3;
      const { YMap, YMapDefaultSchemeLayer, YMapLayer, YMapFeatureDataSource } = ymaps3;
      const c = CITY_COORDS[city] || CITY_COORDS['Москва'];

      const map = new YMap(mapContainerRef.current, {
        location: { center: [c.lon, c.lat], zoom: c.z },
      });
      // Только базовый слой схемы — без стандартного слоя интерактивных организаций/POI,
      // поэтому чужие заведения на карте не кликабельны и не открывают карточки Яндекса
      map.addChild(new YMapDefaultSchemeLayer());

      // Слой для наших собственных точек-событий
      const markersDataSource = new YMapFeatureDataSource({ id: 'events-source' });
      map.addChild(markersDataSource);
      map.addChild(new YMapLayer({ source: 'events-source', type: 'markers' }));

      mapRef.current = map;
      renderMarkers();
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Перецентровываем карту при смене города
  useEffect(() => {
    if (!mapRef.current) return;
    const c = CITY_COORDS[city] || CITY_COORDS['Москва'];
    mapRef.current.setLocation({ center: [c.lon, c.lat], zoom: c.z, duration: 300 });
  }, [city]);

  // Перерисовываем точки при изменении списка событий
  useEffect(() => {
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  function renderMarkers() {
    const ymaps3 = ymaps3Ref.current;
    const map = mapRef.current;
    if (!ymaps3 || !map) return;

    // Убираем старые точки (по своему списку, а не угадывая по внутренностям карты)
    markersRef.current.forEach((marker) => map.removeChild(marker));
    markersRef.current = [];

    events.forEach((e) => {
      const el = document.createElement('div');
      el.style.cssText = `
        width:36px; height:36px; border-radius:50% 50% 50% 0; transform:rotate(45deg);
        background:#ff6b57; display:flex; align-items:center; justify-content:center;
        box-shadow:0 6px 14px rgba(0,0,0,.4); cursor:pointer; font-size:16px;
      `;
      const inner = document.createElement('span');
      inner.textContent = catInfo(e.category).ic;
      inner.style.transform = 'rotate(-45deg)';
      el.appendChild(inner);
      el.onclick = () => onOpenEvent(e.id);

      const marker = new ymaps3.YMapMarker({ coordinates: [e.lon, e.lat] }, el);
      map.addChild(marker);
      markersRef.current.push(marker);
    });
  }

  if (showCityList) {
    return (
      <div>
        <div className="topbar"><h2>Выбери город</h2></div>
        <div>
          {CITIES.map((c) => (
            <div
              key={c}
              className={'city-item' + (city === c ? ' active' : '')}
              onClick={() => { onCityChange(c); setShowCityList(false); }}
            >
              <span>{c}</span>{city === c && <span>✓</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="topbar">
        <h2>Карта</h2>
        <div className="city-pill" onClick={() => setShowCityList(true)}>📍 {city}</div>
      </div>
      <div className="map-canvas">
        <div ref={mapContainerRef} className="map-live-frame" />
      </div>
      {events.length === 0 && (
        <div className="empty">Пока нет событий в этом городе — самое время создать своё!</div>
      )}
    </div>
  );
}
