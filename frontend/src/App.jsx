import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import api from './api';
import { getSocket } from './socket';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Matches from './pages/Matches';
import Mentorship from './pages/Mentorship';
import Resources from './pages/Resources';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Hackathons from './pages/Hackathons';
import Avatar from './components/Avatar';
import { Mascot } from './components/Art';

function Layout() {
  const { user, logout, setUser } = useAuth();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    api.get('/notifications/unread-count').then((r) => setUnread(r.data.count)).catch(() => {});
    // refresh the saved profile so verification or role changes show without logging in again
    api.get('/auth/me').then((r) => { localStorage.setItem('user', JSON.stringify(r.data)); setUser(r.data); }).catch(() => {});
    const s = getSocket();
    const h = () => setUnread((n) => n + 1);
    s?.on('notification', h);
    return () => s?.off('notification', h);
  }, []);
  if (!user) return <Navigate to="/login" />;
  const links = [['/', 'Dashboard'], ['/projects', 'Projects'], ['/hackathons', 'Hackathons'],
    ...(user.role === 'student' ? [['/matches', 'Matches']] : []),
    ['/mentorship', 'Mentorship'], ['/resources', 'Resources'],
    ['/notifications', `Alerts${unread ? ` (${unread})` : ''}`], ['/profile', 'Profile'],
    ...(user.role === 'admin' ? [['/admin', 'Admin']] : [])];
  return (
    <div className="shell">
      <aside>
        <h1 className="logo"><Mascot size={30} />PEER<span>-HUB</span></h1>
        <nav>{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
        <div className="me"><Avatar name={user.name} size={40} /><b>{user.name}</b><small>{user.role}{user.role === 'alumni' && !user.is_verified ? ' · pending verification' : ''}</small>
          <button className="ghost" onClick={logout}>Log out</button></div>
      </aside>
      <main><Outlet context={{ setUnread }} /></main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/hackathons" element={<Hackathons />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
