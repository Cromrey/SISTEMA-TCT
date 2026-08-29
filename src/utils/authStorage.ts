import { AuthUser, StaffMember, ProductionProject } from '../types';

export const AUTH_USERS_STORAGE_KEY = 'tct_auth_users_v1';
export const ACTIVE_SESSION_STORAGE_KEY = 'tct_active_user_session_v1';
export const ACTIVE_DEVICE_TOKEN_KEY = 'tct_device_session_token_v1';
export const SESSION_INVALIDATION_EVENT = 'tct_session_invalidated';

export const DEFAULT_AUTH_USERS: AuthUser[] = [
  {
    id: 'usr-admin-tct',
    username: 'TCT',
    password: 'TCT',
    role: 'admin',
    fullName: 'Michael Romero (Administrador TCT)',
    dni: '45892314',
    jobTitle: 'Administrador General',
    phone: '+51 990010020',
    email: 'admin@corporaciontct.pe',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export function getStoredUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_AUTH_USERS));
      return DEFAULT_AUTH_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_AUTH_USERS));
      return DEFAULT_AUTH_USERS;
    }
    
    // Ensure root admin TCT account always exists
    let updatedList = [...parsed];
    const hasRootAdmin = updatedList.some(u => u.username?.toUpperCase() === 'TCT');
    if (!hasRootAdmin) {
      updatedList.unshift(DEFAULT_AUTH_USERS[0]);
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(updatedList));
    }
    
    return updatedList;
  } catch (err) {
    console.error('Error loading users from storage:', err);
    return DEFAULT_AUTH_USERS;
  }
}

export function saveStoredUsers(users: AuthUser[]): void {
  try {
    localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('tct_users_updated', { detail: users }));
  } catch (err) {
    console.error('Error saving users to storage:', err);
  }
}

export function getDeviceSessionToken(): string | null {
  try {
    return localStorage.getItem(ACTIVE_DEVICE_TOKEN_KEY) || sessionStorage.getItem(ACTIVE_DEVICE_TOKEN_KEY);
  } catch (err) {
    return null;
  }
}

export function setDeviceSessionToken(token: string | null): void {
  try {
    if (!token) {
      localStorage.removeItem(ACTIVE_DEVICE_TOKEN_KEY);
      sessionStorage.removeItem(ACTIVE_DEVICE_TOKEN_KEY);
    } else {
      localStorage.setItem(ACTIVE_DEVICE_TOKEN_KEY, token);
      sessionStorage.setItem(ACTIVE_DEVICE_TOKEN_KEY, token);
    }
  } catch (err) {
    console.error('Error setting device session token:', err);
  }
}

export function getActiveSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY) || sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id ? parsed : null;
  } catch (err) {
    console.error('Error getting active session:', err);
    return null;
  }
}

export function setActiveSession(user: AuthUser | null, remember: boolean = true): void {
  try {
    if (!user) {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      setDeviceSessionToken(null);
    } else {
      const dataStr = JSON.stringify(user);
      if (remember) {
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, dataStr);
      } else {
        sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, dataStr);
      }
      if (user.currentSessionToken) {
        setDeviceSessionToken(user.currentSessionToken);
      }
    }
  } catch (err) {
    console.error('Error setting active session:', err);
  }
}

export function clearAllActiveSessions(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_DEVICE_TOKEN_KEY);
    sessionStorage.removeItem(ACTIVE_DEVICE_TOKEN_KEY);
    localStorage.removeItem('tct_current_session_id_v1');
    sessionStorage.removeItem('tct_current_session_id_v1');
    localStorage.removeItem('tct_active_live_sessions_v1');
    
    // Also notify server
    try {
      fetch('/api/sessions/clear-all', { method: 'POST' }).catch(() => {});
    } catch (e) {}
  } catch (err) {
    console.error('Error clearing active sessions:', err);
  }
}

