import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import Loading from '../Loading.jsx';
import MapTab from './tabs/MapTab.jsx';
import EventsTab from './tabs/EventsTab.jsx';
import MyMeetingsTab from './tabs/MyMeetingsTab.jsx';
import ProfileTab from './tabs/ProfileTab.jsx';
import GatherForm from './GatherForm.jsx';
import EventDetail from './EventDetail.jsx';
import Chat from './Chat.jsx';
import AttendanceConfirm from './AttendanceConfirm.jsx';
import GuestAttendanceConfirm from './GuestAttendanceConfirm.jsx';
import { isEventPast } from '../isEventPast.js';

const TABS = [
  { id: 'map', ic: '🗺️', label: 'Карта' },
  { id: 'events', ic: '📋', label: 'Все события' },
  { id: 'my', ic: '👥', label: 'Мои встречи' },
  { id: 'profile', ic: '⚙️', label: 'Профиль' },
];

export default function AppShell({ onSignOut }) {
  const [tab, setTab] = useState('map');
  const [city, setCity] = useState('Москва');
  // overlay: null | {type:'gatherForm'} | {type:'eventDetail', eventId} | {type:'chat', eventId, eventTitle}
  const [overlay, setOverlay] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Встречи организатора, где явку ещё нужно подтвердить — показываем сразу при входе,
  // до карты и вкладок, пока все такие встречи не разобраны одна за другой.
  const [pendingAttendanceIds, setPendingAttendanceIds] = useState(null); // null = ещё не проверяли
  const [notifications, setNotifications] = useState([]); // уведомления об отклонении/отмене
  const [pendingGuestConfirms, setPendingGuestConfirms] = useState([]); // прошедшие встречи-гость, где я ещё не ответил(а)

  useEffect(() => {
    checkPendingAttendance();
    checkNotifications();
    checkPendingGuestConfirms();
  }, []);

  async function checkPendingGuestConfirms() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('event_attendees')
      .select('events(*)')
      .eq('user_id', session.user.id)
      .is('guest_confirmed_attended', null);
    const events = (data || []).map((row) => row.events).filter(Boolean).filter((e) => isEventPast(e));
    setPendingGuestConfirms(events);
  }

  async function checkNotifications() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('user_notifications')
      .select('id, message')
      .eq('user_id', session.user.id)
      .eq('seen', false)
      .order('created_at', { ascending: true });
    setNotifications(data || []);
  }

  async function dismissNotification(id) {
    await supabase.from('user_notifications').update({ seen: true }).eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function checkPendingAttendance() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setPendingAttendanceIds([]); return; }

    const { data: organized } = await supabase
      .from('events')
      .select('id, event_date, event_time, attendance_confirmed')
      .eq('organizer_id', session.user.id)
      .eq('attendance_confirmed', false);

    const pastOnes = (organized || []).filter((e) => isEventPast(e));
    if (pastOnes.length === 0) { setPendingAttendanceIds([]); return; }

    // Для каждой прошедшей неподтверждённой встречи проверяем, были ли вообще гости
    const withGuests = [];
    for (const e of pastOnes) {
      const { count } = await supabase
        .from('event_attendees')
        .select('user_id', { count: 'exact', head: true })
        .eq('event_id', e.id);
      if (count && count > 0) withGuests.push(e.id);
    }
    setPendingAttendanceIds(withGuests);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  function openEvent(eventId) {
    setOverlay({ type: 'eventDetail', eventId });
  }

  function openChat(eventId, eventTitle) {
    setOverlay({ type: 'chat', eventId, eventTitle });
  }

  function closeOverlay() {
    setOverlay(null);
    setRefreshKey((k) => k + 1); // чтобы списки обновились (новая встреча / новый статус участия)
    checkNotifications();
  }

  // Пока не проверили или пока остались неподтверждённые явки — это первый экран, без исключений
  if (pendingAttendanceIds === null) {
    return <Loading />;
  }

  let mainContent;
  if (pendingAttendanceIds.length > 0) {
    mainContent = (
      <AttendanceConfirm
        eventId={pendingAttendanceIds[0]}
        onDone={() => setPendingAttendanceIds((prev) => prev.slice(1))}
      />
    );
  } else if (overlay?.type === 'gatherForm') {
    mainContent = <GatherForm city={city} onBack={closeOverlay} onCreated={closeOverlay} />;
  } else if (overlay?.type === 'eventDetail') {
    mainContent = (
      <EventDetail
        eventId={overlay.eventId}
        onBack={closeOverlay}
        onOpenChat={(eventTitle) => openChat(overlay.eventId, eventTitle)}
      />
    );
  } else if (overlay?.type === 'chat') {
    mainContent = (
      <Chat
        eventId={overlay.eventId}
        eventTitle={overlay.eventTitle}
        onBack={() => setOverlay({ type: 'eventDetail', eventId: overlay.eventId })}
      />
    );
  } else {
    mainContent = (
      <>
        <div className="tab-content modal-fade" key={tab}>
          {tab === 'map' && <MapTab key={refreshKey} city={city} onCityChange={setCity} onOpenEvent={openEvent} />}
          {tab === 'events' && <EventsTab key={refreshKey} city={city} onOpenEvent={openEvent} />}
          {tab === 'my' && <MyMeetingsTab key={refreshKey} onOpenEvent={openEvent} />}
          {tab === 'profile' && <ProfileTab onSignOut={handleSignOut} />}
        </div>
        {tab !== 'profile' && (
          <div style={{ padding: '0 16px 10px' }}>
            <button className="btn btn-primary" onClick={() => setOverlay({ type: 'gatherForm' })}>🤝 Собрать встречу</button>
          </div>
        )}
        <div className="tabbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'tabbtn' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
            >
              <div className="ic">{t.ic}</div>
              <div>{t.label}</div>
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      {mainContent}

      {/* Уведомление об отклонении/отмене встречи — показываем поверх чего угодно,
          но не блокируем работу с приложением, просто "Понятно" и дальше */}
      {notifications.length > 0 && (
        <div className="modal-fade" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--ink)', border: '1px solid var(--stroke)', borderRadius: 18, padding: 20, maxWidth: 320 }}>
            <div style={{ fontSize: 28, marginBottom: 12, textAlign: 'center' }}>😔</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-dim)', marginBottom: 18, textAlign: 'center' }}>
              {notifications[0].message}
            </p>
            <button className="btn btn-primary" onClick={() => dismissNotification(notifications[0].id)}>Понятно</button>
          </div>
        </div>
      )}

      {/* Вопрос гостю "ты правда был(а)?" — показываем по одному, после того как
          уведомления об отклонении/отмене уже разобраны, чтобы окна не накладывались */}
      {notifications.length === 0 && pendingGuestConfirms.length > 0 && (
        <GuestAttendanceConfirm
          event={pendingGuestConfirms[0]}
          onDone={() => setPendingGuestConfirms((prev) => prev.slice(1))}
        />
      )}
    </div>
  );
}
