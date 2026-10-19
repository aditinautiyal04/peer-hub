import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Empty from '../components/Empty';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';

export const Tags = ({ list }) => <>{(list || '').split(',').filter((x) => x.trim()).map((s) => <span className="tag" key={s}>{s.trim()}</span>)}</>;

export default function Projects() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ title: '', description: '', required_skills: '', max_members: 5 });
  const [err, setErr] = useState('');
  const load = () => api.get('/projects', { params: { q } }).then((r) => setItems(r.data));
  useEffect(() => { load(); }, [q]);
  const create = async (e) => {
    e.preventDefault(); setErr('');
    try { await api.post('/projects', f); setShow(false); setF({ title: '', description: '', required_skills: '', max_members: 5 }); load(); }
    catch (x) { setErr(errMsg(x)); }
  };
  return (
    <>
      <div className="row between"><h2>Projects</h2>
        {user.role !== 'admin' && <button onClick={() => setShow(!show)}>{show ? 'Close' : '+ New project'}</button>}</div>
      {show && <form className="card" onSubmit={create}>
        <input placeholder="Project title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <textarea rows="3" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <input placeholder="Required skills (comma separated: react, node, sql)" value={f.required_skills} onChange={(e) => setF({ ...f, required_skills: e.target.value })} />
        <input type="number" min="2" max="20" value={f.max_members} onChange={(e) => setF({ ...f, max_members: e.target.value })} />
        {err && <p className="err">{err}</p>}<button>Create</button></form>}
      <input placeholder="Search by title or skill…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid">
        {items.map((p) => (
          <Link to={'/projects/' + p.id} key={p.id} className="card">
            <div className="row between"><b>{p.title}</b><span className={'pill ' + p.status}>{p.status}</span></div>
            <p className="mute">{(p.description || '').slice(0, 90)}</p>
            <Tags list={p.required_skills} />
            <div className="mute">by {p.owner_name} · {p.member_count}/{p.max_members} members</div>
          </Link>
        ))}
      </div>
      {!items.length && <Empty>No projects match yet. Start one and invite teammates.</Empty>}
    </>
  );
}
