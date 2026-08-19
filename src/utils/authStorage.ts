import { AuthUser, StaffMember } from '../types';

export const AUTH_USERS_STORAGE_KEY = 'tct_auth_users_v1';
export const ACTIVE_SESSION_STORAGE_KEY = 'tct_active_user_session_v1';

export const DEFAULT_AUTH_USERS: AuthUser[] = [
  {
    id: 'usr-admin-tct',
    username: 'TCT',
    password: 'TCT',
    role: 'admin',
    fullName: 'Michael Romero (Administrador TCT)',
    jobTitle: 'Administrador General',
    phone: '+51 990030200',
    email: 'admin@corporaciontct.pe',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-emp-elim',
    username: 'Elim',
    password: 'TCT2',
    role: 'employee',
    fullName: 'Elim Cristóbal Bernabé',
    jobTitle: 'Editor y productor',
    phone: '990050010',
    email: 'elim@corporaciontct.pe',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-emp-arcilla',
    username: 'Arcilla',
    password: 'TCT1',
    role: 'employee',
    fullName: 'Clay Romero Reyes',
    jobTitle: 'Coordinador de Producción',
    phone: '990010010',
    email: 'clay@corporaciontct.pe',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-emp-henry',
    username: 'Henry',
    password: 'TCT3',
    role: 'employee',
    fullName: 'Henry Romero Reyes',
    jobTitle: 'Fotógrafo Principal',
    phone: '990010020',
    email: 'henry@corporaciontct.pe',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-emp-luz',
    username: 'Luz',
    password: 'TCT4',
    role: 'employee',
    fullName: 'Luz Reyes Riveros',
    jobTitle: 'Director de Cámara',
    phone: '980050010',
    email: 'luz@corporaciontct.pe',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-emp-ely',
    username: 'Ely',
    password: 'TCT5',
    role: 'employee',
    fullName: 'Elizabeth Matamoros Fuentes',
    jobTitle: 'Técnico de Audio & Luces',
    phone: '990010054',
    email: 'ely@corporaciontct.pe',
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
    
    // Ensure all standard official TCT staff accounts exist in the storage list
    let updatedList = [...parsed];
    let hadMissing = false;
    
    DEFAULT_AUTH_USERS.forEach(defUser => {
      const exists = updatedList.some(
        u => u.username?.toLowerCase() === defUser.username.toLowerCase() || u.id === defUser.id
      );
      if (!exists) {
        updatedList.push(defUser);
        hadMissing = true;
      }
    });

    if (hadMissing) {
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

  const cleanUser = trimmedUser.toLowerCase().replace(/^@/, '');
  const cleanPass = trimmedPass.toLowerCase();

  const found = users.find(u => {
    const uName = (u.username || '').toLowerCase().trim();
    const uFull = (u.fullName || '').toLowerCase().trim();
    const uFirst = uFull.split(' ')[0] || '';
    const uEmail = (u.email || '').toLowerCase().trim();
    const uPass = (u.password || '').trim();

    const matchesUser = uName === cleanUser || uFull === cleanUser || uFirst === cleanUser || uEmail === cleanUser;
    const matchesPass = uPass === trimmedPass || uPass.toLowerCase() === cleanPass;

    return matchesUser && matchesPass;
  });

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
