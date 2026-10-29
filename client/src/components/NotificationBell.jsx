import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

const POLL_MS = 30000; // check for new notifications every 30 seconds

const timeAgo = (date) => {
  const sec = Math.floor((Date.now() - new Date(date)) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? 's' : ''} ago`;
};

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const load = () =>
    api
      .get('/notifications')
      .then(({ data }) => {
        setItems(data.notifications);
        setUnread(data.unreadCount);
      })
      .catch(() => {}); // a failed refresh should not disturb the page

  // Load once, then poll. The cleanup stops the timer when the component unmounts (logout).
  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  // Close the panel when the user clicks anywhere outside it
  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = () => {
    if (!open) load(); // fresh data every time the panel opens
    setOpen(!open);
  };

  const markRead = async (n) => {
    if (n.read) return;
    // Update the screen first, then tell the server
    setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await api.patch(`/notifications/${n._id}/read`);
    } catch {
      load(); // restore the real state if the request failed
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    try {
      await api.patch('/notifications/read-all');
    } catch {
      load();
    }
  };

  return (
    <div ref={boxRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        style={{ position: 'relative', padding: '4px 8px', cursor: 'pointer' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6, background: 'crimson', color: 'white',
            borderRadius: 10, fontSize: 11, minWidth: 18, padding: '1px 4px', textAlign: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', width: 320, maxHeight: 380, overflowY: 'auto',
          background: 'white', color: 'black', border: '1px solid #ccc', borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #eee' }}>
            <strong>Notifications</strong>
            <button onClick={markAll} disabled={unread === 0}>Mark all as read</button>
          </div>

          {items.length === 0 && <p style={{ padding: 12, margin: 0 }}>No notifications yet.</p>}

          {items.map((n) => (
            <div
              key={n._id}
              onClick={() => markRead(n)}
              style={{
                padding: '10px 12px', borderBottom: '1px solid #f0f0f0', cursor: n.read ? 'default' : 'pointer',
                background: n.read ? 'white' : '#eef4ff',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: n.read ? 'normal' : 'bold' }}>{n.message}</div>
              <small style={{ color: '#666' }}>{timeAgo(n.createdAt)}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}