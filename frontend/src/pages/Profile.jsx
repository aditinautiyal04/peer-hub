import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import { Tags } from './Projects';
import Avatar from '../components/Avatar';

function ChangePassword() {
  const [f, setF] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState({ text: '', ok: false });
  const submit = async (e) => {
    e.preventDefault();
    try { await api.put('/auth/password', f); setF({ current: '', next: '' }); setMsg({ text: 'Password updated', ok: true }); }
    catch (x) { setMsg({ text: errMsg(x), ok: false }); }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h3 style={{ marginTop: 0 }}>Change password</h3>
      <input type="password" placeholder="Current password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} />
      <input type="password" placeholder="New password (6+ characters)" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
      {msg.text && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
      <button>Update password</button>
    </form>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const own = !id || +id === user.id;
  const [p, setP] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const uid = own ? user.id : id;
    api.get(own ? '/profile/me' : '/profile/' + id).then((r) => setP(r.data));
    api.get('/reviews/user/' + uid).then((r) => setReviews(r.data));
  }, [id]);
  if (!p) return <p className="mute">Loading…</p>;
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });
  const save = async (e) => { e.preventDefault(); setP((await api.put('/profile/me', p)).data); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const F = ({ k, label, area }) => (<><label className="mute">{label}</label>{area
    ? <textarea rows="3" value={p[k] || ''} onChange={set(k)} /> : <input value={p[k] || ''} onChange={set(k)} />}</>);
  return (
    <>
      <div className="person" style={{ marginBottom: 8 }}><Avatar name={p.name} size={56} /><h2 style={{ margin: 0 }}>{p.name}</h2></div>
      <div className="row" style={{ marginBottom: 6 }}><span className="pill">{p.role}</span>{p.role === 'alumni' && p.is_verified ? <span className="pill on">verified</span> : null}</div>
      <p className="score">{p.avg_rating ? `★ ${p.avg_rating} (${p.review_count} reviews)` : 'No reviews yet'}</p>
      {own ? (
        <form className="card" onSubmit={save}>
          <F k="headline" label="Headline" /><F k="bio" label="About you" area />
          <F k="skills" label="Skills (comma separated)" /><F k="interests" label="Interests (comma separated)" />
          <F k="availability" label="Availability (e.g. weekends, 10 hrs/week)" />
          {p.role === 'student' && <><F k="branch" label="Branch" /><F k="year" label="Year" /></>}
          {p.role === 'alumni' && <F k="company" label="Company" />}
          <button>Save profile</button> {saved && <span className="ok">Saved ✔</span>}
        </form>
      ) : (
        <div className="card"><p>{p.headline}</p><p>{p.bio}</p><Tags list={p.skills} /><p className="mute">Availability: {p.availability || '—'}</p></div>
      )}
      {own && <ChangePassword />}
      <h3>Peer reviews</h3>
      {reviews.map((r, i) => (<div className="card" key={i}><b>{'★'.repeat(r.rating)}</b> <span className="mute">by {r.reviewer} on {r.project}</span><p>{r.comment}</p></div>))}
    </>
  );
}
