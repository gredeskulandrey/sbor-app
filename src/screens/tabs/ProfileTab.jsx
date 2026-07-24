import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { catInfo, ACHIEVEMENTS } from '../../constants.js';
import { formatPhoneDisplay } from '../../formatPhoneDisplay.js';
import { computeAchievements } from '../../computeAchievements.js';
import SettingsScreen from '../SettingsScreen.jsx';
import Avatar from '../../Avatar.jsx';
import { getPrimaryPhoto } from '../../getPrimaryPhoto.js';
import Loading from '../../Loading.jsx';
import { pluralizeYears } from '../../pluralize.js';

// Записывает в базу только те достижения, которых там ещё нет — чтобы у каждого
// была настоящая строка в таблице с датой, когда оно было получено впервые
async function syncAchievementsToDb(userId, unlockedIds) {
  if (unlockedIds.size === 0) return;
  const { data: existing } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', userId);
  const alreadyStored = new Set((existing || []).map((r) => r.achievement_id));
  const toInsert = [...unlockedIds].filter((id) => !alreadyStored.has(id));
  if (toInsert.length === 0) return;
  await supabase.from('user_achievements').insert(toInsert.map((achievement_id) => ({ user_id: userId, achievement_id })));
}

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
  const [showSubscriptionBlockedModal, setShowSubscriptionBlockedModal] = useState(false);
  const [achvExpanded, setAchvExpanded] = useState(false);

  const [guestCount, setGuestCount] = useState(0);
  const [organizerCount, setOrganizerCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(100);
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const [photoUrl, setPhotoUrl] = useState(null);

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
    setPhotoUrl(await getPrimaryPhoto(user.id));

    // Постоянный журнал встреч — источник правды для статистики и ачивок
    const { data: meetings } = await supabase.from('completed_meetings').select('*').eq('user_id', user.id);
    const list = meetings || [];
    setGuestCount(list.filter((m) => m.role === 'guest').length);
    setOrganizerCount(list.filter((m) => m.role === 'organizer').length);

    // Явка: доля встреч (где я гость), на которых я реально был — считаем только те,
    // где мой собственный ответ совпал с отметкой организатора. Если мнения разошлись —
    // такая встреча просто не учитывается ни в плюс, ни в минус (не разбираем, кто прав).
    const { data: attRows } = await supabase
      .from('event_attendees')
      .select('attended, guest_confirmed_attended, events!inner(attendance_confirmed)')
      .eq('user_id', user.id)
      .eq('events.attendance_confirmed', true);
    const agreedRows = (attRows || []).filter(
      (r) => r.guest_confirmed_attended !== null && r.guest_confirmed_attended === r.attended
    );
    const rate = agreedRows.length === 0 ? 100 : Math.round((agreedRows.filter((r) => r.attended).length / agreedRows.length) * 100);
    setAttendanceRate(rate);

    const unlocked = computeAchievements({ meetings: list, attendanceRatePercent: rate, createdAt: prof?.created_at });
    setUnlockedIds(unlocked);
    await syncAchievementsToDb(user.id, unlocked);

    setLoading(false);
  }

  function handleProfileUpdated(updated) {
    setProfile(updated);
  }

  async function handleSignOut() {
    await onSignOut();
  }

  function handleSignOutClick() {
    if (window.confirm('Вы точно хотите выйти из аккаунта?')) {
      handleSignOut();
    }
  }

  if (loading) return <Loading text="Загрузка профиля..." />;
  if (!profile) return <div className="center-msg">Не получилось загрузить профиль</div>;

  if (showSettings) {
    return (
      <SettingsScreen
        profile={profile}
        onBack={() => { setShowSettings(false); loadEverything(); }}
        onProfileUpdated={handleProfileUpdated}
        onAccountDeleted={handleSignOut}
      />
    );
  }

  const age = calcAge(profile.birth_date);
  const ageLabel = profile.show_only_year
    ? new Date(profile.birth_date).getFullYear()
    : `${age} ${pluralizeYears(age)}`;

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
        <Avatar photoUrl={photoUrl} profileId={profile.id} size={64} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 19 }}>{profile.first_name} {profile.last_name || ''}</h2>
            <div
              onClick={() => setShowSubscriptionBlockedModal(true)}
              style={{
                fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 8, cursor: 'pointer',
                background: profile.subscription_tier === 'base' ? 'var(--card-2)' : profile.subscription_tier === 'proyear' ? 'var(--gold)' : 'var(--coral)',
                color: profile.subscription_tier === 'base' ? 'var(--text-dim)' : '#1a0d09',
              }}
            >
              {profile.subscription_tier === 'base' ? 'Base' : profile.subscription_tier === 'pro' ? 'Pro' : 'Ultimate'}
            </div>
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
                <div>
                  <div style={{ fontSize: 13 }}>{a.title}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 2 }}>{a.desc}</div>
                </div>
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

      <div>
        <div className="settings-row">
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Темы интересов</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              {(profile.topics || []).map((t) => catInfo(t).label).join(', ') || 'Не выбраны'}
            </div>
          </div>
        </div>

        <div className="settings-row" onClick={() => setShowSubscriptionBlockedModal(true)}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Подписка</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              {profile.subscription_tier === 'base' ? 'Base' : profile.subscription_tier === 'pro' ? 'Pro' : 'Ultimate'}
              {profile.subscription_expires_at && ` · до ${new Date(profile.subscription_expires_at).toLocaleDateString('ru-RU')}`}
            </div>
          </div>
          <div style={{ color: 'var(--text-faint)' }}>›</div>
        </div>

        <div className="settings-row" style={{ borderBottom: 'none' }} onClick={handleSignOutClick}>
          <div style={{ color: '#ff8b7d' }}>Выйти из аккаунта</div>
        </div>
      </div>

      {showSubscriptionBlockedModal && (
        <div className="modal-fade" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--ink)', border: '1px solid var(--stroke)', borderRadius: 18, padding: 20, maxWidth: 320 }}>
            <div style={{ fontSize: 28, marginBottom: 12, textAlign: 'center' }}>🚧</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-dim)', marginBottom: 18, textAlign: 'center' }}>
              Подписка сейчас в разработке — весь функционал приложения полностью бесплатный.
            </p>
            <button className="btn btn-primary" onClick={() => setShowSubscriptionBlockedModal(false)}>Понятно</button>
          </div>
        </div>
      )}
    </div>
  );
}
