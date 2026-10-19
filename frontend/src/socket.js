import { io } from 'socket.io-client';
import { BASE } from './api';
let s;
export const connect = () => { if (s) s.disconnect(); s = io(BASE || undefined, { auth: { token: localStorage.getItem('token') } }); return s; };
export const disconnect = () => { if (s) s.disconnect(); s = null; };
export const getSocket = () => s;
