import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { CITIES, CITY_COORDS, catInfo } from '../../constants.js';
import { loadYmaps } from '../../loadYmaps.js';
import { isEventPast } from '../../isEventPast.js';

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
    setEvents((data || []).filter((e) => !isEventPast(e)));
  }

  // Создаём карту один раз — контейнер карты теперь ВСЕГДА остаётся в разметке
  // (список городов накладывается поверх), поэтому карта больше не "теряет" свой div
  useEffect(() => {
    let cancelled = false;
    loadYmaps().then((ymaps3) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      ymaps3Ref.current = ymaps3;
      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = ymaps3;
      const c = CITY_COORDS[city] || CITY_COORDS['Москва'];

      const map = new YMap(mapContainerRef.current, {
        location: { center: [c.lon, c.lat], zoom: c.z },
      });
      map.addChild(new YMapDefaultSchemeLayer());
      map.addChild(new YMapDefaultFeaturesLayer());

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
      <div className="topbar">
        <h2>Карта</h2>
        <div className="city-pill" onClick={() => setShowCityList(true)}>📍 {city}</div>
      </div>
      <div className="map-canvas" style={{ flex: 1 }}>
        <div ref={mapContainerRef} className="map-live-frame" />
      </div>

      {/* Список городов — накладывается ПОВЕРХ карты (в т.ч. поверх собственных
          служебных кнопок Яндекса вроде "Открыть в Яндекс.Картах"), а не заменяет
          карту в разметке, иначе контейнер карты пропадает из DOM и ломается */}
      {showCityList && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--ink)', zIndex: 999999, display: 'flex', flexDirection: 'column' }}>
          <div className="topbar"><h2>Выбери город</h2></div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
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
      )}
    </div>
  );
}
