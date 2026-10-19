const hues = [262, 275, 250, 285, 240, 300];
export default function Avatar({ name = '?', size = 36 }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const h = hues[(name.charCodeAt(0) || 0) % hues.length];
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${h} 55% 28%)`, color: `hsl(${h} 90% 85%)` }}>{initials}</span>;
}
