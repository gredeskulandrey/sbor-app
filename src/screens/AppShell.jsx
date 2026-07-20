import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import MapTab from './tabs/MapTab.jsx';
import EventsTab from './tabs/EventsTab.jsx';
import MyMeetingsTab from './tabs/MyMeetingsTab.jsx';
import ProfileTab from './tabs/ProfileTab.jsx';
import GatherForm from './GatherForm.jsx';
import EventDetail from './EventDetail.jsx';
import Chat from './Chat.jsx';
import AttendanceConfirm from './AttendanceConfirm.jsx';
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

  useEffect(() => {
    checkPendingAttendance();
  }, []);

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
  }

  // Пока не проверили или пока остались неподтверждённые явки — это первый экран, без исключений
  if (pendingAttendanceIds === null) {
    return <div className="center-msg">Загрузка...</div>;
  }
  if (pendingAttendanceIds.length > 0) {
    return (
      <div className="app-shell">
        <AttendanceConfirm
          eventId={pendingAttendanceIds[0]}
          onDone={() => setPendingAttendanceIds((prev) => prev.slice(1))}
        />
      </div>
    );
  }

  if (overlay?.type === 'gatherForm') {
    return (
      <div className="app-shell">
        <GatherForm city={city} onBack={closeOverlay} onCreated={closeOverlay} />
      </div>
    );
  }
  if (overlay?.type === 'eventDetail') {
    return (
      <div className="app-shell">
        <EventDetail
          eventId={overlay.eventId}
          onBack={closeOverlay}
          onOpenChat={(eventTitle) => openChat(overlay.eventId, eventTitle)}
        />
      </div>
    );
  }
  if (overlay?.type === 'chat') {
    return (
      <div className="app-shell">
        <Chat
          eventId={overlay.eventId}
          eventTitle={overlay.eventTitle}
          onBack={() => setOverlay({ type: 'eventDetail', eventId: overlay.eventId })}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="tab-content">
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
    </div>
  );
}
