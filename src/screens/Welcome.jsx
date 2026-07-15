import React from 'react';

export default function Welcome({ onSignOut }) {
  return (
    <div className="screen">
      <div className="center-msg">
        <div style={{ fontSize: 44, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 20, marginBottom: 10 }}>Ты по-настоящему в приложении!</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, marginBottom: 24 }}>
          Это временная заглушка — сюда дальше встанут карта, события и профиль.
          Главное: твой аккаунт и анкета теперь реально сохранены в базе данных.
        </p>
        <button className="btn btn-ghost" onClick={onSignOut}>Выйти</button>
      </div>
    </div>
  );
}
