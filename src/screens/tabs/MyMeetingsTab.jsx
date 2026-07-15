import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { catInfo } from '../../constants.js';

export default function MyMeetingsTab() {
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

    if (subTab === 'created') {
      const { data } = await supabase.from('events').select('*').eq('organizer_id', userId);
      setEvents(data || []);
    } else {
      // upcoming/past — встречи, где я гость (через event_attendees)
      const { data } = await supabase
        .from('event_attendees')
        .select('events(*)')
        .eq('user_id', userId);
      setEvents((data || []).map((row) => row.events).filter(Boolean));
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
      {!loading && events.length === 0 && (
        <div className="empty">
          {subTab === 'created' ? 'Тут пока пусто, самое время собрать встречу!' : 'Пусто. Загляни на карту, чтобы найти что-то интересное'}
        </div>
      )}
      {events.map((e) => (
        <div className="ticket" key={e.id}>
          <div className="ticket-cat">{catInfo(e.category).ic} {catInfo(e.category).label}</div>
          <h3>{e.title}</h3>
          <div className="meta">
            <span>📍 {e.is_online ? e.online_link : (e.address || e.venue_name)}</span>
            <span>🕐 {e.event_date} {e.event_time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
