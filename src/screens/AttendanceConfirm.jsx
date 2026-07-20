import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function AttendanceConfirm({ eventId, onDone }) {
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [checks, setChecks] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function load() {
    setLoading(true);
    const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
    setEvent(ev);
    const { data: att } = await supabase
      .from('event_attendees')
      .select('user_id, profiles(first_name, last_name)')
      .eq('event_id', eventId);
    const list = att || [];
    setAttendees(list);
    const initial = {};
    list.forEach((a) => { initial[a.user_id] = false; });
    setChecks(initial);
    setLoading(false);
  }

  async function handleConfirm() {
    setBusy(true);
    let anyoneAttended = false;
    const eventHour = event.event_time ? Number(event.event_time.split(':')[0]) : 0;
    const wasLate = eventHour >= 21;

    for (const a of attendees) {
      const attended = !!checks[a.user_id];
      await supabase
        .from('event_attendees')
        .update({ attended })
        .eq('event_id', eventId)
        .eq('user_id', a.user_id);

      if (attended) {
        anyoneAttended = true;
        // Постоянная запись в журнал статистики гостя — не зависит от того,
        // удалит ли потом организатор саму карточку встречи
        await supabase.from('completed_meetings').insert({
          user_id: a.user_id,
          event_id: eventId,
          category: event.category,
          city: event.city,
          role: 'guest',
          was_late: wasLate,
        });
      }
    }

    // Организатор получает запись в свой журнал только если встреча реально состоялась
    // (хотя бы один гость подтверждён как пришедший)
    if (anyoneAttended) {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('completed_meetings').insert({
        user_id: session.user.id,
        event_id: eventId,
        category: event.category,
        city: event.city,
        role: 'organizer',
        was_late: wasLate,
      });
    }

    await supabase.from('events').update({ attendance_confirmed: true }).eq('id', eventId);
    setBusy(false);
    onDone();
  }

  if (loading || !event) return <div className="center-msg">Загрузка...</div>;

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '20px 20px 30px' }}>
        <h2 style={{ fontSize: 19, marginBottom: 10 }}>Встреча прошла — отметь явку</h2>
        <div style={{
          background: 'var(--card)', border: '1px solid var(--gold)', borderRadius: 14,
          padding: 14, marginBottom: 20, fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5,
        }}>
          Это важно: отметка о явке напрямую влияет на рейтинг гостя. Если поставить «не пришёл» тому,
          кто на самом деле был на встрече — его рейтинг явки незаслуженно снизится. Пожалуйста, отмечай
          только тех, кто <b style={{ color: 'var(--text)' }}>действительно</b> пришёл на «{event.title}».
        </div>

        {attendees.map((a) => (
          <div
            key={a.user_id}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--stroke)', borderRadius: 12, marginBottom: 8 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ width: 32, height: 32 }}>🙂</div>
              <span style={{ fontSize: 13 }}>{a.profiles?.first_name} {a.profiles?.last_name || ''}</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!checks[a.user_id]}
                onChange={(e) => setChecks((prev) => ({ ...prev, [a.user_id]: e.target.checked }))}
              />
              Пришёл(-а)
            </label>
          </div>
        ))}

        <button className="btn btn-primary" style={{ marginTop: 16 }} disabled={busy} onClick={handleConfirm}>
          {busy ? 'Сохраняем...' : 'Подтвердить явку'}
        </button>
      </div>
    </div>
  );
}
