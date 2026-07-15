import React from 'react';

const BENEFITS = [
  { ic: '✨', title: 'Любая хотелка — своя компания', text: 'Выпить вина в новой компании, сыграть в дурака, сходить в кино — найдём людей под любое настроение' },
  { ic: '🎯', title: 'Подбор по твоим интересам', text: 'Богатый выбор тематик — от баров и концертов до путешествий и мастер-классов' },
  { ic: '🛡️', title: 'Проверенные участники', text: 'Обязательная верификация — никаких ботов и фейковых профилей. А ещё за порядком следит поддержка: регулярно модерирует события и следит за соблюдением правил' },
  { ic: '🗺️', title: 'События в городах по всей России', text: 'Москва, Санкт-Петербург, Казань, Сочи и другие — выбирай свой город' },
  { ic: '🔒', title: 'Скоро будем и в других странах', text: 'Пока доступно только в России, но мы уже готовим выход на новые рынки' },
];

export default function Splash({ onNext }) {
  return (
    <div className="screen">
      <div className="auth-wrap">
        <div className="auth-hero" style={{ textAlign: 'center' }}>
          <div className="mark" style={{ margin: '0 auto 18px' }}>С</div>
          <h1 style={{ fontSize: 30 }}>СБОР</h1>
          <p style={{ marginTop: 6 }}>Поиск компании для любых твоих планов и интересов</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
          {BENEFITS.map((b) => (
            <div key={b.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 24, lineHeight: 1 }}>{b.ic}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 3, lineHeight: 1.4 }}>{b.text}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onNext}>Далее</button>
      </div>
    </div>
  );
}
