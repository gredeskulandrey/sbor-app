import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { catInfo } from '../constants.js';
import { isEventPast } from '../isEventPast.js';
import { formatEventDate, formatEventTime } from '../formatDateTime.js';
import Avatar from '../Avatar.jsx';
import Loading from '../Loading.jsx';
import PublicProfile from './PublicProfile.jsx';
import ReportEvent from './ReportEvent.jsx';

export default function EventDetail({ eventId, onBack, onOpenChat }) {
  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photoMap, setPhotoMap] = useState({});
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [showReportEvent, setShowReportEvent] = useState(false);

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
        .select('user_id, attended, profiles(first_name, last_name)')
        .eq('event_id', eventId);
      const attendeesList = att || [];
      setAttendees(attendeesList);

      const allIds = [ev.organizer_id, ...attendeesList.map((a) => a.user_id)];
      const { data: photoRows } = await supabase
        .from('profile_photos')
        .select('profile_id, photo_url, sort_order')
        .in('profile_id', allIds)
        .order('sort_order', { ascending: true });
      const map = {};
      (photoRows || []).forEach((p) => {
        if (!map[p.profile_id]) map[p.profile_id] = p.photo_url;
      });
      setPhotoMap(map);
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

  async function handleRejectGuest(guest) {
    const name = `${guest.profiles?.first_name || ''} ${guest.profiles?.last_name || ''}`.trim() || 'этого гостя';
    const sure = window.confirm(`Убрать ${name} со встречи? Встреча пропадёт из его(её) списка.`);
    if (!sure) return;
    setBusy(true);
    // Сообщаем гостю, что его отклонили — до того, как удалить его из встречи
    await supabase.from('user_notifications').insert({
      user_id: guest.user_id,
      event_id: eventId,
      message: `К сожалению, тебя отклонили как гостя на встрече «${event.title}». Не переживай — самое время найти другое событие поблизости или собрать своё!`,
    });
    // Запоминаем отказ — чтобы эта встреча больше не показывалась этому гостю
    // ни на карте, ни в общем списке событий
    await supabase.from('event_rejections').insert({ event_id: eventId, user_id: guest.user_id });
    await supabase.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', guest.user_id);
    await load();
    setBusy(false);
  }

  async function handleCancelMeeting() {
    if (attendees.length > 0) {
      const sure = window.confirm(
        `На встречу уже откликнулись участники (${attendees.length}). Они автоматически получат уведомление об отмене. Точно хочешь отменить встречу?`
      );
      if (!sure) return;
    } else {
      const sure = window.confirm('Точно хочешь отменить эту встречу?');
      if (!sure) return;
    }
    setBusy(true);
    // Сообщаем всем гостям об отмене — обязательно до удаления самой встречи,
    // иначе проверка доступа не даст записать уведомление
    for (const a of attendees) {
      await supabase.from('user_notifications').insert({
        user_id: a.user_id,
        event_id: eventId,
        message: `К сожалению, встреча «${event.title}», на которую ты записался(-ась), была отменена организатором. Самое время найти другое событие поблизости или собрать своё!`,
      });
    }
    await supabase.from('events').delete().eq('id', eventId);
    setBusy(false);
    onBack();
  }

  if (viewingProfileId) {
    return <PublicProfile profileId={viewingProfileId} onBack={() => setViewingProfileId(null)} />;
  }

  if (showReportEvent) {
    return <ReportEvent eventId={eventId} onBack={() => setShowReportEvent(false)} />;
  }

  if (loading) return <Loading />;
  if (!event) return <div className="center-msg">Встреча не найдена</div>;

  const cat = catInfo(event.category);

  return (
    <div className="screen">
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="backbtn" onClick={onBack}>←</div>
          {!isOrganizer && (
            <div onClick={() => setShowReportEvent(true)} style={{ fontSize: 20, cursor: 'pointer', color: '#ff8b7d' }} title="Пожаловаться на встречу">
              ⚠️
            </div>
          )}
        </div>

        <h2 style={{ fontSize: 20, marginBottom: 8 }}>{event.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 14 }}>{event.description}</p>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <div>{cat.ic} {cat.label}</div>
          <div>📍 {event.is_online ? event.online_link : `${event.venue_name}, ${event.address}`}</div>
          {!event.is_online && event.venue_link && <div>🔗 {event.venue_link}</div>}
          <div>🕐 {formatEventDate(event.event_date)}, {formatEventTime(event.event_time)}</div>
          {event.rules && <div>📋 Правила: {event.rules}</div>}
          {event.age_restriction && <div>🔞 {event.age_restriction}</div>}
        </div>

        {organizer && (
          <div
            onClick={() => setViewingProfileId(event.organizer_id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 16, marginBottom: 16, cursor: 'pointer' }}
          >
            <Avatar photoUrl={photoMap[event.organizer_id]} size={44} />
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

        {isOrganizer && !isEventPast(event) && (
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
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Гости</h3>
            {attendees.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>Пока никто не присоединился</div>}
            {attendees.map((a) => (
              <div key={a.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #22263a' }}>
                <div
                  onClick={() => setViewingProfileId(a.user_id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}
                >
                  <Avatar photoUrl={photoMap[a.user_id]} size={32} />
                  <span style={{ fontSize: 13 }}>{a.profiles?.first_name} {a.profiles?.last_name || ''}</span>
                </div>
                {event.attendance_confirmed && (
                  <span style={{ fontSize: 11, marginLeft: 8, color: a.attended ? 'var(--mint)' : 'var(--text-faint)' }}>
                    {a.attended ? '✓ был(а)' : 'не пришёл(-ла)'}
                  </span>
                )}
                {!isEventPast(event) && (
                  <button
                    onClick={() => handleRejectGuest(a)}
                    disabled={busy}
                    style={{ marginLeft: 8, background: 'none', border: '1px solid #5a2b28', color: '#ff8b7d', borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}
                  >
                    Отклонить
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
