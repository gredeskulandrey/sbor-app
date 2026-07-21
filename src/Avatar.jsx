import React, { useState } from 'react';
import PhotoViewer from './PhotoViewer.jsx';

export default function Avatar({ photoUrl, profileId, size = 44 }) {
  const [showViewer, setShowViewer] = useState(false);
  const clickable = !!profileId;

  const content = photoUrl ? (
    <img
      src={photoUrl}
      alt=""
      style={{ width: size, height: size, borderRadius: size * 0.28, objectFit: 'cover', flexShrink: 0, cursor: clickable ? 'pointer' : 'default' }}
    />
  ) : (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, cursor: clickable ? 'pointer' : 'default' }}>🙂</div>
  );

  return (
    <>
      <div onClick={clickable ? () => setShowViewer(true) : undefined} style={{ display: 'inline-block' }}>
        {content}
      </div>
      {showViewer && <PhotoViewer profileId={profileId} onClose={() => setShowViewer(false)} />}
    </>
  );
}
