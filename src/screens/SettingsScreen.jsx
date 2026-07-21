import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { TOPICS } from '../constants.js';
import PhotoManager from '../PhotoManager.jsx';

const FAQ = [
  { q: 'Как проходит проверка личности?', a: 'При регистрации нужно сделать два селфи с определённым жестом — так мы убеждаемся, что за анкетой стоит реальный человек, а не бот или фейковый профиль.' },
  { q: 'Как выбрать город?', a: 'На вкладке «Карта» нажми на плашку с названием города вверху экрана — откроется список городов, где мы уже работаем.' },
  { q: 'Как отменить встречу, которую я организовал(а)?', a: 'Открой карточку своей встречи и нажми «Отменить встречу». Это доступно только до момента, когда встреча должна была состояться.' },
  { q: 'Что будет, если я не приду на встречу, на которую откликнулся(-ась)?', a: 'После встречи организатор отмечает, кто действительно пришёл. Это влияет на явку — старайся честно предупреждать в чате, если планы меняются.' },
  { q: 'Как удалить свой аккаунт?', a: 'В настройках, в самом низу списка — пункт «Удалить аккаунт». Это действие необратимо.' },
  { q: 'Куда пропадают прошедшие встречи?', a: 'Они автоматически перестают отображаться в общем списке и на карте сразу после наступления даты и времени встречи, но остаются в разделе «Мои встречи → Прошедшие».' },
];

export default function SettingsScreen({ profile, onBack, onProfileUpdated, onAccountDeleted }) {
  const [view, setView] = useState('main');

  if (view === 'editProfile') return <EditProfileView profile={profile} onBack={() => setView('main')} onSaved={onProfileUpdated} />;
  if (view === 'notifications') return <NotificationsView profile={profile} onBack={() => setView('main')} onProfileUpdated={onProfileUpdated} />;
  if (view === 'language') return <LanguageView profile={profile} onBack={() => setView('main')} onProfileUpdated={onProfileUpdated} />;
  if (view === 'faq') return <FaqView onBack={() => setView('main')} />;
  if (view === 'support') return <SupportView onBack={() => setView('main')} />;
  if (view === 'legal') return <LegalView onBack={() => setView('main')} />;
  if (view === 'deleteReasons') return <DeleteReasonsView onBack={() => setView('main')} onConfirmed={() => setView('deleteProcessing')} />;
  if (view === 'deleteProcessing') return <DeleteProcessingView onDone={() => setView('deleteFarewell')} />;
  if (view === 'deleteFarewell') return <DeleteFarewellView onFinish={onAccountDeleted} />;

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 19, marginBottom: 6 }}>Настройки</h2>
      </div>
      <div className="settings-row" onClick={() => setView('editProfile')}>
        <div style={{ fontSize: 14 }}>Редактировать профиль</div>
        <div style={{ color: 'var(--text-faint)' }}>›</div>
      </div>
      <div className="settings-row" onClick={() => setView('notifications')}>
        <div style={{ fontSize: 14 }}>Уведомления</div>
        <div style={{ color: 'var(--text-faint)' }}>›</div>
      </div>
      <div className="settings-row" onClick={() => setView('language')}>
        <div style={{ fontSize: 14 }}>Язык</div>
        <div style={{ color: 'var(--text-faint)' }}>›</div>
      </div>
      <div className="settings-row" onClick={() => setView('faq')}>
        <div style={{ fontSize: 14 }}>Частые вопросы</div>
        <div style={{ color: 'var(--text-faint)' }}>›</div>
      </div>
      <div className="settings-row" onClick={() => setView('support')}>
        <div style={{ fontSize: 14 }}>Связь с поддержкой</div>
        <div style={{ color: 'var(--text-faint)' }}>›</div>
      </div>
      <div className="settings-row" onClick={() => setView('legal')}>
        <div style={{ fontSize: 14 }}>Нормативные документы</div>
        <div style={{ color: 'var(--text-faint)' }}>›</div>
      </div>
      <div className="settings-row" onClick={() => setView('deleteReasons')} style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, color: '#ff8b7d' }}>Удалить аккаунт</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', padding: '30px 0' }}>
        СБОР · версия 1.0.0
      </div>
    </div>
  );
}

