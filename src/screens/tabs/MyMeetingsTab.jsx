import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { TOPICS, ONLINE_TAGS } from '../../constants.js';
import { isEventPast } from '../../isEventPast.js';
import Loading from '../../Loading.jsx';
import TicketCard from '../../TicketCard.jsx';

// Общий список тем для фильтра — тут вперемешку и офлайн, и онлайн встречи
const ALL_TOPICS = [...TOPICS, ...ONLINE_TAGS.filter((t) => !TOPICS.some((x) => x.id === t.id))];

export default function MyMeetingsTab({ onOpenEvent }) {
  const [subTab, setSubTab] = useState('upcoming');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState(null);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  function withCount(e) {
    return { ...e, attendee_count: e.event_attendees?.[0]?.count ?? 0 };
  }

  async function loadEvents() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setEvents([]); setLoading(false); return; }
    const userId = session.user.id;

    // Мои события-как-организатор
    const { data: organized } = await supabase.from('events').select('*, event_attendees(count)').eq('organizer_id', userId);
    // Встречи, где я гость
    const { data: attending } = await supabase
      .from('event_attendees')
      .select('events(*, event_attendees(count))')
      .eq('user_id', userId);
    const guestEvents = (attending || []).map((row) => row.events).filter(Boolean);

    if (subTab === 'created') {
      setEvents((organized || []).map(withCount).filter((e) => !isEventPast(e)));
    } else if (subTab === 'upcoming') {
      setEvents(guestEvents.map(withCount).filter((e) => !isEventPast(e)));
    } else {
      const byId = new Map();
      [...(organized || []), ...guestEvents].forEach((e) => { if (isEventPast(e)) byId.set(e.id, withCount(e)); });
      setEvents(Array.from(byId.values()));
    }
    setLoading(false);
  }

  const visibleEvents = filterTopic ? events.filter((e) => e.category === filterTopic) : events;

  return (
    <div>
      <div className="topbar"><h2>Мои встречи</h2></div>
      <div className="toggle2">
        <button className={subTab === 'upcoming' ? 'active' : ''} onClick={() => setSubTab('upcoming')}>Предстоящие</button>
        <button className={subTab === 'past' ? 'active' : ''} onClick={() => setSubTab('past')}>Прошедшие</button>
        <button className={subTab === 'created' ? 'active' : ''} onClick={() => setSubTab('created')}>Мои события</button>
      </div>

      <div className="map-filters">
        <div className={'chip' + (!filterTopic ? ' active' : '')} onClick={() => setFilterTopic(null)}>Все</div>
        {ALL_TOPICS.map((t) => (
          <div key={t.id} className={'chip' + (filterTopic === t.id ? ' active' : '')} onClick={() => setFilterTopic(t.id)}>
            {t.ic} {t.label}
          </div>
        ))}
      </div>

      {loading && <Loading />}
      {!loading && visibleEvents.length === 0 && (
        <div className="empty">
          {subTab === 'created' ? 'Тут пока пусто, самое время собрать встречу!' : 'Пусто. Загляни на карту, чтобы найти что-то интересное'}
        </div>
      )}
      {visibleEvents.map((e) => (
        <TicketCard key={e.id} event={e} onClick={() => onOpenEvent(e.id)} />
      ))}
    </div>
  );
}
