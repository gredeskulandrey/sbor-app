import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { TOPICS } from '../constants.js';
import PhotoManager from '../PhotoManager.jsx';

const FAQ = [
  // Регистрация и вход
  { q: 'Как войти в приложение?', a: 'По email или по номеру телефона — выбираешь способ на первом экране. Код подтверждения приходит либо на почту, либо в Telegram (для входа по номеру телефона нужен привязанный к нему Telegram).' },
  { q: 'Код не приходит — что делать?', a: 'Подожди немного и нажми «Отправить код ещё раз» на экране ввода кода — не нужно возвращаться назад и вводить почту/номер заново. Если долго не приходит, проверь папку «Спам» (для email) или доступность Telegram (для телефона).' },
  { q: 'Как проходит проверка личности?', a: 'При регистрации нужно сделать два селфи с определённым жестом — так мы убеждаемся, что за анкетой стоит реальный человек, а не бот или фейковый профиль.' },
  { q: 'Можно ли изменить имя, фамилию, пол или дату рождения после регистрации?', a: 'Нет, эти четыре поля фиксируются один раз при регистрации и не редактируются. Всё остальное — фото, «о себе», темы интересов — можно менять в любой момент.' },

  // Профиль
  { q: 'Как отредактировать профиль?', a: 'В профиле нажми на значок ⚙️ → «Редактировать профиль». Там можно поменять фото, описание «о себе» и темы интересов (от 1 до 5).' },
  { q: 'Как загрузить или поменять фото профиля?', a: 'В редактировании профиля — сетка фото: можно сделать снимок камерой или выбрать из галереи. Стрелками меняется порядок, первое фото по порядку становится аватаркой во всём приложении.' },
  { q: 'Как посмотреть настоящее фото в полном качестве?', a: 'Нажми на любую аватарку — своя, организатора или гостя — откроется просмотр в оригинальном разрешении, можно пролистать, если фото несколько.' },
  { q: 'Как посмотреть профиль и статистику другого пользователя?', a: 'В карточке встречи нажми на строку с организатором или любым гостём — откроется его профиль: статистика, достижения и темы интересов.' },
  { q: 'Что означают цифры «Как гость» / «Как организатор» / «Явка»?', a: 'Это количество реально состоявшихся встреч, где ты был(а) гостем или организатором, и процент явки — доля встреч, на которых ты действительно присутствовал(а), из тех, где итоги уже подведены.' },
  { q: 'Как считается процент явки — и можно ли его подделать?', a: 'После встречи организатор отмечает, кто пришёл, а каждый гость отдельно подтверждает это сам за себя. В статистику попадает только то, в чём организатор и гость сошлись во мнении — если ответы разошлись, эта встреча просто не учитывается ни в плюс, ни в минус. Так ни одна из сторон не может в одиночку исказить чужую статистику.' },
  { q: 'Что такое достижения и как их получить?', a: 'Это значки за активность — например, за 5+ встреч по одной теме, за встречи в 3+ городах, за явку выше 95% и т.д. Начисляются автоматически по мере накопления реальной статистики, посмотреть все условия можно в профиле, развернув список.' },
  { q: 'Что за тариф указан в профиле?', a: 'Сейчас у всех аккаунтов тариф Base — платные тарифы Pro и Ultimate пока находятся в разработке.' },

  // Карта и поиск
  { q: 'Как выбрать город?', a: 'На вкладке «Карта» нажми на плашку с названием города вверху экрана — откроется список городов, где мы уже работаем.' },
  { q: 'Как искать встречи по конкретной теме?', a: 'На вкладках «Карта», «Все события» и «Мои встречи» есть ряд фильтров по темам — просто нажми на нужную, чтобы увидеть только такие встречи.' },
  { q: 'Что означает цифра на точке карты?', a: 'Если в одном месте одновременно несколько встреч, они объединяются в одну точку с цифрой — количеством встреч там. Нажми на неё, чтобы увидеть список и выбрать нужную.' },
  { q: 'Чем отличаются офлайн- и онлайн-встречи?', a: 'Офлайн-встречи привязаны к конкретному городу и адресу и видны на карте. Онлайн — не привязаны к городу, у них своя вкладка и свой набор тем (компьютерные игры, коворкинг, IT-митапы и т.д.), доступны из вкладки «Все события».' },

  // Создание встречи и участие
  { q: 'Как собрать свою встречу?', a: 'Кнопка «Собрать встречу» есть на «Карте» и на «Все события». Выбери формат (офлайн/онлайн), тему, место или ссылку, дату, время, лимит участников и, если нужно, возрастной ценз.' },
  { q: 'На какую дату можно назначить встречу?', a: 'Не раньше чем через час от текущего момента и не позже чем через 30 дней вперёд.' },
  { q: 'Как присоединиться к встрече?', a: 'Открой карточку встречи и нажми «Присоединиться». Передумал(а) — там же можно нажать «Покинуть встречу», пока она не наступила.' },
  { q: 'Может ли организатор отказать гостю?', a: 'Да, организатор может отклонить любого гостя без объяснения причины, пока встреча не наступила. Гость в этом случае получит уведомление и увидит, что встреча пропала из его списка.' },
  { q: 'Как отменить встречу, которую я организовал(а)?', a: 'Открой карточку своей встречи и нажми «Отменить встречу» — доступно только до момента, когда встреча должна была состояться. Все, кто откликнулся, автоматически получат уведомление об отмене.' },
  { q: 'Как работает чат встречи?', a: 'У каждой встречи свой чат — видно имя и фото каждого написавшего, по нажатию на них можно перейти в профиль автора сообщения.' },

  // После встречи
  { q: 'Что происходит сразу после того, как встреча прошла?', a: 'Организатору сразу при следующем входе в приложение показывается экран с просьбой отметить, кто из гостей действительно пришёл — этот экран нельзя пропустить, пока не ответишь.' },
  { q: 'Почему меня тоже спрашивают, был(а) ли я на встрече?', a: 'Это нужно для честной статистики — раздел «Про явку и статистику» выше объясняет, как это защищает от того, чтобы кто-то мог в одиночку испортить чужой рейтинг.' },
  { q: 'Куда пропадают прошедшие встречи?', a: 'Они автоматически перестают отображаться в общем списке и на карте сразу после наступления даты и времени встречи, но остаются в разделе «Мои встречи → Прошедшие».' },

  // Настройки и аккаунт
  { q: 'Как включить или выключить уведомления?', a: 'В настройках (⚙️) — раздел «Уведомления», один переключатель.' },
  { q: 'Как удалить свой аккаунт?', a: 'В настройках, в самом низу списка — пункт «Удалить аккаунт». Попросим указать причину, а затем действие будет выполнено безвозвратно — все данные, включая встречи и статистику, удаляются полностью.' },
];

