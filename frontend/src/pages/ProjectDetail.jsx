import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import Chat from '../components/Chat';
import ResourceList from '../components/ResourceList';
import { Tags } from './Projects';
import Avatar from '../components/Avatar';

function Reviews({ project }) {
  const { user } = useAuth();
  const [done, setDone] = useState([]);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  const load = () => api.get('/reviews/project/' + project.id).then((r) => setDone(r.data));
  useEffect(() => { load(); }, []);
  if (project.status !== 'completed') return <p className="mute">Reviews open once the project owner marks it completed.</p>;
  const submit = async (uid) => {
    const { rating = 5, comment = '' } = form[uid] || {};
    try { await api.post('/reviews', { project_id: project.id, reviewee_id: uid, rating: +rating, comment }); load(); }
    catch (x) { setMsg(errMsg(x)); }
  };
  return (
    <>{msg && <p className="err">{msg}</p>}
      {project.members.filter((m) => m.id !== user.id).map((m) => (
        <div className="card" key={m.id}><b>{m.name}</b>
          {done.includes(m.id) ? <p className="mute">✔ Reviewed</p> : <>
            <select value={form[m.id]?.rating || 5} onChange={(e) => setForm({ ...form, [m.id]: { ...form[m.id], rating: e.target.value } })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}</select>
            <input placeholder="Comment" onChange={(e) => setForm({ ...form, [m.id]: { ...form[m.id], comment: e.target.value } })} />
            <button className="sm" onClick={() => submit(m.id)}>Submit review</button></>}
        </div>))}
    </>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [tab, setTab] = useState('overview');
  const [sugg, setSugg] = useState([]);
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState('');
  const load = () => api.get('/projects/' + id).then((r) => setP(r.data)).catch(() => setMsg('Project not found'));
  useEffect(() => { load(); setTab('overview'); }, [id]);
  useEffect(() => { if (p?.isOwner) api.get('/match/teammates/' + id).then((r) => setSugg(r.data)); }, [p?.isOwner, id]);
  if (!p) return <p className="mute">{msg || 'Loading…'}</p>;
  const act = (fn) => async () => { try { setMsg(''); await fn(); await load(); } catch (x) { setMsg(errMsg(x)); } };
  const tabs = ['overview', ...(p.isMember ? ['chat'] : []), ...(p.isMember ? ['resources'] : []), ...(p.isMember ? ['reviews'] : [])];
  return (
    <>
      <div className="row between"><h2>{p.title}</h2><span className={'pill ' + p.status}>{p.status}</span></div>
      {msg && <p className="err">{msg}</p>}
      <div className="tabs">{tabs.map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === 'overview' && <>
        <div className="card"><p>{p.description}</p><Tags list={p.required_skills} /><div className="mute">Owner: {p.owner_name} · max {p.max_members} members</div>
          {user.role === 'student' && !p.isMember && p.status !== 'completed' && (p.myApplication
            ? <p>Your application: <span className={'pill ' + p.myApplication}>{p.myApplication}</span></p>
            : <div><input placeholder="Why do you want to join?" value={note} onChange={(e) => setNote(e.target.value)} />
              <button onClick={act(() => api.post(`/projects/${id}/apply`, { message: note }).then(() => load()))}>Apply</button></div>)}
          {p.isOwner && <div className="row" style={{ marginTop: 10 }}>
            {p.status !== 'completed' && <button className="sm" onClick={act(() => api.put(`/projects/${id}/status`, { status: 'completed' }))}>Mark completed</button>}
            {p.status === 'completed' && <button className="ghost sm" onClick={act(() => api.put(`/projects/${id}/status`, { status: 'in_progress' }))}>Reopen</button>}</div>}
        </div>
        <h3>Team</h3>
        <div className="grid">{p.members.map((m) => (
          <div className="card row between" key={m.id}><div className="person"><Avatar name={m.name} /><div><Link to={'/profile/' + m.id}><b>{m.name}</b></Link><div className="mute">{m.role}</div></div></div>
            {p.isOwner && m.role !== 'owner' && <button className="danger sm" onClick={act(() => api.delete(`/projects/${id}/members/${m.id}`))}>Remove</button>}</div>))}</div>
        {p.isOwner && p.applications.length > 0 && <><h3 style={{ marginTop: 20 }}>Pending applications</h3>
          {p.applications.map((a) => (<div className="card" key={a.id}><div className="row between"><b>{a.name}</b>
            <div className="row"><button className="sm" onClick={act(() => api.put('/projects/applications/' + a.id, { status: 'accepted' }))}>Accept</button>
              <button className="danger sm" onClick={act(() => api.put('/projects/applications/' + a.id, { status: 'rejected' }))}>Reject</button></div></div>
            <p className="mute">{a.message}</p><Tags list={a.skills} /></div>))}</>}
        {p.isOwner && sugg.length > 0 && <><h3 style={{ marginTop: 20 }}>Suggested teammates</h3>
          <div className="grid">{sugg.slice(0, 6).map((s) => (<div className="card" key={s.id}><div className="row between"><b>{s.name}</b><span className="score">{s.score}%</span></div>
            <Tags list={s.skills} /><button className="ghost sm" onClick={act(() => api.post(`/projects/${id}/invite`, { userId: s.id }))}>Invite</button></div>))}</div></>}
      </>}
      {tab === 'chat' && <div className="card"><Chat projectId={id} /></div>}
      {tab === 'resources' && <ResourceList projectId={id} />}
      {tab === 'reviews' && <Reviews project={p} />}
    </>
  );
}
