import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { CITIES, CITY_COORDS, TOPICS, catInfo } from '../../constants.js';
import { loadYmaps } from '../../loadYmaps.js';
import { isEventPast } from '../../isEventPast.js';
import { formatEventDate, formatEventTime } from '../../formatDateTime.js';

export default function MapTab({ city, onCityChange, onOpenEvent }) {
  const [showCityList, setShowCityList] = useState(false);
  const [events, setEvents] = useState([]);
  const [filterTopic, setFilterTopic] = useState(null); // null = "Все"
  const [groupPopup, setGroupPopup] = useState(null); // список встреч на одном адресе, если их несколько
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const ymaps3Ref = useRef(null);
  const markersRef = useRef([]);

  // Один общий эффект на смену города — раньше перемещение камеры (с анимацией)
  // и перерисовка точек срабатывали двумя отдельными эффектами почти одновременно,
  // и, судя по всему, конфликтовали друг с другом, из-за чего карта "чернела".
  useEffect(() => {
    // Сначала убираем старые точки, чтобы они не остались висеть поверх новой локации
    if (mapRef.current) {
      markersRef.current.forEach((marker) => {
        try { mapRef.current.removeChild(marker); } catch { /* точка уже могла быть убрана */ }
      });
      markersRef.current = [];

      const c = CITY_COORDS[city] || CITY_COORDS['Москва'];
      try {
        // Без анимации (duration) — резкий переход надёжнее на разных устройствах
        mapRef.current.setLocation({ center: [c.lon, c.lat], zoom: c.z });
      } catch { /* если карта в этот момент ещё не готова — просто пропускаем кадр */ }
    }
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

  useEffect(() => {
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, filterTopic]);

  const visibleEvents = filterTopic ? events.filter((e) => e.category === filterTopic) : events;

  // Группируем встречи, если совпадает адрес ИЛИ название карточки — без учёта
  // регистра букв (раньше группировка зависела от координат геокодирования,
  // которые могли чуть отличаться даже для одного и того же места)
  function normalize(s) { return (s || '').trim().toLowerCase(); }

  function groupByLocation(list) {
    const groups = [];
    list.forEach((e) => {
      const addr = normalize(e.address);
      const title = normalize(e.title);
      const existing = groups.find((g) =>
        g.some((other) => (addr && normalize(other.address) === addr) || (title && normalize(other.title) === title))
      );
      if (existing) existing.push(e);
      else groups.push([e]);
    });
    return groups;
  }

  function renderMarkers() {
    const ymaps3 = ymaps3Ref.current;
    const map = mapRef.current;
    if (!ymaps3 || !map) return;

    markersRef.current.forEach((marker) => {
      try { map.removeChild(marker); } catch { /* уже могла быть убрана раньше */ }
    });
    markersRef.current = [];

    const groups = groupByLocation(visibleEvents);

    groups.forEach((group) => {
      const first = group[0];
      const el = document.createElement('div');
      el.style.cssText = `
        width:36px; height:36px; border-radius:50% 50% 50% 0; transform:rotate(45deg);
        background:#ff6b57; display:flex; align-items:center; justify-content:center;
        box-shadow:0 6px 14px rgba(0,0,0,.4); cursor:pointer; font-size:16px; position:relative;
      `;
      const inner = document.createElement('span');
      // Если на этой точке несколько встреч — показываем сразу цифру-количество вместо иконки темы
      inner.textContent = group.length > 1 ? String(group.length) : catInfo(first.category).ic;
      inner.style.cssText = 'transform:rotate(-45deg);' + (group.length > 1 ? 'font-weight:700; font-family:\'Unbounded\',sans-serif; font-size:15px; color:#1a0d09;' : '');
      el.appendChild(inner);

      el.onclick = () => {
        if (group.length === 1) onOpenEvent(first.id);
        else setGroupPopup(group);
      };

      const marker = new ymaps3.YMapMarker({ coordinates: [first.lon, first.lat] }, el);
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

      <div className="map-filters">
        <div className={'chip' + (!filterTopic ? ' active' : '')} onClick={() => setFilterTopic(null)}>Все</div>
        {TOPICS.map((t) => (
          <div key={t.id} className={'chip' + (filterTopic === t.id ? ' active' : '')} onClick={() => setFilterTopic(t.id)}>
            {t.ic} {t.label}
          </div>
        ))}
      </div>

      <div className="map-canvas" style={{ flex: 1 }}>
        <div ref={mapContainerRef} className="map-live-frame" />
      </div>

      {groupPopup && (
        <div
          onClick={() => setGroupPopup(null)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 999998, display: 'flex', alignItems: 'flex-end' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--ink)', width: '100%', borderRadius: '20px 20px 0 0', padding: '16px 16px 24px', maxHeight: '70%', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Встречи в этой точке ({groupPopup.length})</h3>
            {groupPopup.map((e) => (
              <div key={e.id} className="ticket" style={{ margin: '0 0 10px', cursor: 'pointer' }} onClick={() => { setGroupPopup(null); onOpenEvent(e.id); }}>
                <div className="ticket-cat">{catInfo(e.category).ic} {catInfo(e.category).label}</div>
                <h3>{e.title}</h3>
                <div className="meta">
                  <span>🕐 {formatEventDate(e.event_date)}, {formatEventTime(e.event_time)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список городов — накладывается ПОВЕРХ карты, а не заменяет её в разметке.
          Если сделать это отдельным return(), контейнер карты пересоздаётся при
          возврате назад, и живая карта Яндекса ломается (именно это и происходило). */}
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
