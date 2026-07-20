import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { catInfo, ACHIEVEMENTS } from '../../constants.js';
import { formatPhoneDisplay } from '../../formatPhoneDisplay.js';
import { computeAchievements } from '../../computeAchievements.js';
import SettingsScreen from '../SettingsScreen.jsx';

function calcAge(birthDateStr) {
  if (!birthDateStr) return null;
  const today = new Date();
  const bd = new Date(birthDateStr);
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

export default function ProfileTab({ onSignOut }) {
  const [profile, setProfile] = useState(null);
  const [identifier, setIdentifier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [achvExpanded, setAchvExpanded] = useState(false);

  const [guestCount, setGuestCount] = useState(0);
  const [organizerCount, setOrganizerCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(100);
  const [unlockedIds, setUnlockedIds] = useState(new Set());

  useEffect(() => {
    loadEverything();
  }, []);

  async function loadEverything() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const user = session.user;
    setIdentifier(user.phone ? `+${user.phone}` : user.email);

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(prof);

    // Постоянный журнал встреч — источник правды для статистики и ачивок
    const { data: meetings } = await supabase.from('completed_meetings').select('*').eq('user_id', user.id);
    const list = meetings || [];
    setGuestCount(list.filter((m) => m.role === 'guest').length);
    setOrganizerCount(list.filter((m) => m.role === 'organizer').length);

    // Явка: доля встреч (где я гость и организатор уже подтвердил итоги), на которых я реально был
    const { data: attRows } = await supabase
      .from('event_attendees')
      .select('attended, events!inner(attendance_confirmed)')
      .eq('user_id', user.id)
      .eq('events.attendance_confirmed', true);
    const confirmedRows = attRows || [];
    const rate = confirmedRows.length === 0 ? 100 : Math.round((confirmedRows.filter((r) => r.attended).length / confirmedRows.length) * 100);
    setAttendanceRate(rate);

    setUnlockedIds(computeAchievements({ meetings: list, attendanceRatePercent: rate, createdAt: prof?.created_at }));

    setLoading(false);
  }

  function handleProfileUpdated(updated) {
    setProfile(updated);
  }

  async function handleSignOut() {
    await onSignOut();
  }

  if (loading) return <div className="center-msg">Загрузка профиля...</div>;
  if (!profile) return <div className="center-msg">Не получилось загрузить профиль</div>;

  if (showSettings) {
    return (
      <SettingsScreen
        profile={profile}
        onBack={() => setShowSettings(false)}
        onProfileUpdated={handleProfileUpdated}
        onAccountDeleted={handleSignOut}
      />
    );
  }

  const age = calcAge(profile.birth_date);
  const ageLabel = profile.show_only_year
    ? new Date(profile.birth_date).getFullYear()
    : `${age} лет`;

  const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id) ? 0 : 1;
    const bUnlocked = unlockedIds.has(b.id) ? 0 : 1;
    return aUnlocked - bUnlocked;
  });
  const visibleAchievements = achvExpanded ? sortedAchievements : sortedAchievements.slice(0, 3);

  const isPhone = identifier && identifier.startsWith('+');

  return (
    <div>
      <div className="profile-hero">
        <div className="avatar">🙂</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 19 }}>{profile.first_name} {profile.last_name || ''}</h2>
            <div onClick={() => setShowSettings(true)} style={{ marginLeft: 'auto', fontSize: 18, cursor: 'pointer' }}>🔧</div>
          </div>
          {age !== null && <p style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{ageLabel}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, margin: '0 20px 16px' }}>
        <div className="stat-box">
          <div className="n">{guestCount}</div>
          <div className="l">Как гость</div>
        </div>
        <div className="stat-box">
          <div className="n">{organizerCount}</div>
          <div className="l">Как организатор</div>
        </div>
        <div className="stat-box">
          <div className="n">{attendanceRate}%</div>
          <div className="l">Явка</div>
        </div>
      </div>

      {profile.about && (
        <div style={{ margin: '0 20px 16px', padding: 14, background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 14, fontSize: 13, color: 'var(--text-dim)' }}>
          {profile.about}
        </div>
      )}

      <div style={{ margin: '0 20px 16px' }}>
        <h3 style={{ fontSize: 14, marginBottom: 10 }}>Достижения</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleAchievements.map((a) => {
            const unlocked = unlockedIds.has(a.id);
            return (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 12,
                opacity: unlocked ? 1 : 0.45,
              }}>
                <div style={{ fontSize: 20 }}>{a.ic}</div>
                <div style={{ fontSize: 13 }}>{a.title}</div>
              </div>
            );
          })}
        </div>
        {sortedAchievements.length > 3 && (
          <div
            style={{ textAlign: 'center', fontSize: 12, color: 'var(--coral)', marginTop: 10, cursor: 'pointer' }}
            onClick={() => setAchvExpanded((v) => !v)}
          >
            {achvExpanded ? 'Свернуть' : `Ещё (${sortedAchievements.length - 3})`}
          </div>
        )}
      </div>

      <div style={{ margin: '0 20px' }}>
        <div className="settings-row">
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Темы интересов</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              {(profile.topics || []).map((t) => catInfo(t).label).join(', ') || 'Не выбраны'}
            </div>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Подписка</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              {profile.subscription_tier === 'base' ? 'Base' : profile.subscription_tier === 'pro' ? 'Pro' : 'Ultimate'}
            </div>
          </div>
        </div>

        <div className="settings-row" style={{ borderBottom: 'none' }} onClick={handleSignOut}>
          <div style={{ color: '#ff8b7d', fontWeight: 500 }}>Выйти из аккаунта</div>
        </div>
      </div>
    </div>
  );
}
