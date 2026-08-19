/**
 * Custom Keyboard Shortcuts Manager for Corporacion TCT
 * Allows users to customize shortcuts, enable/disable them, and map them to system functions.
 */

export interface KeyboardShortcutConfig {
  id: string;
  actionId: string;
  name: string;
  description: string;
  category: 'projects' | 'navigation' | 'reports' | 'system';
  keys: string; // e.g. "ctrl+n", "ctrl+f", "alt+c", "ctrl+shift+p"
  enabled: boolean;
  isCustom?: boolean;
}

export const SHORTCUT_ACTIONS = [
  { actionId: 'open_new_project', name: 'Nueva Producción / Contrato', description: 'Abre el formulario para emitir una nueva producción', category: 'projects' as const, defaultKeys: 'ctrl+n' },
  { actionId: 'focus_search', name: 'Buscar Expedientes', description: 'Enfoca la barra de búsqueda de proyectos', category: 'projects' as const, defaultKeys: 'ctrl+f' },
  { actionId: 'open_calendar', name: 'Abrir Calendario de Eventos', description: 'Cambia a la vista de calendario mensual de eventos', category: 'navigation' as const, defaultKeys: 'alt+c' },
  { actionId: 'open_timeline', name: 'Abrir Cronograma Gantt', description: 'Cambia a la vista de cronograma de 12 pasos', category: 'navigation' as const, defaultKeys: 'alt+g' },
  { actionId: 'open_executive', name: 'Abrir Resumen Ejecutivo', description: 'Cambia al panel de métricas y gráficos ejecutivos', category: 'navigation' as const, defaultKeys: 'alt+e' },
  { actionId: 'open_analytics', name: 'Toma de Decisiones & Comparativas', description: 'Abre el módulo de analítica y comparativa de empleados', category: 'reports' as const, defaultKeys: 'alt+d' },
  { actionId: 'export_pdf', name: 'Exportar Reportes PDF Oficial', description: 'Abre la ventana de generación de informes PDF TCT', category: 'reports' as const, defaultKeys: 'ctrl+p' },
  { actionId: 'open_rules', name: 'Abrir Reglas & Configuración', description: 'Abre el panel maestro de reglas, usuarios y atajos', category: 'system' as const, defaultKeys: 'alt+r' },
  { actionId: 'toggle_view_list', name: 'Vista de Lista de Expedientes', description: 'Regresa a la vista principal de expedientes', category: 'navigation' as const, defaultKeys: 'alt+l' },
  { actionId: 'filter_due_soon', name: 'Filtrar Por Vencer / Alertas', description: 'Aplica el filtro rápido de expedientes en riesgo SLA', category: 'projects' as const, defaultKeys: 'alt+v' },
  { actionId: 'filter_this_week', name: 'Filtrar Eventos Esta Semana', description: 'Filtra las producciones programadas para los próximos 7 días', category: 'projects' as const, defaultKeys: 'alt+s' },
];

export const DEFAULT_SHORTCUTS: KeyboardShortcutConfig[] = SHORTCUT_ACTIONS.map(a => ({
  id: `sc_${a.actionId}`,
  actionId: a.actionId,
  name: a.name,
  description: a.description,
  category: a.category,
  keys: a.defaultKeys,
  enabled: true,
  isCustom: false
}));

const STORAGE_KEY = 'tct_custom_keyboard_shortcuts_v1';

export function getStoredShortcuts(): KeyboardShortcutConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SHORTCUTS;
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

export function saveStoredShortcuts(shortcuts: KeyboardShortcutConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  } catch (err) {
    console.error('Error saving shortcuts:', err);
  }
}

export function resetShortcutsToDefault(): KeyboardShortcutConfig[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return DEFAULT_SHORTCUTS;
}

/**
 * Helper to normalize key combo string e.g. "ctrl+n" -> ["Control", "n"]
 */
export function normalizeCombo(combo: string): string {
  return combo
    .toLowerCase()
    .replace(/\s+/g, '')
    .split('+')
    .sort()
    .join('+');
}

/**
 * Check if KeyboardEvent matches shortcut keys string
 */
export function matchesShortcut(e: KeyboardEvent, keysString: string): boolean {
  if (!keysString) return false;
  const parts = keysString.toLowerCase().replace(/\s+/g, '').split('+');
  
  const hasCtrl = parts.includes('ctrl') || parts.includes('control');
  const hasAlt = parts.includes('alt');
  const hasShift = parts.includes('shift');
  const hasMeta = parts.includes('meta') || parts.includes('cmd') || parts.includes('command');
  
  const keyPart = parts.find(p => !['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(p));

  const ctrlMatches = (e.ctrlKey || e.metaKey) === (hasCtrl || hasMeta);
  const altMatches = e.altKey === hasAlt;
  const shiftMatches = e.shiftKey === hasShift;
  
  if (!ctrlMatches || !altMatches || !shiftMatches) {
    return false;
  }

  if (!keyPart) return false;

  return e.key.toLowerCase() === keyPart.toLowerCase() || e.code.toLowerCase() === `key${keyPart.toLowerCase()}`;
}
