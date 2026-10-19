import { useEffect, useState } from 'react';
import Empty from './Empty';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';

export default function ResourceList({ projectId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [f, setF] = useState({ title: '', url: '', description: '' });
  const [err, setErr] = useState('');
  const load = () => api.get('/resources', { params: { project_id: projectId } }).then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, [projectId]);
  const add = async (e) => {
    e.preventDefault(); setErr('');
    try { await api.post('/resources', { ...f, project_id: projectId }); setF({ title: '', url: '', description: '' }); load(); }
    catch (x) { setErr(errMsg(x)); }
  };
  return (
    <div>
      <form className="card" onSubmit={add}>
        <h3>Share a resource</h3>
        <input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input placeholder="https://link" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        <input placeholder="Short description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        {err && <p className="err">{err}</p>}<button>Share</button>
      </form>
      {items.map((r) => (
        <div className="card row between" key={r.id}>
          <div><a href={r.url} target="_blank" rel="noreferrer"><b>{r.title}</b></a>
            <div className="mute">{r.description} — {r.author}</div></div>
          {(r.user_id === user.id || user.role === 'admin') && <button className="danger sm" onClick={() => api.delete('/resources/' + r.id).then(load)}>Delete</button>}
        </div>
      ))}
      {!items.length && <Empty>Nothing shared yet. Add the first link above.</Empty>}
    </div>
  );
}
