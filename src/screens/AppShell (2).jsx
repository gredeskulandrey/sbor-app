import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import MapTab from './tabs/MapTab.jsx';
import EventsTab from './tabs/EventsTab.jsx';
import MyMeetingsTab from './tabs/MyMeetingsTab.jsx';
import ProfileTab from './tabs/ProfileTab.jsx';
import GatherForm from './GatherForm.jsx';
import EventDetail from './EventDetail.jsx';

const TABS = [
  { id: 'map', ic: '🗺️', label: 'Карта' },
  { id: 'events', ic: '📋', label: 'Все события' },
  { id: 'my', ic: '👥', label: 'Мои встречи' },
  { id: 'profile', ic: '⚙️', label: 'Профиль' },
];

export default function AppShell({ onSignOut }) {
  const [tab, setTab] = useState('map');
  const [city, setCity] = useState('Москва');
  const [overlay, setOverlay] = useState(null); // null | 'gatherForm' | { eventId }
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleSignOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  function openEvent(eventId) {
    setOverlay({ eventId });
  }

  function closeOverlay() {
    setOverlay(null);
    setRefreshKey((k) => k + 1); // чтобы списки обновились (новая встреча / новый статус участия)
  }

  if (overlay === 'gatherForm') {
    return (
      <div className="app-shell">
        <GatherForm city={city} onBack={closeOverlay} onCreated={closeOverlay} />
      </div>
    );
  }
  if (overlay && overlay.eventId) {
    return (
      <div className="app-shell">
        <EventDetail eventId={overlay.eventId} onBack={closeOverlay} />
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
          <button className="btn btn-primary" onClick={() => setOverlay('gatherForm')}>🤝 Собрать встречу</button>
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
