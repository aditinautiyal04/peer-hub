import { useEffect, useState } from 'react';
import Empty from '../components/Empty';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import Chat from '../components/Chat';
import { Tags } from './Projects';

export default function Mentorship() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [note, setNote] = useState({});
  const [chatWith, setChatWith] = useState(null);
  const [msg, setMsg] = useState('');
  const load = () => {
    api.get('/mentorship/mine').then((r) => setReqs(r.data));
    if (user.role === 'student') api.get('/match/mentors').then((r) => setMentors(r.data));
  };
  useEffect(() => { load(); }, []);
  const ask = async (id) => { try { await api.post('/mentorship', { alumni_id: id, message: note[id] || '' }); setMsg(''); load(); } catch (x) { setMsg(errMsg(x)); } };
  const decide = (id, status) => api.put('/mentorship/' + id, { status }).then(load);
  if (user.role === 'admin') return <p className="mute">Admins don't take part in mentorship.</p>;
  return (
    <>
      <h2>Mentorship</h2>{msg && <p className="err">{msg}</p>}
      {user.role === 'student' && <><h3>Verified alumni</h3>
        <div className="grid">{mentors.map((m) => {
          const sent = reqs.find((r) => r.other_id === m.id);
          return (<div className="card" key={m.id}><div className="row between"><b>{m.name}</b><span className="score">{m.score}%</span></div>
            <div className="mute">{m.headline} {m.company && '@ ' + m.company}</div><Tags list={m.skills} />
            {sent ? <span className={'pill ' + sent.status}>{sent.status}</span> : <>
              <input placeholder="What do you need help with?" value={note[m.id] || ''} onChange={(e) => setNote({ ...note, [m.id]: e.target.value })} />
              <button className="sm" onClick={() => ask(m.id)}>Request mentorship</button></>}</div>);
        })}</div>
        {!mentors.length && <p className="mute">No verified alumni yet.</p>}</>}
      <h3 style={{ marginTop: 24 }}>{user.role === 'student' ? 'My requests' : 'Requests received'}</h3>
      {reqs.map((r) => (<div className="card" key={r.id}><div className="row between"><div><b>{r.other_name}</b><div className="mute">{r.message}</div></div>
        <div className="row"><span className={'pill ' + r.status}>{r.status}</span>
          {user.role === 'alumni' && r.status === 'pending' && <><button className="sm" onClick={() => decide(r.id, 'accepted')}>Accept</button>
            <button className="danger sm" onClick={() => decide(r.id, 'declined')}>Decline</button></>}
          {r.status === 'accepted' && <button className="ghost sm" onClick={() => setChatWith(chatWith === r.other_id ? null : r.other_id)}>Chat</button>}</div></div>
        {chatWith === r.other_id && <Chat userId={r.other_id} />}</div>))}
      {!reqs.length && <Empty>No mentorship requests yet.</Empty>}
    </>
  );
}
