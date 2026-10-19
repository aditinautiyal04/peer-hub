import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import Empty from '../components/Empty';
import { Tags } from './Projects';

const fmt = (s) => { const [y, m, d] = s.split('-'); return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); };
const blank = { title: '', description: '', event_date: '', mode: 'online', location: '', link: '' };

export default function Hackathons() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [team, setTeam] = useState({});
  const [open, setOpen] = useState(null);
  const [people, setPeople] = useState([]);
  const [show, setShow] = useState(false);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const canCreate = user.role === 'admin' || (user.role === 'alumni' && user.is_verified);

  const load = () => api.get('/hackathons').then((r) => setItems(r.data));
  useEffect(() => {
    load();
    if (user.role === 'student') api.get('/projects/mine').then((r) => setTeams(r.data));
  }, []);

  const act = (fn) => async () => { try { setErr(''); await fn(); await load(); } catch (x) { setErr(errMsg(x)); } };
  const toggle = async (id) => {
    if (open === id) return setOpen(null);
    setOpen(id);
    setPeople((await api.get('/hackathons/' + id)).data.participants);
  };
  const create = async (e) => {
    e.preventDefault(); setErr('');
    try { await api.post('/hackathons', f); setShow(false); setF(blank); load(); } catch (x) { setErr(errMsg(x)); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <div className="row between"><h2>Hackathons</h2>
        {canCreate && <button onClick={() => setShow(!show)}>{show ? 'Close' : '+ Post hackathon'}</button>}</div>
      <p className="mute">Register alone or with one of your teams, and meet other participants.</p>
      {err && <p className="err">{err}</p>}
      {show && (
        <form className="card" onSubmit={create}>
          <input placeholder="Hackathon title" value={f.title} onChange={set('title')} />
          <textarea rows="3" placeholder="What is it about?" value={f.description} onChange={set('description')} />
          <div className="row">
            <div style={{ flex: 1 }}><label className="mute">Date</label><input type="date" value={f.event_date} onChange={set('event_date')} /></div>
            <div style={{ flex: 1 }}><label className="mute">Mode</label>
              <select value={f.mode} onChange={set('mode')}><option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option></select></div>
          </div>
          <input placeholder="Location (optional)" value={f.location} onChange={set('location')} />
          <input placeholder="Event link (optional, https://...)" value={f.link} onChange={set('link')} />
          <button>Post</button>
        </form>
      )}
      {items.map((h) => (
        <div className="card" key={h.id}>
          <div className="row between"><b style={{ fontFamily: 'var(--display)', fontSize: 17 }}>{h.title}</b>
            <span className={'pill ' + (h.past ? 'completed' : 'open')}>{h.past ? 'ended' : 'upcoming'}</span></div>
          <p>{h.description}</p>
          <div className="mute">{fmt(h.event_date)} · {h.mode}{h.location ? ' · ' + h.location : ''} · by {h.organizer}</div>
          <div className="row" style={{ marginTop: 12 }}>
            {user.role === 'student' && !h.past && (h.joined
              ? <button className="ghost sm" onClick={act(() => api.delete(`/hackathons/${h.id}/join`))}>Leave</button>
              : <>
                <select style={{ width: 'auto', margin: 0 }} value={team[h.id] || ''} onChange={(e) => setTeam({ ...team, [h.id]: e.target.value })}>
                  <option value="">Join solo</option>{teams.map((t) => <option key={t.id} value={t.id}>With team: {t.title}</option>)}</select>
                <button className="sm" onClick={act(() => api.post(`/hackathons/${h.id}/join`, { project_id: team[h.id] || null }))}>Register</button>
              </>)}
            {h.joined && <span className="pill accepted">registered</span>}
            <button className="ghost sm" onClick={() => toggle(h.id)}>{open === h.id ? 'Hide' : h.participant_count + ' participants'}</button>
            {h.link && <a href={h.link} target="_blank" rel="noreferrer">Event page</a>}
            {(h.organizer_id === user.id || user.role === 'admin') && <button className="danger sm" onClick={act(() => api.delete('/hackathons/' + h.id))}>Delete</button>}
          </div>
          {open === h.id && (
            <div style={{ marginTop: 12 }}>
              {people.map((p) => (<div key={p.id} className="row between" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}>
                <span><b>{p.name}</b> {p.project && <span className="mute">· team {p.project}</span>}</span><span><Tags list={p.skills} /></span></div>))}
              {!people.length && <p className="mute">No one has registered yet.</p>}
            </div>
          )}
        </div>
      ))}
      {!items.length && <Empty>No hackathons yet.</Empty>}
    </>
  );
}
