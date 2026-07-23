import React, { useEffect, useState } from 'react';

const ONBOARDING_SLIDES = [
  { ic: '🗺️', title: 'Карта — встречи рядом', text: 'Открывай вкладку «Карта», выбирай город сверху и смотри, что происходит поблизости прямо сейчас. Фильтруй по темам — они появляются в один клик.' },
  { ic: '🤝', title: 'Собери свою встречу', text: 'Кнопка «Собрать встречу» есть на «Карте» и в «Все события». Выбери тему, место и время — и приглашай людей.' },
  { ic: '📋', title: 'Все события', text: 'На вкладке «Все события» — полный список офлайн- и онлайн-встреч в твоём городе. Здесь удобно искать по темам и присоединяться в один тап.' },
  { ic: '💬', title: 'Общайся в чате встречи', text: 'У каждой встречи свой чат — сразу видно, кто написал, с фото и именем. Нажми на автора сообщения, чтобы посмотреть его профиль.' },
  { ic: '✅', title: 'Явка — честно с двух сторон', text: 'После встречи организатор отмечает, кто пришёл, а каждый гость подтверждает это сам за себя. В статистику и достижения попадает только то, в чём мнения совпали — так никто не может в одиночку испортить чужой рейтинг.' },
  { ic: '💎', title: 'Зачем нужна подписка', text: 'На бесплатном Base — 2 встречи в месяц как гость и 2 как организатор. Pro снимает это ограничение и открывает фильтры на карте. Ultimate — то же самое плюс фильтры участников при создании встречи.' },
  { ic: '🏆', title: 'Прокачивай профиль', text: 'За встречи начисляются достижения, растёт рейтинг и явка. В профиле — вся статистика, а в настройках (🔧) — язык, уведомления и поддержка.' },
];

export default function Onboarding({ onFinish }) {
  const [idx, setIdx] = useState(0);
  const slide = ONBOARDING_SLIDES[idx];
  const isLast = idx === ONBOARDING_SLIDES.length - 1;

  function goNext() {
    if (isLast) onFinish();
    else setIdx((i) => i + 1);
  }
  function goPrev() {
    if (idx > 0) setIdx((i) => i - 1);
  }

  // Автоматическое пролистывание — каждый слайд держится 15 секунд, как в сторис
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLast) onFinish();
      else setIdx((i) => i + 1);
    }, 15000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return (
    <div className="screen" style={{ padding: 0 }}>
      <div style={{ padding: '16px 16px 0' }}>
        <div className="onboarding-progress">
          {ONBOARDING_SLIDES.map((s, i) => (
            <div key={i} className={'onboarding-seg' + (i < idx ? ' filled' : '')}>
              {i === idx && <div key={idx} className="onboarding-seg-fill" />}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 4px' }}>
          <button
            onClick={onFinish}
            style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 12.5, cursor: 'pointer' }}
          >
            Пропустить
          </button>
        </div>
      </div>

      <div className="onboarding-body">
        <div className="onboarding-ic">{slide.ic}</div>
        <h1 style={{ fontSize: 22, marginTop: 22, textAlign: 'center' }}>{slide.title}</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 1.6, maxWidth: 300 }}>
          {slide.text}
        </p>
        <div className="onboarding-tap-zone left" onClick={goPrev} />
        <div className="onboarding-tap-zone right" onClick={goNext} />
      </div>

      <div style={{ padding: '0 20px calc(20px + env(safe-area-inset-bottom))' }}>
        <button className="btn btn-primary" onClick={goNext}>
          {isLast ? 'Начать пользоваться' : 'Далее'}
        </button>
      </div>
    </div>
  );
}
