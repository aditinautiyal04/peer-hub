import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { getSocket } from '../socket';
import { useAuth } from '../auth';

export default function Chat({ projectId, userId }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const end = useRef();
  const ev = projectId ? 'project_message' : 'direct_message';

  useEffect(() => {
    setMsgs([]);
    api.get(projectId ? `/chat/project/${projectId}` : `/chat/direct/${userId}`).then((r) => setMsgs(r.data));
    const s = getSocket();
    const h = (m) => {
      const ok = projectId ? m.project_id === +projectId : m.sender_id === +userId || m.receiver_id === +userId;
      if (ok) setMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));
    };
    s?.on(ev, h);
    return () => s?.off(ev, h);
  }, [projectId, userId]);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    getSocket().emit(ev, projectId ? { projectId, body: text } : { to: userId, body: text });
    setText('');
  };
  return (
    <div className="chat">
      <div className="msgs">
        {msgs.map((m) => (
          <div key={m.id} className={'msg' + (m.sender_id === user.id ? ' me' : '')}>
            <small>{m.sender_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>{m.body}
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={send}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" /><button>Send</button></form>
    </div>
  );
}
