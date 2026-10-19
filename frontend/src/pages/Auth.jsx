import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import { Scene, Petals } from '../components/Art';

export default function Auth() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'student' });
  const [err, setErr] = useState('');
  if (user) return <Navigate to="/" />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { const r = await api.post('/auth/' + mode, f); login(r.data); nav('/'); }
    catch (x) { setErr(errMsg(x)); }
  };
  return (
    <div className="auth">
      <section className="auth-hero">
        <Petals />
        <h1 className="logo">PEER<span>-HUB</span></h1>
        <div>
          <h1>Find your team. Ship the project.</h1>
          <p>One place where students form teams, alumni mentor, and admins keep it all running.</p>
        </div>
        <Scene className="auth-art" />
        <div className="auth-roles">
          <div><b>Students</b><span>Match with projects and teammates by skill</span></div>
          <div><b>Alumni</b><span>Mentor, share resources, guide placements</span></div>
          <div><b>Admins</b><span>Verify alumni and keep the platform healthy</span></div>
        </div>
      </section>
      <section className="auth-form">
        <form onSubmit={submit}>
          <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mute">{mode === 'login' ? 'Log in to continue.' : 'Join as a student or alumni.'}</p>
          {mode === 'register' && <>
            <input placeholder="Full name" value={f.name} onChange={set('name')} />
            <select value={f.role} onChange={set('role')}><option value="student">I'm a student</option><option value="alumni">I'm an alumni</option></select>
          </>}
          <input type="email" placeholder="Email" value={f.email} onChange={set('email')} />
          <input type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} />
          {err && <p className="err">{err}</p>}
          <button style={{ width: '100%' }}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
          <p className="mute" style={{ textAlign: 'center', marginTop: 18 }}>
            {mode === 'login' ? 'New here? ' : 'Already have an account? '}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
              {mode === 'login' ? 'Create an account' : 'Log in'}</a>
          </p>
        </form>
      </section>
    </div>
  );
}
