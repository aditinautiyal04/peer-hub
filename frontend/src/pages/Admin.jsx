import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const load = () => {
    api.get('/admin/stats').then((r) => setStats(r.data));
    api.get('/admin/users').then((r) => setUsers(r.data));
    api.get('/projects').then((r) => setProjects(r.data));
  };
  useEffect(() => { if (user.role === 'admin') load(); }, []);
  if (user.role !== 'admin') return <Navigate to="/" />;
  const verify = (id) => api.put(`/admin/users/${id}/verify`).then(load);
  const toggle = (u) => api.put(`/admin/users/${u.id}/active`, { active: !u.is_active }).then(load);
  const del = (id) => confirm('Delete this project?') && api.delete('/admin/projects/' + id).then(load);
  return (
    <>
      <h2>Admin dashboard</h2>
      <div className="stats">{Object.entries(stats).map(([k, v]) => <div className="stat" key={k}><b>{v}</b>{k.replace('_', ' ')}</div>)}</div>
      <h3>Users</h3>
      <div className="card" style={{ overflowX: 'auto' }}><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>
        {users.map((u) => (<tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td>
          <td><span className={'pill ' + (u.is_active ? 'on' : 'off')}>{u.is_active ? 'active' : 'deactivated'}</span> {u.role === 'alumni' && !u.is_verified && <span className="pill pending">unverified</span>}</td>
          <td className="row">{u.role === 'alumni' && !u.is_verified && <button className="sm" onClick={() => verify(u.id)}>Verify</button>}
            {u.id !== user.id && <button className={'sm ' + (u.is_active ? 'danger' : 'ghost')} onClick={() => toggle(u)}>{u.is_active ? 'Deactivate' : 'Activate'}</button>}</td></tr>))}
      </tbody></table></div>
      <h3 style={{ marginTop: 24 }}>Projects</h3>
      {projects.map((p) => (<div className="card row between" key={p.id}><div><b>{p.title}</b> <span className={'pill ' + p.status}>{p.status}</span><div className="mute">by {p.owner_name}</div></div>
        <button className="danger sm" onClick={() => del(p.id)}>Delete</button></div>))}
    </>
  );
}
