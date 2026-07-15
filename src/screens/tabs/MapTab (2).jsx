import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { CITIES, TOPICS, catInfo, yandexMapEmbedUrl } from '../../constants.js';

export default function MapTab({ city, onCityChange, onOpenEvent }) {
  const [showCityList, setShowCityList] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  async function loadEvents() {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_online', false)
      .eq('city', city);
    setEvents(data || []);
    setLoading(false);
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
        <iframe
          className="map-live-frame"
          src={yandexMapEmbedUrl(city)}
          title="map"
          loading="lazy"
        />
      </div>
      {!loading && events.length === 0 && (
        <div className="empty">Пока нет событий в этом городе — самое время создать своё!</div>
      )}
      {events.map((e) => (
        <div className="ticket" key={e.id} onClick={() => onOpenEvent(e.id)} style={{ cursor: 'pointer' }}>
          <div className="ticket-cat">{catInfo(e.category).ic} {catInfo(e.category).label}</div>
          <h3>{e.title}</h3>
          <div className="meta">
            <span>📍 {e.address || e.venue_name}</span>
            <span>🕐 {e.event_date} {e.event_time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