export function isSessionSuperceded(user: AuthUser): boolean {
  try {
    const currentDeviceToken = getDeviceSessionToken();
    if (!currentDeviceToken) return false;
    
    const users = getStoredUsers();
    const storedUser = users.find(u => u.id === user.id);
    if (!storedUser || !storedUser.currentSessionToken) return false;

    // Only if a strictly different valid token was registered by a newer login from another window/device
    if (storedUser.currentSessionToken !== currentDeviceToken) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

export function authenticateUser(usernameInput: string, passwordInput: string): { success: boolean; user?: AuthUser; error?: string } {
  const users = getStoredUsers();
  const trimmedUser = usernameInput.trim();
  const trimmedPass = passwordInput.trim();

  if (!trimmedUser || !trimmedPass) {
    return { success: false, error: 'Por favor ingrese usuario y contraseña.' };
  }

  // STRICT Case-Sensitive match for both username and password (respetando mayúsculas y minúsculas)
  const found = users.find(u => {
    const exactUserMatch = u.username === trimmedUser || u.email === trimmedUser;
    const exactPassMatch = u.password === trimmedPass;
    return exactUserMatch && exactPassMatch;
  });

  if (!found) {
    return { success: false, error: 'Usuario o contraseña incorrectos. Recuerde que el sistema distingue entre mayúsculas y minúsculas.' };
  }

  if (!found.isActive) {
    return { success: false, error: 'Esta cuenta de usuario se encuentra desactivada. Contacte al Administrador.' };
  }

  // Generate unique session token for single device concurrency control
  const newSessionToken = `tct_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setDeviceSessionToken(newSessionToken);

  // Update last login timestamp and session token in user store
  const updatedUser: AuthUser = {
    ...found,
    lastLoginAt: new Date().toISOString(),
    currentSessionToken: newSessionToken
  };

  const updatedList = users.map(u => u.id === found.id ? updatedUser : u);
  saveStoredUsers(updatedList);
  setActiveSession(updatedUser, true);

  // Notify other tabs/devices of login concurrency update
  try {
    localStorage.setItem('tct_last_auth_event', JSON.stringify({
      userId: updatedUser.id,
      token: newSessionToken,
      timestamp: Date.now()
    }));
  } catch (e) {}

  return { success: true, user: updatedUser };
}

export function createOrUpdateUser(
  userData: {
    id?: string;
    username: string;
    password: string;
    role: 'admin' | 'employee';
    fullName: string;
    dni?: string;
    jobTitle: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
  }
): { success: boolean; user?: AuthUser; error?: string } {
  const users = getStoredUsers();
  const trimmedUsername = userData.username.trim();

  if (!trimmedUsername) {
    return { success: false, error: 'El nombre de usuario es obligatorio.' };
  }

  if (!userData.password || userData.password.trim().length === 0) {
    return { success: false, error: 'La contraseña es obligatoria.' };
  }

  if (!userData.fullName || userData.fullName.trim().length === 0) {
    return { success: false, error: 'El nombre completo es obligatorio.' };
  }

  // Check unique username
  const existingWithSameName = users.find(
    u => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.id !== userData.id
  );

  if (existingWithSameName) {
    return { success: false, error: `El usuario "${trimmedUsername}" ya está en uso. Por favor elija otro.` };
  }

  if (userData.id) {
    // Update
    const idx = users.findIndex(u => u.id === userData.id);
    if (idx === -1) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const updated: AuthUser = {
      ...users[idx],
      username: trimmedUsername,
      password: userData.password.trim(),
      role: userData.role,
      fullName: userData.fullName.trim(),
      dni: userData.dni?.trim() || users[idx].dni || '',
      jobTitle: userData.jobTitle.trim() || (userData.role === 'admin' ? 'Administrador' : 'Técnico'),
      phone: userData.phone?.trim() || '',
      email: userData.email?.trim() || '',
      isActive: userData.isActive !== undefined ? userData.isActive : users[idx].isActive
    };

    users[idx] = updated;
    saveStoredUsers(users);

    // Update active session if same user
    const currentSession = getActiveSession();
    if (currentSession && currentSession.id === updated.id) {
      setActiveSession(updated, true);
    }

    return { success: true, user: updated };
  } else {
    // Create new
    const newUser: AuthUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      username: trimmedUsername,
      password: userData.password.trim(),
      role: userData.role,
      fullName: userData.fullName.trim(),
      dni: userData.dni?.trim() || '',
      jobTitle: userData.jobTitle.trim() || (userData.role === 'admin' ? 'Administrador' : 'Técnico'),
      phone: userData.phone?.trim() || '',
      email: userData.email?.trim() || '',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const newUsers = [...users, newUser];
    saveStoredUsers(newUsers);
    return { success: true, user: newUser };
  }
}

export function deleteUser(userId: string): { success: boolean; error?: string } {
  const users = getStoredUsers();
  const userToDelete = users.find(u => u.id === userId);

  if (!userToDelete) {
    return { success: false, error: 'El usuario no existe.' };
  }

  if (userToDelete.username.toUpperCase() === 'TCT') {
    return { success: false, error: 'No se puede eliminar la cuenta principal de Administrador "TCT".' };
  }

  const filtered = users.filter(u => u.id !== userId);
  saveStoredUsers(filtered);
  return { success: true };
}

export function deleteAllEmployeesExceptAdmin(): { success: boolean; deletedCount: number } {
  const users = getStoredUsers();
  const adminOnly = users.filter(u => u.username.toUpperCase() === 'TCT' || u.role === 'admin');
  const deletedCount = users.length - adminOnly.length;
  saveStoredUsers(adminOnly);
  return { success: true, deletedCount };
}

export function deleteUsersByFilter(options: {
  role?: 'all' | 'admin' | 'employee';
  jobTitle?: string;
  selectedUserIds?: string[];
}): { success: boolean; remaining: AuthUser[]; deletedCount: number } {
  const users = getStoredUsers();
  const remaining = users.filter(u => {
    // Preserve main TCT account always
    if (u.username.toUpperCase() === 'TCT') return true;

    if (options.selectedUserIds && options.selectedUserIds.includes(u.id)) {
      return false;
    }

    if (options.role && options.role !== 'all' && u.role === options.role) {
      return false;
    }

    if (options.jobTitle && options.jobTitle !== 'all' && u.jobTitle === options.jobTitle) {
      return false;
    }

    return true;
  });

  const deletedCount = users.length - remaining.length;
  saveStoredUsers(remaining);
  return { success: true, remaining, deletedCount };
}

export function resetUsersToDefaults(): AuthUser[] {
  localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_AUTH_USERS));
  window.dispatchEvent(new CustomEvent('tct_users_updated', { detail: DEFAULT_AUTH_USERS }));
  return DEFAULT_AUTH_USERS;
}

// Convert users to StaffMember list for assignment in projects
export function usersToStaffMembers(users: AuthUser[]): StaffMember[] {
  return users
    .filter(u => u.isActive)
    .map(u => ({
      id: u.id,
      name: u.fullName,
      role: u.jobTitle || (u.role === 'admin' ? 'Administrador' : 'Técnico'),
      phone: u.phone || '+51 900 000 000',
      confirmed: true
    }));
}

export interface UserAssignmentsReport {
  staffProductions: Array<{ id: string; title: string; uniqueCode: string; contractNumber?: string; eventDate: string; eventLocation?: string; role?: string }>;
  holderContracts: Array<{ id: string; title: string; uniqueCode: string; contractNumber?: string; eventDate: string; clientName: string }>;
  totalContracts: number;
  totalStaffAssignments: number;
}

export function getUserProjectAssignments(user: AuthUser, projects: any[]): UserAssignmentsReport {
  const staffProductions: Array<{ id: string; title: string; uniqueCode: string; contractNumber?: string; eventDate: string; eventLocation?: string; role?: string }> = [];
  const holderContracts: Array<{ id: string; title: string; uniqueCode: string; contractNumber?: string; eventDate: string; clientName: string }> = [];

  const targetName = (user.fullName || '').toLowerCase().trim();
  const targetUsername = (user.username || '').toLowerCase().trim();

  projects.forEach((p: any) => {
    // Check if staff in assignedStaff
    if (p.assignedStaff && Array.isArray(p.assignedStaff)) {
      const assigned = p.assignedStaff.find((s: any) => 
        (s.id && s.id === user.id) ||
        (s.name && (s.name.toLowerCase().trim() === targetName || s.name.toLowerCase().trim() === targetUsername))
      );
      if (assigned) {
        staffProductions.push({
          id: p.id,
          title: p.title || 'Sin título',
          uniqueCode: p.uniqueCode || 'N/A',
          contractNumber: p.contractNumber || 'S/N',
          eventDate: p.eventDate || 'Por definir',
          eventLocation: p.eventLocation || '',
          role: assigned.role || user.jobTitle
        });
      }
    }

    // Check if contract holder
    const holder = (p.contractHolder || '').toLowerCase();
    if (holder && (holder.includes(targetName) || (targetUsername.length > 2 && holder.includes(targetUsername)))) {
      holderContracts.push({
        id: p.id,
        title: p.title || 'Sin título',
        uniqueCode: p.uniqueCode || 'N/A',
        contractNumber: p.contractNumber || 'S/N',
        eventDate: p.eventDate || 'Por definir',
        clientName: p.clientName || 'Cliente'
      });
    }
  });

  return {
    staffProductions,
    holderContracts,
    totalContracts: holderContracts.length,
    totalStaffAssignments: staffProductions.length
  };
}

/**
 * Checks if a project was created by, advised by, or assigned to a specific user.
 */
export function isProjectAssociatedWithUser(project: ProductionProject, user: AuthUser | null): boolean {
  if (!user) return false;

  const userId = user.id?.trim().toLowerCase();
  const username = user.username?.trim().toLowerCase();
  const fullName = user.fullName?.trim().toLowerCase();
  const dni = user.dni?.trim();

  // 1. Direct creator user ID
  if (project.createdByUserId && userId && project.createdByUserId.toLowerCase().trim() === userId) {
    return true;
  }

  // 2. Direct creator username
  if (project.createdByUsername && username && project.createdByUsername.toLowerCase().trim() === username) {
    return true;
  }

  // 3. Direct creator DNI
  if (project.createdByDni && dni && project.createdByDni.trim() === dni) {
    return true;
  }

  // 4. Direct creator Full Name
  if (project.createdByName && fullName && (
    project.createdByName.toLowerCase().trim() === fullName ||
    fullName.includes(project.createdByName.toLowerCase().trim()) ||
    project.createdByName.toLowerCase().includes(fullName)
  )) {
    return true;
  }

  // 5. Contract Holder / Advisor
  if (project.contractHolder && (
    (fullName && project.contractHolder.toLowerCase().includes(fullName)) ||
    (username && project.contractHolder.toLowerCase().includes(username))
  )) {
    return true;
  }

  // 6. Assigned Staff (if user was assigned technician/camera)
  if (project.assignedStaff && Array.isArray(project.assignedStaff)) {
    const isStaff = project.assignedStaff.some(s => 
      (s.id && userId && s.id.toLowerCase().trim() === userId) ||
      (s.name && fullName && (
        s.name.toLowerCase().trim() === fullName ||
        s.name.toLowerCase().includes(fullName) ||
        fullName.includes(s.name.toLowerCase().trim())
      ))
    );
    if (isStaff) return true;
  }

  return false;
}

/**
 * Checks if a project is visible/accessible to the given user based on corporate role:
 * - Admin: Full visibility (sees all projects created by Admin and all employees).
 * - Employee: Strictly scoped visibility (sees ONLY their own created projects).
 */
export function isProjectVisibleToUser(project: ProductionProject, user: AuthUser | null): boolean {
  if (!user) return false;
  // Admin sees all projects
  if (user.role === 'admin') return true;

  // Employee sees strictly their own created/assigned projects
  return isProjectAssociatedWithUser(project, user);
}

/**
 * Filters a list of projects so that employees only see their own created projects,
 * while administrators see all projects.
 */
export function filterProjectsForUser(projects: ProductionProject[], user: AuthUser | null): ProductionProject[] {
  if (!user) return [];
  if (user.role === 'admin') return projects;
  return projects.filter(p => isProjectVisibleToUser(p, user));
}

