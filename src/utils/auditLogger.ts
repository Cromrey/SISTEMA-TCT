import { ProductionProject, ProjectAuditLog, UserRole } from '../types';

/**
 * Formats an ISO date string into a user-friendly Peruvian Spanish date and time format
 * e.g., "17 Ago 2026, 03:45 PM"
 */
export const formatAuditTimestamp = (isoString?: string): string => {
  if (!isoString) {
    isoString = new Date().toISOString();
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return isoString;
  }

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const formattedHours = hours.toString().padStart(2, '0');

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
};

/**
 * Calculates human-readable relative time (e.g. "Hace 15 min", "Hace 2 horas", "Ayer")
 */
export const formatTimeAgo = (isoString?: string): string => {
  if (!isoString) return 'Reciente';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Reciente';

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Hace un momento';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  if (diffInHours < 24) return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 30) return `Hace ${diffInDays} días`;
  return formatAuditTimestamp(isoString).split(',')[0];
};

/**
 * Generates a standard audit log entry
 */
export const createAuditEntry = (params: {
  userName: string;
  userRole?: string;
  action: ProjectAuditLog['action'];
  title: string;
  description: string;
  stepNumber?: number;
  phaseNumber?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}): ProjectAuditLog => {
  const timestamp = params.timestamp || new Date().toISOString();
  return {
    id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp,
    formattedDate: formatAuditTimestamp(timestamp),
    userName: params.userName,
    userRole: params.userRole || 'admin',
    action: params.action,
    title: params.title,
    description: params.description,
    stepNumber: params.stepNumber,
    phaseNumber: params.phaseNumber,
    metadata: params.metadata
  };
};

/**
 * Appends an audit log entry to a project, placing the newest entry at the beginning
 */
export const appendAuditLog = (
  project: ProductionProject,
  logEntry: ProjectAuditLog
): ProductionProject => {
  const currentLogs = project.auditLogs || [];
  return {
    ...project,
    auditLogs: [logEntry, ...currentLogs],
    updatedAt: new Date().toISOString()
  };
};
