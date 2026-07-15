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
      </div>
    </div>
  );
}
