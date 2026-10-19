import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Empty from '../components/Empty';
import api from '../api';
import { getSocket } from '../socket';

export default function Notifications() {
  const { setUnread } = useOutletContext();
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get('/notifications').then((r) => setItems(r.data));
    const s = getSocket();
    const h = (n) => setItems((p) => [n, ...p]);
    s?.on('notification', h);
    return () => s?.off('notification', h);
  }, []);
  const readAll = () => api.put('/notifications/read-all').then(() => { setItems((p) => p.map((n) => ({ ...n, is_read: 1 }))); setUnread(0); });
  return (
    <>
      <div className="row between"><h2>Notifications</h2><button className="ghost" onClick={readAll}>Mark all read</button></div>
      {items.map((n) => (<div key={n.id} className={'card' + (n.is_read ? '' : ' unread')}>{n.message}
        <div className="mute">{new Date(n.created_at).toLocaleString()}</div></div>))}
      {!items.length && <Empty>You're all caught up.</Empty>}
    </>
  );
}
