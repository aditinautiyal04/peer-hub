import { Mascot } from './Art';
export default function Empty({ children }) {
  return <div className="empty"><Mascot size={64} /><p>{children}</p></div>;
}
