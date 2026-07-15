import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function Chat({ eventId, eventTitle, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [myUserId, setMyUserId] = useState(null);
  const [myName, setMyName] = useState('Ты');
  const scrollRef = useRef(null);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    setMyUserId(session?.user?.id || null);
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', session.user.id).maybeSingle();
      if (profile) setMyName(profile.first_name);
    }
    await loadMessages();

    // Подписываемся на новые сообщения этой встречи — приходят всем участникам мгновенно
    const channel = supabase
      .channel(`chat-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `event_id=eq.${eventId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
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
    setMessages(data || []);
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

  return (
    <div className="screen" style={{ height: '100%' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--stroke)' }}>
        <div className="backbtn" onClick={onBack}>←</div>
        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>{eventTitle}</div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m) => {
          const isMe = m.sender_id === myUserId;
          return (
            <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 3, textAlign: isMe ? 'right' : 'left' }}>
                {formatTime(m.sent_at)}
              </div>
              <div style={{
                padding: '9px 13px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.4,
                background: isMe ? 'var(--coral)' : 'var(--card)',
                color: isMe ? '#1a0d09' : 'var(--text)',
                border: isMe ? 'none' : '1px solid var(--stroke)',
              }}>
                {m.text_content}
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