function EditProfileView({ profile, onBack, onSaved }) {
  const [about, setAbout] = useState(profile.about || '');
  const [topics, setTopics] = useState(profile.topics || []);
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profile_photos')
        .select('id, photo_url, sort_order')
        .eq('profile_id', profile.id)
        .order('sort_order', { ascending: true });
      setPhotos(data || []);
      setLoadingPhotos(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTopic(id) {
    setTopics((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  async function handleSave() {
    if (!about.trim() || topics.length < 1 || photos.length < 1) {
      setError('Заполни «о себе», оставь хотя бы 1 фото и минимум 1 тему');
      return;
    }
    setSaving(true);
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ about: about.trim(), topics })
      .eq('id', profile.id);

    // Проще и надёжнее всего пересохранить список фото целиком, а не высчитывать разницу
    await supabase.from('profile_photos').delete().eq('profile_id', profile.id);
    const { error: photosErr } = await supabase.from('profile_photos').insert(
      photos.map((p, i) => ({ profile_id: profile.id, photo_url: p.photo_url, sort_order: i }))
    );

    setSaving(false);
    if (updErr || photosErr) { setError('Не получилось сохранить: ' + (updErr?.message || photosErr?.message)); return; }
    onSaved({ ...profile, about: about.trim(), topics });
    onBack();
  }

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div className="auth-wrap" style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 17, marginBottom: 6 }}>Редактировать профиль</h2>
        <div className="field-note" style={{ marginBottom: 16 }}>
          Имя, фамилия, пол и дата рождения не редактируются после регистрации.
        </div>

        <div className="field">
          <label>Фото профиля — минимум 1, максимум 5</label>
          {!loadingPhotos && <PhotoManager userId={profile.id} photos={photos} onChange={setPhotos} />}
        </div>

        <div className="field">
          <label>О себе</label>
          <textarea maxLength={500} value={about} onChange={(e) => setAbout(e.target.value)} />
        </div>

        <div className="field">
          <label>Темы интересов (от 1 до 5)</label>
          <div className="chip-row">
            {TOPICS.map((t) => (
              <div key={t.id} className={'chip' + (topics.includes(t.id) ? ' active' : '')} onClick={() => toggleTopic(t.id)}>
                {t.ic} {t.label}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}

        <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}

function NotificationsView({ profile, onBack, onProfileUpdated }) {
  const [enabled, setEnabled] = useState(profile.notifications_enabled ?? true);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    await supabase.from('profiles').update({ notifications_enabled: next }).eq('id', profile.id);
    onProfileUpdated({ ...profile, notifications_enabled: next });
  }

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 17, marginBottom: 16 }}>Уведомления</h2>
      </div>
      <div className="settings-row">
        <div style={{ fontSize: 14 }}>Push-уведомления</div>
        <div className={'switch' + (enabled ? ' on' : '')} onClick={toggle}><div className="dot" /></div>
      </div>
    </div>
  );
}

function LanguageView({ profile, onBack, onProfileUpdated }) {
  const [lang, setLang] = useState(profile.language || 'ru');

  async function pick(value) {
    setLang(value);
    await supabase.from('profiles').update({ language: value }).eq('id', profile.id);
    onProfileUpdated({ ...profile, language: value });
  }

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 17, marginBottom: 16 }}>Язык</h2>
      </div>
      <div className={'city-item' + (lang === 'ru' ? ' active' : '')} onClick={() => pick('ru')}>
        <span>Русский</span>{lang === 'ru' && <span>✓</span>}
      </div>
      <div className={'city-item' + (lang === 'en' ? ' active' : '')} onClick={() => pick('en')}>
        <span>English</span>{lang === 'en' && <span>✓</span>}
      </div>
    </div>
  );
}

function FaqView({ onBack }) {
  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 17, marginBottom: 16 }}>Частые вопросы</h2>
        {FAQ.map((item, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>{item.q}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>{item.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportView({ onBack }) {
  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 17, marginBottom: 16 }}>Связь с поддержкой</h2>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 14 }}>
          Если что-то не работает или есть вопрос — напиши нам, ответим как можно скорее.
        </p>
        <div style={{ background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
          Telegram: <b>@sbor_help</b>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 14, padding: 14 }}>
          Сайт: <b>sbor.app/help</b>
        </div>
      </div>
    </div>
  );
}

function LegalView({ onBack }) {
  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 17, marginBottom: 16 }}>Нормативные документы</h2>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Здесь будут размещены пользовательское соглашение и политика конфиденциальности.
        </p>
      </div>
    </div>
  );
}

const DELETE_REASONS = [
  'Не нашёл(-шла) подходящих встреч',
  'Мало людей в моём городе',
  'Неудобно пользоваться приложением',
  'Нашёл(-шла) компанию другим способом',
  'Проблемы с безопасностью/доверием',
  'Временно — вернусь позже',
];

function DeleteReasonsView({ onBack, onConfirmed }) {
  const [selected, setSelected] = useState([]);
  const [other, setOther] = useState('');

  function toggle(reason) {
    setSelected((prev) => {
      if (prev.includes(reason)) return prev.filter((r) => r !== reason);
      if (prev.length >= 3) return prev;
      return [...prev, reason];
    });
  }

  const canSubmit = selected.length > 0 || other.trim().length > 0;

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <h2 style={{ fontSize: 17, marginBottom: 6 }}>Почему уходишь?</h2>
        <div className="field-note" style={{ marginBottom: 14 }}>Выбрано: {selected.length}/3</div>
        {DELETE_REASONS.map((r) => (
          <div key={r} className={'chip' + (selected.includes(r) ? ' active' : '')} style={{ display: 'block', marginBottom: 8 }} onClick={() => toggle(r)}>
            {r}
          </div>
        ))}
        <div className="field" style={{ marginTop: 10 }}>
          <label>Свой вариант (необязательно)</label>
          <textarea value={other} onChange={(e) => setOther(e.target.value)} />
        </div>
        <button
          className="btn btn-primary"
          style={{ background: '#ff8b7d', marginTop: 10 }}
          disabled={!canSubmit}
          onClick={onConfirmed}
        >
          Удалить профиль
        </button>
      </div>
    </div>
  );
}

function DeleteProcessingView({ onDone }) {
  React.useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setTimeout(onDone, 2000);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="center-msg">
      <div style={{ fontSize: 30, marginBottom: 14 }}>⚙️</div>
      <p>Удаляю твои данные...</p>
    </div>
  );
}

function DeleteFarewellView({ onFinish }) {
  return (
    <div className="center-msg">
      <div style={{ fontSize: 40, marginBottom: 14 }}>👋</div>
      <h2 style={{ fontSize: 18, marginBottom: 10 }}>Аккаунт удалён</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>Данные будут полностью удалены в течение 30 дней.</p>
      <button className="btn btn-ghost" onClick={onFinish}>Вернуться на главный экран</button>
    </div>
  );
}
