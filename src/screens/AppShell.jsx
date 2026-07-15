import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import MapTab from './tabs/MapTab.jsx';
import EventsTab from './tabs/EventsTab.jsx';
import MyMeetingsTab from './tabs/MyMeetingsTab.jsx';
import ProfileTab from './tabs/ProfileTab.jsx';

const TABS = [
  { id: 'map', ic: '🗺️', label: 'Карта' },
  { id: 'events', ic: '📋', label: 'Все события' },
  { id: 'my', ic: '👥', label: 'Мои встречи' },
  { id: 'profile', ic: '⚙️', label: 'Профиль' },
];

export default function AppShell({ onSignOut }) {
  const [tab, setTab] = useState('map');
  const [city, setCity] = useState('Москва');

  async function handleSignOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  return (
    <div className="app-shell">
      <div className="tab-content">
        {tab === 'map' && <MapTab city={city} onCityChange={setCity} />}
        {tab === 'events' && <EventsTab city={city} />}
        {tab === 'my' && <MyMeetingsTab />}
        {tab === 'profile' && <ProfileTab onSignOut={handleSignOut} />}
      </div>
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
