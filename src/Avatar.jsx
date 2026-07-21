import React from 'react';

export default function Avatar({ photoUrl, size = 44 }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        style={{ width: size, height: size, borderRadius: size * 0.28, objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>🙂</div>
  );
}
