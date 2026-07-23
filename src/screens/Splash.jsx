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
      <div className="auth-wrap" style={{ padding: '48px 26px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 96, height: 96, borderRadius: 28,
            background: 'linear-gradient(135deg, var(--coral), #c73f2e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px', boxShadow: '0 16px 32px -10px rgba(255,107,87,.5)',
          }}>
            <span style={{ fontFamily: "'Unbounded'", fontWeight: 800, fontSize: 40, color: '#1a0d09' }}>С</span>
          </div>
          <h1 style={{ fontSize: 34, letterSpacing: '-0.03em' }}>СБОР</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 6 }}>Поиск компании для любых твоих планов и интересов</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
          {BENEFITS.map((b) => (
            <div key={b.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>{b.ic}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 3 }}>{b.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.4 }}>{b.text}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={onNext}>Далее</button>
      </div>
    </div>
  );
}
