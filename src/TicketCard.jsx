import React from 'react';
import { catInfo } from './constants.js';
import { formatEventDate, formatEventTime } from './formatDateTime.js';

export default function TicketCard({ event, onClick }) {
  const cat = catInfo(event.category);
  const joined = event.attendee_count ?? 0;

  return (
    <div className="ticket" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="ticket-top">
        <div className="ticket-cat">
          {cat.ic} {cat.label}
          {event.age_restriction && <span className="badge18">{event.age_restriction}</span>}
          {event.is_online && <span className="badge-online">Онлайн</span>}
        </div>
        <h3>{event.title}</h3>
        <div className="meta">
          <span>{event.is_online ? `🔗 ${event.online_link}` : `📍 ${event.address || event.venue_name}`}</span>
          <span>🕐 {formatEventDate(event.event_date)}, {formatEventTime(event.event_time)}</span>
        </div>
      </div>
      <div className="ticket-perf" />
      <div className="ticket-bottom">
        <span>{joined}/{event.participant_limit} участников</span>
        <span style={{ color: 'var(--coral)', fontWeight: 600 }}>Подробнее →</span>
      </div>
    </div>
  );
}
