import { AuthUser } from '../types';
import { getStoredUsers, saveStoredUsers } from './authStorage';

export const LIVE_SESSIONS_STORAGE_KEY = 'tct_active_live_sessions_v1';
export const CURRENT_SESSION_ID_KEY = 'tct_current_session_id_v1';
export const SESSION_TERMINATION_EVENT = 'tct_session_terminated_event';
export const SESSIONS_REFRESHED_EVENT = 'tct_live_sessions_updated';

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
  ip?: string;
  loginAt: string;
  lastHeartbeat: number;
  isBlocked?: boolean;
  status: 'online' | 'idle' | 'terminated';
  token?: string;
  terminationReason?: 'concurrent_login' | 'admin_forced' | 'user_blocked' | 'inactivity' | 'logout';
  terminationMessage?: string;
}

export function getDeviceDescription(): { device: string; browser: string } {
  try {
    const ua = navigator.userAgent;
    let browser = 'Navegador Web';
    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';

    let device = 'Computadora / Desktop';
    if (/Android/i.test(ua)) {
      if (/Mobile/i.test(ua)) {
        device = '📱 Celular Android (Perú)';
      } else {
        device = '📱 Tablet Android (Perú)';
      }
    } else if (/iPhone/i.test(ua)) {
      device = '📱 iPhone Apple (iOS)';
    } else if (/iPad/i.test(ua)) {
      device = '📱 iPad Apple (iOS)';
    } else if (/Windows/i.test(ua)) {
      device = '💻 PC Windows';
    } else if (/Mac/i.test(ua)) {
      device = '💻 Apple Mac';
    } else if (/Linux/i.test(ua)) {
      device = '💻 Linux Desktop';
    }

    return { device, browser };
  } catch (e) {
    return { device: '📱 Dispositivo Móvil / PC', browser: 'Navegador Web' };
  }
}

export function getCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_ID_KEY) || sessionStorage.getItem(CURRENT_SESSION_ID_KEY);
  } catch (e) {
    return null;
  }
}

export function setCurrentSessionId(sessionId: string | null): void {
  try {
    if (!sessionId) {
      localStorage.removeItem(CURRENT_SESSION_ID_KEY);
      sessionStorage.removeItem(CURRENT_SESSION_ID_KEY);
    } else {
      localStorage.setItem(CURRENT_SESSION_ID_KEY, sessionId);
      sessionStorage.setItem(CURRENT_SESSION_ID_KEY, sessionId);
    }
  } catch (e) {}
}

// In-memory cache of live sessions for instant UI rendering
let cachedLiveSessions: LiveSession[] = [];

