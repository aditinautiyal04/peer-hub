import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Tags } from './Projects';

export default function Matches() {
  const [projects, setProjects] = useState([]);
  const [mentors, setMentors] = useState([]);
  useEffect(() => { api.get('/match/projects').then((r) => setProjects(r.data)); api.get('/match/mentors').then((r) => setMentors(r.data)); }, []);
  return (
    <>
      <h2>Smart matches</h2>
      <p className="mute">Ranked by your skills, interests and availability — complete your <Link to="/profile">profile</Link> for better results.</p>
      <h3>Projects for you</h3>
      <div className="grid">{projects.map((p) => (<Link to={'/projects/' + p.id} className="card" key={p.id}>
        <div className="row between"><b>{p.title}</b><span className="score">{p.score}%</span></div><Tags list={p.required_skills} /></Link>))}</div>
      {!projects.length && <p className="mute">No open projects to match.</p>}
      <h3 style={{ marginTop: 24 }}>Mentors for you</h3>
      <div className="grid">{mentors.map((m) => (<Link to={'/profile/' + m.id} className="card" key={m.id}>
        <div className="row between"><b>{m.name}</b><span className="score">{m.score}%</span></div>
        <div className="mute">{m.headline} {m.company && '@ ' + m.company}</div><Tags list={m.skills} /></Link>))}</div>
    </>
  );
}
