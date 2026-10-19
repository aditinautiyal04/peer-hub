import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { Scene, Mascot } from '../components/Art';

export default function Dashboard() {
  const { user } = useAuth();
  const [mine, setMine] = useState([]);
  const [rec, setRec] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      const results = await Promise.allSettled([
        api.get('/projects/mine'),
        api.get('/dashboard/stats'),
        user.role === 'student'
          ? api.get('/match/projects')
          : Promise.resolve({ data: [] }),
        user.role !== 'admin'
          ? api.get('/mentorship/mine')
          : Promise.resolve({ data: [] })
      ]);

      if (!active) return;

      const [projects, dashboard, recommendations, mentorship] = results;

      if (projects.status === 'fulfilled') {
        setMine(Array.isArray(projects.value.data)
          ? projects.value.data : []);
      } else {
        setError('Could not load your projects.');
      }

      if (dashboard.status === 'fulfilled') {
        setStats(dashboard.value.data);
      } else {
        setError('Could not load dashboard statistics. Check the backend.');
      }

      if (recommendations.status === 'fulfilled') {
        setRec(Array.isArray(recommendations.value.data)
          ? recommendations.value.data.slice(0, 3) : []);
      }

      if (mentorship.status === 'fulfilled') {
        setReqs(Array.isArray(mentorship.value.data)
          ? mentorship.value.data : []);
      }

      setLoading(false);
    }

    loadDashboard().catch(() => {
      if (active) {
        setError('Unable to load dashboard information.');
        setLoading(false);
      }
    });

    return () => { active = false; };
  }, [user.role]);

  const cards = user.role === 'admin'
    ? [
        { label: 'Total users', value: stats?.totalUsers ?? 0 },
        { label: 'Students', value: stats?.students ?? 0 },
        { label: 'Alumni', value: stats?.alumni ?? 0 },
        { label: 'Pending alumni verification', value: stats?.pendingAlumni ?? 0 },
        { label: 'Total projects', value: stats?.totalProjects ?? 0 },
        { label: 'Completed projects', value: stats?.completedProjects ?? 0 },
        { label: 'Pending mentorship', value: stats?.pendingMentorship ?? 0 },
        { label: 'Student reviews', value: stats?.studentReviews ?? 0 },
        { label: 'Total messages', value: stats?.totalMessages ?? 0 }
      ]
    : [
        { label: 'My projects', value: stats?.myProjects ?? mine.length },
        { label: 'Completed', value: stats?.completedProjects ?? 0 },
        { label: 'Pending mentorship', value: stats?.pendingMentorship ?? 0 },
        { label: 'Student reviews', value: stats?.studentReviews ?? 0 },
        { label: 'Verified alumni', value: stats?.verifiedAlumni ?? 0 },
        { label: 'My messages', value: stats?.myMessages ?? 0 }
      ];

  return (
    <>
      <div className="banner">
        <Scene className="sky" />
        <div>
          <h2>Welcome back, {user.name}</h2>
          <p className="mute">
            Your teams, matches and mentors are all here.
          </p>
        </div>
        <Mascot size={96} />
      </div>

      {error && <div className="card err">{error}</div>}

      <h3>Overview</h3>
      <div className="stats">
        {cards.map((card) => (
          <div className="stat" key={card.label}>
            <b>{loading ? '…' : card.value}</b>
            {card.label}
          </div>
        ))}
      </div>

      {user.role === 'alumni' && !user.is_verified && (
        <div className="card">
          Your alumni account is awaiting admin verification.
          Students can find you once verified.
        </div>
      )}

      <h3>My projects</h3>
      {loading ? (
        <p className="mute">Loading your projects…</p>
      ) : (
        <div className="grid">
          {mine.map((p) => (
            <Link to={'/projects/' + p.id} key={p.id} className="card">
              <b>{p.title}</b>
              <div className="row between">
                <span className={'pill ' + p.status}>{p.status}</span>
                <span className="mute">{p.my_role}</span>
              </div>
            </Link>
          ))}
          {!mine.length && (
            <p className="mute">
              No projects yet — <Link to="/projects">create or join one</Link>.
            </p>
          )}
        </div>
      )}

      {rec.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Recommended for you</h3>
          <div className="grid">
            {rec.map((p) => (
              <Link to={'/projects/' + p.id} key={p.id} className="card">
                <b>{p.title}</b>
                <div className="score">{p.score}% match</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
