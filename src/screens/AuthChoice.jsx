import React from 'react';

export default function AuthChoice({ onEmail, onPhone }) {
  return (
    <div className="screen">
      <div className="auth-wrap">
        <div className="auth-hero">
          <h1>Как войдёшь?</h1>
          <p>Выбери способ входа, чтобы продолжить</p>
        </div>
        <div className="method-card" onClick={onEmail}>
          <div style={{ fontSize: 22 }}>📧</div>
          <div>
            <div style={{ fontWeight: 600 }}>Email</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Код придёт на почту</div>
          </div>
        </div>
        <div className="method-card" onClick={onPhone}>
          <div style={{ fontSize: 22 }}>📱</div>
          <div>
            <div style={{ fontWeight: 600 }}>Телефон</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Код придёт в Telegram</div>
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          Продолжая, вы принимаете{' '}
          <a href="https://sbor-app.vercel.app/#" target="_blank" rel="noreferrer" style={{ color: 'var(--text-faint)', textDecoration: 'underline' }}>
            пользовательское соглашение
          </a>{' '}
          и соглашаетесь с{' '}
          <a href="https://sbor-app.vercel.app/#" target="_blank" rel="noreferrer" style={{ color: 'var(--text-faint)', textDecoration: 'underline' }}>
            обработкой персональных данных
          </a>
        </p>
      </div>
    </div>
  );
}
