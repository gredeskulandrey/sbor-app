import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { catInfo } from '../constants.js';

export default function EventDetail({ eventId, onBack, onOpenChat }) {
  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setMyUserId(session?.user?.id || null);

    const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
    setEvent(ev);

    if (ev) {
      const { data: org } = await supabase.from('profiles').select('*').eq('id', ev.organizer_id).maybeSingle();
      setOrganizer(org);

      const { data: att } = await supabase
        .from('event_attendees')
        .select('user_id, profiles(first_name, last_name)')
        .eq('event_id', eventId);
      setAttendees(att || []);
    }
    setLoading(false);
  }

  const isOrganizer = event && myUserId === event.organizer_id;
  const isJoined = attendees.some((a) => a.user_id === myUserId);

  async function handleJoin() {
    setBusy(true);
    await supabase.from('event_attendees').insert({ event_id: eventId, user_id: myUserId });
    await load();
    setBusy(false);
  }

  async function handleLeave() {
    setBusy(true);
    await supabase.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', myUserId);
    await load();
    setBusy(false);
  }

  async function handleCancelMeeting() {
    if (attendees.length > 0) {
      const sure = window.confirm(
        `На встречу уже откликнулись участники (${attendees.length}). Если удалишь встречу, они не получат уведомление автоматически — предупреди их сам(а) в чате перед отменой. Точно хочешь отменить встречу?`
      );
      if (!sure) return;
    } else {
      const sure = window.confirm('Точно хочешь отменить эту встречу?');
      if (!sure) return;
    }
    setBusy(true);
    await supabase.from('events').delete().eq('id', eventId);
    setBusy(false);
    onBack();
  }

  if (loading) return <div className="center-msg">Загрузка...</div>;
  if (!event) return <div className="center-msg">Встреча не найдена</div>;

  const cat = catInfo(event.category);

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>

        <h2 style={{ fontSize: 20, marginBottom: 8 }}>{event.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 14 }}>{event.description}</p>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <div>{cat.ic} {cat.label}</div>
          <div>📍 {event.is_online ? event.online_link : `${event.venue_name}, ${event.address}`}</div>
          <div>🕐 {event.event_date} {event.event_time}</div>
          {event.age_restriction && <div>🔞 {event.age_restriction}</div>}
        </div>

        {organizer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 16, marginBottom: 16 }}>
            <div className="avatar" style={{ width: 44, height: 44 }}>🙂</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{organizer.first_name} {organizer.last_name || ''}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Организатор встречи</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 14, padding: 12, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Unbounded'", fontSize: 18, color: 'var(--coral)' }}>{attendees.length}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>Идут</div>
          </div>
          <div style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 14, padding: 12, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Unbounded'", fontSize: 18, color: 'var(--coral)' }}>{event.participant_limit}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>Лимит мест</div>
          </div>
        </div>

        {!isOrganizer && (
          isJoined ? (
            <>
              <button className="btn btn-ghost" style={{ marginBottom: 10 }} onClick={() => onOpenChat(event.title)}>Открыть чат встречи</button>
              <button className="btn btn-ghost" disabled={busy} onClick={handleLeave}>Покинуть встречу</button>
            </>
          ) : (
            <button className="btn btn-primary" disabled={busy} onClick={handleJoin}>Присоединиться</button>
          )
        )}

        {isOrganizer && (
          <button className="btn btn-ghost" style={{ marginBottom: 10 }} onClick={() => onOpenChat(event.title)}>Открыть чат встречи</button>
        )}

        {isOrganizer && (
          <button
            className="btn btn-ghost"
            style={{ color: '#ff8b7d', borderColor: '#5a2b28', marginBottom: 16 }}
            disabled={busy}
            onClick={handleCancelMeeting}
          >
            Отменить встречу
          </button>
        )}

        {isOrganizer && (
          <div>
            <h3 style={{ fontSize: 15, margin: '10px 0 8px' }}>Гости</h3>
            {attendees.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Пока никто не присоединился</div>}
            {attendees.map((a) => (
              <div key={a.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #22263a' }}>
                <div className="avatar" style={{ width: 32, height: 32 }}>🙂</div>
                <span style={{ fontSize: 13 }}>{a.profiles?.first_name} {a.profiles?.last_name || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
