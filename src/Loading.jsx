import React from 'react';

export default function Loading({ text = 'Загрузка...' }) {
  return (
    <div className="center-msg">
      <div className="loading-gear">⚙️</div>
      <p>{text}</p>
    </div>
  );
}
