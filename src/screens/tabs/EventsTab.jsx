import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { CITY_PREPOSITIONAL, TOPICS, ONLINE_TAGS } from '../../constants.js';
import { isEventPast } from '../../isEventPast.js';
import Loading from '../../Loading.jsx';
import TicketCard from '../../TicketCard.jsx';

export default function EventsTab({ city, onOpenEvent }) {
  const [mode, setMode] = useState('offline');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState(null);

  useEffect(() => {
    setFilterTopic(null); // при смене формата фильтр по теме сбрасываем — темы разные для офлайн/онлайн
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, city]);

  async function loadEvents() {
    setLoading(true);
    let query = supabase.from('events').select('*, event_attendees(count)').eq('is_online', mode === 'online');
    if (mode === 'offline') query = query.eq('city', city);
    const { data } = await query;
    const withCounts = (data || []).map((e) => ({ ...e, attendee_count: e.event_attendees?.[0]?.count ?? 0 }));
    // Прошедшие встречи не показываем в общем списке — им тут больше не место
    setEvents(withCounts.filter((e) => !isEventPast(e)));
    setLoading(false);
  }

  const currentTopics = mode === 'online' ? ONLINE_TAGS : TOPICS;
  const visibleEvents = filterTopic ? events.filter((e) => e.category === filterTopic) : events;

  return (
    <div>
      <div className="topbar">
        <h2>{mode === 'offline' ? `Все события в ${CITY_PREPOSITIONAL[city] || city}` : 'Все события онлайн'}</h2>
      </div>
      <div className="toggle2">
        <button className={mode === 'offline' ? 'active' : ''} onClick={() => setMode('offline')}>Офлайн</button>
        <button className={mode === 'online' ? 'active' : ''} onClick={() => setMode('online')}>Онлайн</button>
      </div>

      <div className="map-filters">
        <div className={'chip' + (!filterTopic ? ' active' : '')} onClick={() => setFilterTopic(null)}>Все</div>
        {currentTopics.map((t) => (
          <div key={t.id} className={'chip' + (filterTopic === t.id ? ' active' : '')} onClick={() => setFilterTopic(t.id)}>
            {t.ic} {t.label}
          </div>
        ))}
      </div>

      {loading && <Loading />}
      {!loading && visibleEvents.length === 0 && (
        <div className="empty">Событий пока нет — попробуй другой фильтр или создай своё.</div>
      )}
      {visibleEvents.map((e) => (
        <TicketCard key={e.id} event={e} onClick={() => onOpenEvent(e.id)} />
      ))}
    </div>
  );
}