export function getStoredLiveSessions(): LiveSession[] {
  try {
    if (cachedLiveSessions.length > 0) {
      return cachedLiveSessions;
    }
    const raw = localStorage.getItem(LIVE_SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedLiveSessions = parsed;
      return parsed;
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function saveStoredLiveSessions(sessions: LiveSession[]): void {
  try {
    cachedLiveSessions = sessions;
    localStorage.setItem(LIVE_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new CustomEvent(SESSIONS_REFRESHED_EVENT, { detail: sessions }));
  } catch (e) {
    console.error('Error saving live sessions:', e);
  }
}

// Asynchronously fetch live sessions from the backend server
export async function fetchLiveSessionsFromServer(): Promise<LiveSession[]> {
  try {
    const res = await fetch('/api/sessions/active', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        saveStoredLiveSessions(data.sessions);
        return data.sessions;
      }
    }
  } catch (err) {
    // Fallback to local storage if offline or server loading
  }
  return getStoredLiveSessions();
}

// Register user session with Single Device Enforcement
export async function registerLiveSession(user: AuthUser): Promise<{ session: LiveSession; hadPreviousSession: boolean }> {
  const { device, browser } = getDeviceDescription();
  const fallbackSessionId = `sess_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fallbackToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let registeredSession: LiveSession = {
    sessionId: fallbackSessionId,
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
    status: 'online',
    token: fallbackToken
  };

  let hadPrevious = false;

  try {
    const res = await fetch('/api/sessions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        jobTitle: user.jobTitle,
        phone: user.phone,
        email: user.email,
        device,
        browser
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.session) {
        registeredSession = data.session;
        hadPrevious = !!data.hadPreviousSession;
      }
    }
  } catch (err) {
    console.warn('Network call to register session failed, using fallback:', err);
  }

  setCurrentSessionId(registeredSession.sessionId);

  // Update local cache
  const currentList = getStoredLiveSessions().filter(s => s.userId !== user.id || s.sessionId === registeredSession.sessionId);
  currentList.unshift(registeredSession);
  saveStoredLiveSessions(currentList);

  return { session: registeredSession, hadPreviousSession: hadPrevious };
}

// Client Heartbeat ping function (checks if terminated or superceded)
export async function sendSessionHeartbeat(
  sessionId: string,
  token: string,
  isIdle: boolean = false
): Promise<{ valid: boolean; reason?: string; message?: string }> {
  if (!sessionId) {
    return { valid: false, reason: 'inactivity', message: 'Sesión no iniciada.' };
  }

  try {
    const res = await fetch('/api/sessions/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, token, isIdle })
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.valid) {
        return {
          valid: false,
          reason: data.reason || 'admin_forced',
          message: data.message || 'Tu sesión ha sido finalizada.'
        };
      }
      return { valid: true };
    }
  } catch (err) {
    // Offline resilience: if offline, session remains locally valid
    return { valid: true };
  }

  return { valid: true };
}

// Terminate / Kick a session (Admin action)
export async function terminateSessionById(sessionId: string, reason?: string): Promise<boolean> {
  try {
    await fetch('/api/sessions/terminate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, reason })
    });
  } catch (e) {}

  // Update local cache
  const sessions = getStoredLiveSessions().map(s => {
    if (s.sessionId === sessionId) {
      return { ...s, status: 'terminated' as const, terminationReason: 'admin_forced' as const };
    }
    return s;
  });
  saveStoredLiveSessions(sessions);

  // Broadcast termination
  window.dispatchEvent(new CustomEvent(SESSION_TERMINATION_EVENT, { 
    detail: { sessionId, reason: 'admin_forced' } 
  }));

  return true;
}

// Block user and immediately expel from all devices
export async function blockAndExpelUser(userId: string): Promise<boolean> {
  // 1. Block user in authStorage
  const users = getStoredUsers();
  const updatedUsers = users.map(u => {
    if (u.id === userId) {
      return { ...u, isActive: false };
    }
    return u;
  });
  saveStoredUsers(updatedUsers);

  // 2. Call backend
  try {
    await fetch('/api/sessions/block-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  } catch (e) {}

  // 3. Mark in local sessions
  const sessions = getStoredLiveSessions().map(s => {
    if (s.userId === userId) {
      return { ...s, isBlocked: true, status: 'terminated' as const, terminationReason: 'user_blocked' as const };
    }
    return s;
  });
  saveStoredLiveSessions(sessions);

  // 4. Broadcast termination event
  window.dispatchEvent(new CustomEvent(SESSION_TERMINATION_EVENT, { 
    detail: { userId, blocked: true, reason: 'user_blocked' } 
  }));

  return true;
}

// Unblock user
export async function unblockUser(userId: string): Promise<boolean> {
  const users = getStoredUsers();
  const updatedUsers = users.map(u => {
    if (u.id === userId) {
      return { ...u, isActive: true };
    }
    return u;
  });
  saveStoredUsers(updatedUsers);

  try {
    await fetch('/api/sessions/unblock-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  } catch (e) {}

  const sessions = getStoredLiveSessions().map(s => {
    if (s.userId === userId) {
      return { ...s, isBlocked: false };
    }
    return s;
  });
  saveStoredLiveSessions(sessions);

  return true;
}

// Delete user account permanently and expel active sessions
export function deleteUserAccountAndPurge(userId: string): boolean {
  const users = getStoredUsers().filter(u => u.id !== userId);
  saveStoredUsers(users);

  try {
    fetch('/api/sessions/block-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  } catch (e) {}

  const sessions = getStoredLiveSessions().filter(s => s.userId !== userId);
  saveStoredLiveSessions(sessions);

  window.dispatchEvent(new CustomEvent(SESSION_TERMINATION_EVENT, { 
    detail: { userId, reason: 'user_deleted' } 
  }));

  return true;
}

// Clean user logout from server
export async function logoutLiveSession(sessionId: string): Promise<void> {
  try {
    await fetch('/api/sessions/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
  } catch (e) {}
  setCurrentSessionId(null);
}
