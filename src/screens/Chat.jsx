import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import Avatar from '../Avatar.jsx';
import PublicProfile from './PublicProfile.jsx';

export default function Chat({ eventId, eventTitle, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [myUserId, setMyUserId] = useState(null);
  const [senderInfo, setSenderInfo] = useState({}); // { [userId]: { name, photoUrl } }
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    setMyUserId(session?.user?.id || null);
    await loadMessages();

    const channel = supabase
      .channel(`chat-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `event_id=eq.${eventId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          loadSenderInfo([payload.new.sender_id]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('event_id', eventId)
      .order('sent_at', { ascending: true });
    const list = data || [];
    setMessages(list);
    const uniqueSenders = [...new Set(list.map((m) => m.sender_id))];
    await loadSenderInfo(uniqueSenders);
  }

  async function loadSenderInfo(userIds) {
    const idsToFetch = userIds.filter((id) => id && !senderInfo[id]);
    if (idsToFetch.length === 0) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', idsToFetch);
    const { data: photoRows } = await supabase
      .from('profile_photos')
      .select('profile_id, photo_url, sort_order')
      .in('profile_id', idsToFetch)
      .order('sort_order', { ascending: true });

    const photoByUser = {};
    (photoRows || []).forEach((p) => { if (!photoByUser[p.profile_id]) photoByUser[p.profile_id] = p.photo_url; });

    setSenderInfo((prev) => {
      const next = { ...prev };
      (profiles || []).forEach((p) => {
        next[p.id] = { name: `${p.first_name} ${p.last_name || ''}`.trim(), photoUrl: photoByUser[p.id] || null };
      });
      return next;
    });
  }

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function handleSend() {
    if (!text.trim()) return;
    const content = text.trim();
    setText('');
    await supabase.from('messages').insert({
      event_id: eventId,
      sender_id: myUserId,
      type: 'text',
      text_content: content,
    });
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  if (viewingProfileId) {
    return <PublicProfile profileId={viewingProfileId} onBack={() => setViewingProfileId(null)} />;
  }

  return (
    <div className="screen" style={{ height: '100%' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--stroke)' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>{eventTitle}</div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m) => {
          const isMe = m.sender_id === myUserId;
          const info = senderInfo[m.sender_id];
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', maxWidth: '85%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && (
                <div onClick={() => setViewingProfileId(m.sender_id)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <Avatar photoUrl={info?.photoUrl} size={28} />
                </div>
              )}
              <div>
                {!isMe && (
                  <div
                    onClick={() => setViewingProfileId(m.sender_id)}
                    style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2, cursor: 'pointer' }}
                  >
                    {info?.name || '...'}
                  </div>
                )}
                <div style={{
                  padding: '9px 13px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.4,
                  background: isMe ? 'var(--coral)' : 'var(--card)',
                  color: isMe ? '#1a0d09' : 'var(--text)',
                  border: isMe ? 'none' : '1px solid var(--stroke)',
                }}>
                  {m.text_content}
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--text-faint)', marginTop: 2, textAlign: isMe ? 'right' : 'left' }}>
                  {formatTime(m.sent_at)}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="empty">Пока нет сообщений — напиши первым!</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--stroke)' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Сообщение…"
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" style={{ width: 'auto', padding: '0 18px' }} onClick={handleSend}>➤</button>
      </div>
    </div>
  );
}
