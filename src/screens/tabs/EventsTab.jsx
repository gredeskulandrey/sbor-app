import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { catInfo, CITY_PREPOSITIONAL } from '../../constants.js';
import { isEventPast } from '../../isEventPast.js';
import { formatEventDate, formatEventTime } from '../../formatDateTime.js';
import Loading from '../../Loading.jsx';

export default function EventsTab({ city, onOpenEvent }) {
  const [mode, setMode] = useState('offline');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, city]);

  async function loadEvents() {
    setLoading(true);
    let query = supabase.from('events').select('*').eq('is_online', mode === 'online');
    if (mode === 'offline') query = query.eq('city', city);
    const { data } = await query;
    // Прошедшие встречи не показываем в общем списке — им тут больше не место
    setEvents((data || []).filter((e) => !isEventPast(e)));
    setLoading(false);
  }

  return (
    <div>
      <div className="topbar">
        <h2>{mode === 'offline' ? `Все события в ${CITY_PREPOSITIONAL[city] || city}` : 'Все события онлайн'}</h2>
      </div>
      <div className="toggle2">
        <button className={mode === 'offline' ? 'active' : ''} onClick={() => setMode('offline')}>Офлайн</button>
        <button className={mode === 'online' ? 'active' : ''} onClick={() => setMode('online')}>Онлайн</button>
      </div>
      {loading && <Loading />}
      {!loading && events.length === 0 && (
        <div className="empty">Событий пока нет — попробуй другой фильтр или создай своё.</div>
      )}
      {events.map((e) => (
        <div className="ticket" key={e.id} onClick={() => onOpenEvent(e.id)} style={{ cursor: 'pointer' }}>
          <div className="ticket-cat">{catInfo(e.category).ic} {catInfo(e.category).label}</div>
          <h3>{e.title}</h3>
          <div className="meta">
            <span>📍 {e.is_online ? e.online_link : (e.address || e.venue_name)}</span>
            <span>🕐 {formatEventDate(e.event_date)}, {formatEventTime(e.event_time)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