export default function SettingsScreen({ profile, onBack, onProfileUpdated, onAccountDeleted }) {
  const [view, setView] = useState('main');
  const [deleteFeedback, setDeleteFeedback] = useState(null);

  if (view === 'editProfile') return <EditProfileView profile={profile} onBack={() => setView('main')} onSaved={onProfileUpdated} />;
  if (view === 'notifications') return <NotificationsView profile={profile} onBack={() => setView('main')} onProfileUpdated={onProfileUpdated} />;
  if (view === 'faq') return <FaqView onBack={() => setView('main')} />;
  if (view === 'support') return <SupportView onBack={() => setView('main')} />;
  if (view === 'legal') return <LegalView onBack={() => setView('main')} />;
  if (view === 'deleteReasons') return (
    <DeleteReasonsView
      onBack={() => setView('main')}
      onConfirmed={(feedback) => { setDeleteFeedback(feedback); setView('deleteProcessing'); }}
    />
  );
  if (view === 'deleteProcessing') return (
    <DeleteProcessingView
      feedback={deleteFeedback}
      onDone={() => setView('deleteFarewell')}
      onFailed={(msg) => setView({ name: 'deleteFailed', msg })}
    />
  );
  if (typeof view === 'object' && view?.name === 'deleteFailed') {
    return <DeleteFailedView message={view.msg} onBack={() => setView('main')} onRetry={() => setView('deleteProcessing')} />;
  }
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
          {loadingPhotos && <div className="loading-gear" style={{ fontSize: 22, marginBottom: 0 }}>⚙️</div>}
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
          onClick={() => onConfirmed({ reasons: selected, other: other.trim() })}
        >
          Удалить профиль
        </button>
      </div>
    </div>
  );
}

function DeleteProcessingView({ feedback, onDone, onFailed }) {
  React.useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onFailed('Сессия потерялась — попробуй выйти и войти заново, потом повтори удаление');
        return;
      }

      // Сохраняем причину ухода отдельно, ДО удаления аккаунта — эта запись
      // не привязана внешним ключом к пользователю и переживёт само удаление
      if (feedback && (feedback.reasons?.length > 0 || feedback.other)) {
        await supabase.from('account_deletion_feedback').insert({
          user_id: session.user.id,
          reasons: feedback.reasons || [],
          other_text: feedback.other || null,
        });
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        // supabase-js даёт только общий текст ("non-2xx status code") — настоящее
        // сообщение об ошибке спрятано в теле ответа, достаём его отдельно
        let detail = error.message;
        try {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body?.error) detail = body.error;
          }
        } catch { /* тело не в формате JSON — оставляем общий текст */ }
        onFailed(detail);
        return;
      }
      if (data?.error || !data?.success) {
        onFailed(data?.error || 'Не получилось удалить аккаунт');
        return;
      }
      setTimeout(onDone, 1500);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="center-msg">
      <div className="loading-gear" style={{ fontSize: 30 }}>⚙️</div>
      <p>Удаляю твои данные...</p>
    </div>
  );
}

function DeleteFailedView({ message, onBack, onRetry }) {
  return (
    <div className="center-msg">
      <div style={{ fontSize: 34, marginBottom: 14 }}>⚠️</div>
      <h2 style={{ fontSize: 17, marginBottom: 10 }}>Не получилось удалить аккаунт</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 12.5, marginBottom: 20 }}>{String(message)}</p>
      <button className="btn btn-primary" style={{ marginBottom: 10 }} onClick={onRetry}>Попробовать ещё раз</button>
      <button className="btn btn-ghost" onClick={onBack}>Назад в настройки</button>
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
