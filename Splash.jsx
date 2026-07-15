import React from 'react';

export default function Splash({ onNext }) {
  return (
    <div className="screen">
      <div className="auth-wrap">
        <div className="auth-hero" style={{ textAlign: 'center' }}>
          <div className="mark" style={{ margin: '0 auto 18px' }}>С</div>
          <h1 style={{ fontSize: 30 }}>СБОР</h1>
          <p style={{ marginTop: 6 }}>Поиск компании для любых твоих планов и интересов</p>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={onNext}>Далее</button>
      </div>
    </div>
  );
}
