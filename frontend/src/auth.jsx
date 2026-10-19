import { createContext, useContext, useState } from 'react';
import { connect, disconnect } from './socket';
const Ctx = createContext();
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    if (u && localStorage.getItem('token')) { connect(); return JSON.parse(u); }
    return null;
  });
  const login = ({ token, user }) => {
    localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
    connect(); setUser(user);
  };
  const logout = () => { localStorage.clear(); disconnect(); setUser(null); };
  return <Ctx.Provider value={{ user, setUser, login, logout }}>{children}</Ctx.Provider>;
}
