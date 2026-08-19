import { AuthUser, StaffMember } from '../types';

export const AUTH_USERS_STORAGE_KEY = 'tct_auth_users_v1';
export const ACTIVE_SESSION_STORAGE_KEY = 'tct_active_user_session_v1';

export const DEFAULT_AUTH_USERS: AuthUser[] = [
  {
    id: 'usr-admin-tct',
    username: 'TCT',
    password: 'TCT',
    role: 'admin',
    fullName: 'Ing. Roberto Acuña (Admin TCT)',
    jobTitle: 'Director General & Administrador',
    phone: '+51 999 888 777',
    email: 'admin@corporaciontct.pe',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-emp-carlos',
    username: 'carlos',
    password: '123',
    role: 'employee',
    fullName: 'Carlos Mendoza',
    jobTitle: 'Director de Cámara',
    phone: '+51 912 345 678',
    email: 'carlos.mendoza@corporaciontct.pe',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-emp-valeria',
    username: 'valeria',
    password: '123',
    role: 'employee',
    fullName: 'Valeria Castro',
    jobTitle: 'Fotógrafo Principal',
    phone: '+51 923 456 789',
    email: 'valeria.castro@corporaciontct.pe',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-emp-jorge',
    username: 'jorge',
    password: '123',
    role: 'employee',
    fullName: 'Jorge Huamán',
    jobTitle: 'Piloto Dron',
    phone: '+51 934 567 890',
    email: 'jorge.huaman@corporaciontct.pe',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-emp-pedro',
    username: 'pedro',
    password: '123',
    role: 'employee',
    fullName: 'Pedro Alva',
    jobTitle: 'Editor & Ingest',
    phone: '+51 945 678 901',
    email: 'pedro.alva@corporaciontct.pe',
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
    
    // Ensure the default root TCT admin exists in the list
    const hasTctAdmin = parsed.some(u => u.username?.toUpperCase() === 'TCT');
    if (!hasTctAdmin) {
      const merged = [DEFAULT_AUTH_USERS[0], ...parsed];
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
    
    return parsed;
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
    } else {
      const dataStr = JSON.stringify(user);
      if (remember) {
        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, dataStr);
      } else {
        sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, dataStr);
      }
    }
  } catch (err) {
    console.error('Error setting active session:', err);
  }
}

export function authenticateUser(usernameInput: string, passwordInput: string): { success: boolean; user?: AuthUser; error?: string } {
  const users = getStoredUsers();
  const trimmedUser = usernameInput.trim();
  const trimmedPass = passwordInput.trim();

  if (!trimmedUser || !trimmedPass) {
    return { success: false, error: 'Por favor ingrese usuario y contraseña.' };
  }

  const found = users.find(u => 
    u.username.toLowerCase() === trimmedUser.toLowerCase() && u.password === trimmedPass
  );

  if (!found) {
    return { success: false, error: 'Usuario o contraseña incorrectos. Verifique sus credenciales.' };
  }

  if (!found.isActive) {
    return { success: false, error: 'Esta cuenta de usuario se encuentra desactivada. Contacte al Administrador.' };
  }

  // Update last login timestamp
  const updatedUser: AuthUser = {
    ...found,
    lastLoginAt: new Date().toISOString()
  };

  const updatedList = users.map(u => u.id === found.id ? updatedUser : u);
  saveStoredUsers(updatedList);

  return { success: true, user: updatedUser };
}

export function createOrUpdateUser(
  userData: {
    id?: string;
    username: string;
    password: string;
    role: 'admin' | 'employee';
    fullName: string;
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
