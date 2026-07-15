import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { catInfo } from '../../constants.js';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  }

  if (loading) return <div className="center-msg">Загрузка профиля...</div>;
  if (!profile) return <div className="center-msg">Не получилось загрузить профиль</div>;

  const age = calcAge(profile.birth_date);

  return (
    <div>
      <div className="profile-hero">
        <div className="avatar">🙂</div>
        <div>
          <h2 style={{ fontSize: 19 }}>{profile.first_name} {profile.last_name || ''}</h2>
          {age !== null && <p style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{age} лет</p>}
        </div>
      </div>

      {profile.about && (
        <div style={{ margin: '0 20px 16px', padding: 14, background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 14, fontSize: 13, color: 'var(--text-dim)' }}>
          {profile.about}
        </div>
      )}

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

      <div className="settings-row" style={{ borderBottom: 'none' }} onClick={onSignOut}>
        <div style={{ color: '#ff8b7d', fontWeight: 500 }}>Выйти из аккаунта</div>
      </div>
    </div>
  );
}
