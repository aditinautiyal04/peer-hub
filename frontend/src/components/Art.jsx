// Original illustrations: starry "peer network" scene + "Pip", the PEER-HUB mascot.
const STARS = [[40, 40, 1.6], [120, 70, 1.2], [210, 30, 1.8], [300, 80, 1.2], [380, 30, 1.4], [470, 60, 1.8], [560, 28, 1.2], [770, 90, 1.5], [90, 110, 1], [520, 120, 1.1]];
const PTS = [[90, 210], [190, 150], [300, 205], [400, 120], [480, 190], [260, 80], [130, 80]];
const EDGES = [[0, 1], [1, 2], [2, 4], [1, 3], [3, 4], [3, 5], [5, 1], [6, 1], [6, 5]];

export function Scene({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><mask id="pcm"><rect width="800" height="300" fill="#fff" /><circle cx="690" cy="150" r="60" fill="#000" /></mask></defs>
      {STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity=".8" />)}
      <circle cx="640" cy="160" r="96" fill="#f4efff" opacity=".1" />
      <circle cx="640" cy="160" r="72" fill="#f4efff" mask="url(#pcm)" />
      {EDGES.map(([a, b], i) => <line key={i} x1={PTS[a][0]} y1={PTS[a][1]} x2={PTS[b][0]} y2={PTS[b][1]} stroke="#fff" strokeOpacity=".4" strokeWidth="1.5" />)}
      {PTS.map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r="13" fill={i % 3 ? '#ff9fd2' : '#b9a4ff'} opacity=".22" /><circle cx={x} cy={y} r="5" fill={i % 3 ? '#ffd1ec' : '#e0d6ff'} /></g>
      ))}
      <path d="M0 300 V256 Q120 226 260 256 T520 250 T800 240 V300Z" fill="#1c1040" />
      <path d="M0 300 V278 Q180 258 360 280 T800 268 V300Z" fill="#241552" />
      <g transform="translate(578 36)"><Mascot size={90} /></g>
    </svg>
  );
}

export function Mascot({ size = 72, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <path d="M26 46 L20 12 L50 30 Z" fill="#7c4dff" /><path d="M94 46 L100 12 L70 30 Z" fill="#7c4dff" />
      <path d="M28 38 L26 22 L41 31 Z" fill="#ffb7e1" /><path d="M92 38 L94 22 L79 31 Z" fill="#ffb7e1" />
      <ellipse cx="60" cy="70" rx="44" ry="40" fill="#7c4dff" />
      <ellipse cx="60" cy="82" rx="30" ry="22" fill="#a48aff" opacity=".55" />
      <ellipse cx="42" cy="68" rx="9" ry="12" fill="#12091f" /><ellipse cx="78" cy="68" rx="9" ry="12" fill="#12091f" />
      <circle cx="45" cy="63" r="3.8" fill="#fff" /><circle cx="39" cy="73" r="1.9" fill="#fff" />
      <circle cx="81" cy="63" r="3.8" fill="#fff" /><circle cx="75" cy="73" r="1.9" fill="#fff" />
      <ellipse cx="27" cy="84" rx="7" ry="4" fill="#ff9fd2" opacity=".75" /><ellipse cx="93" cy="84" rx="7" ry="4" fill="#ff9fd2" opacity=".75" />
      <path d="M54 86 q6 6 12 0" stroke="#12091f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M28 36 L60 22 L92 36 L60 49 Z" fill="#12091f" />
      <path d="M92 36 L98 56" stroke="#ffd36e" strokeWidth="2.5" strokeLinecap="round" /><circle cx="98" cy="58" r="3.4" fill="#ffd36e" />
    </svg>
  );
}

export function Petals({ n = 12 }) {
  return (
    <div className="petals" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <i key={i} style={{ left: `${(i * 83) % 100}%`, animationDelay: `${-(i * 1.7) % 14}s`, animationDuration: `${11 + (i % 5) * 2}s`, transform: `scale(${0.7 + (i % 4) * 0.2})` }} />
      ))}
    </div>
  );
}
