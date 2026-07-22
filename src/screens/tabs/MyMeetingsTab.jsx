import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { catInfo } from '../../constants.js';
import { isEventPast } from '../../isEventPast.js';
import { formatEventDate, formatEventTime } from '../../formatDateTime.js';
import Loading from '../../Loading.jsx';

export default function MyMeetingsTab({ onOpenEvent }) {
  const [subTab, setSubTab] = useState('upcoming');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  async function loadEvents() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setEvents([]); setLoading(false); return; }
    const userId = session.user.id;

    // Мои события-как-организатор
    const { data: organized } = await supabase.from('events').select('*').eq('organizer_id', userId);
    // Встречи, где я гость
    const { data: attending } = await supabase
      .from('event_attendees')
      .select('events(*)')
      .eq('user_id', userId);
    const guestEvents = (attending || []).map((row) => row.events).filter(Boolean);

    if (subTab === 'created') {
      // Только ещё не прошедшие свои встречи — прошедшие переезжают во вкладку "Прошедшие"
      setEvents((organized || []).filter((e) => !isEventPast(e)));
    } else if (subTab === 'upcoming') {
      setEvents(guestEvents.filter((e) => !isEventPast(e)));
    } else {
      // Прошедшие — и там, где я был гостем, и там, где организатором, без дублей
      const byId = new Map();
      [...(organized || []), ...guestEvents].forEach((e) => { if (isEventPast(e)) byId.set(e.id, e); });
      setEvents(Array.from(byId.values()));
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="topbar"><h2>Мои встречи</h2></div>
      <div className="toggle2">
        <button className={subTab === 'upcoming' ? 'active' : ''} onClick={() => setSubTab('upcoming')}>Предстоящие</button>
        <button className={subTab === 'past' ? 'active' : ''} onClick={() => setSubTab('past')}>Прошедшие</button>
        <button className={subTab === 'created' ? 'active' : ''} onClick={() => setSubTab('created')}>Мои события</button>
      </div>
      {loading && <Loading />}
      {!loading && events.length === 0 && (
        <div className="empty">
          {subTab === 'created' ? 'Тут пока пусто, самое время собрать встречу!' : 'Пусто. Загляни на карту, чтобы найти что-то интересное'}
        </div>
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
