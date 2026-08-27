import { AuthUser } from '../types';
import { getStoredUsers, saveStoredUsers } from './authStorage';

export const LIVE_SESSIONS_STORAGE_KEY = 'tct_active_live_sessions_v1';
export const SESSION_TERMINATION_EVENT = 'tct_session_terminated_event';

export interface LiveSession {
  sessionId: string;
  userId: string;
  username: string;
  fullName: string;
  role: 'admin' | 'employee';
  jobTitle: string;
  phone?: string;
  email?: string;
  device: string;
  browser: string;
  loginAt: string;
  lastHeartbeat: number;
  isBlocked?: boolean;
  status: 'online' | 'idle' | 'terminated';
}

function getDeviceDescription(): { device: string; browser: string } {
  try {
    const ua = navigator.userAgent;
    let browser = 'Navegador Web';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Google Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
    else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Edg')) browser = 'Microsoft Edge';

    let device = 'Computadora / Desktop';
    if (/Android/i.test(ua)) device = 'Móvil / Tablet Android (Perú)';
    else if (/iPhone|iPad|iPod/i.test(ua)) device = 'Móvil / iPad iOS';
    else if (/Windows/i.test(ua)) device = 'PC Windows';
    else if (/Mac/i.test(ua)) device = 'Apple macOS';

    return { device, browser };
  } catch (e) {
    return { device: 'Dispositivo Conectado', browser: 'Web Browser' };
  }
}

export function getStoredLiveSessions(): LiveSession[] {
  try {
    const raw = localStorage.getItem(LIVE_SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    // Filter out sessions dead for more than 2 hours
    const valid = parsed.filter(s => {
      const diff = now - (s.lastHeartbeat || 0);
      return diff < 1000 * 60 * 120; // 2 hours
    });

    // Update statuses based on heartbeat age
    const updated = valid.map(s => {
      if (s.status === 'terminated') return s;
      const diff = now - (s.lastHeartbeat || 0);
      if (diff < 45 * 1000) {
        return { ...s, status: 'online' as const };
      } else if (diff < 5 * 60 * 1000) {
        return { ...s, status: 'idle' as const };
      }
      return { ...s, status: 'idle' as const };
    });

    return updated;
  } catch (e) {
    console.error('Error loading live sessions:', e);
    return [];
  }
}

export function saveStoredLiveSessions(sessions: LiveSession[]): void {
  try {
    localStorage.setItem(LIVE_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new CustomEvent('tct_live_sessions_updated', { detail: sessions }));
  } catch (e) {
    console.error('Error saving live sessions:', e);
  }
}

export function registerLiveSession(user: AuthUser): LiveSession {
  const sessions = getStoredLiveSessions();
  const { device, browser } = getDeviceDescription();
  const sessionId = `sess_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newSession: LiveSession = {
    sessionId,
    userId: user.id,
    username: user.username,
    fullName: user.fullName || user.username,
    role: user.role,
    jobTitle: user.jobTitle || (user.role === 'admin' ? 'Administrador General' : 'Técnico'),
    phone: user.phone || '',
    email: user.email || '',
    device,
    browser,
    loginAt: new Date().toISOString(),
    lastHeartbeat: Date.now(),
    isBlocked: !user.isActive,
    status: 'online'
  };

  // Remove stale sessions of same user older than 1 minute or update
  const filtered = sessions.filter(s => !(s.userId === user.id && Date.now() - s.lastHeartbeat > 60000));
  filtered.unshift(newSession);

  saveStoredLiveSessions(filtered);
  return newSession;
}

export function updateSessionHeartbeat(sessionId: string): void {
  try {
    const sessions = getStoredLiveSessions();
    const idx = sessions.findIndex(s => s.sessionId === sessionId);
    if (idx !== -1) {
      sessions[idx].lastHeartbeat = Date.now();
      if (sessions[idx].status !== 'terminated') {
        sessions[idx].status = 'online';
      }
      saveStoredLiveSessions(sessions);
    }
  } catch (e) {}
}

export function terminateSessionById(sessionId: string): void {
  const sessions = getStoredLiveSessions();
  const target = sessions.find(s => s.sessionId === sessionId);
  const updated = sessions.map(s => {
    if (s.sessionId === sessionId) {
      return { ...s, status: 'terminated' as const };
    }
    return s;
  });
  saveStoredLiveSessions(updated);

  // Broadcast termination
  window.dispatchEvent(new CustomEvent(SESSION_TERMINATION_EVENT, { 
    detail: { sessionId, userId: target?.userId } 
  }));
}

export function blockAndExpelUser(userId: string): void {
  // 1. Block user in authStorage
  const users = getStoredUsers();
  const updatedUsers = users.map(u => {
    if (u.id === userId) {
      return { ...u, isActive: false };
    }
    return u;
  });
  saveStoredUsers(updatedUsers);

  // 2. Mark all live sessions of this user as terminated
  const sessions = getStoredLiveSessions();
  const updatedSessions = sessions.map(s => {
    if (s.userId === userId) {
      return { ...s, isBlocked: true, status: 'terminated' as const };
    }
    return s;
  });
  saveStoredLiveSessions(updatedSessions);

  // 3. Broadcast termination event
  window.dispatchEvent(new CustomEvent(SESSION_TERMINATION_EVENT, { 
    detail: { userId, blocked: true } 
  }));
}

export function unblockUser(userId: string): void {
  const users = getStoredUsers();
  const updatedUsers = users.map(u => {
    if (u.id === userId) {
      return { ...u, isActive: true };
    }
    return u;
  });
  saveStoredUsers(updatedUsers);

  const sessions = getStoredLiveSessions();
  const updatedSessions = sessions.map(s => {
    if (s.userId === userId) {
      return { ...s, isBlocked: false };
    }
    return s;
  });
  saveStoredLiveSessions(updatedSessions);
}

export function deleteUserAccountAndPurge(userId: string): void {
  // Purge from auth storage
  const users = getStoredUsers();
  const filtered = users.filter(u => u.id !== userId);
  saveStoredUsers(filtered);

  // Terminate sessions
  terminateSessionById(userId);
  const sessions = getStoredLiveSessions().filter(s => s.userId !== userId);
  saveStoredLiveSessions(sessions);

  window.dispatchEvent(new CustomEvent(SESSION_TERMINATION_EVENT, { 
    detail: { userId, deleted: true } 
  }));
}
