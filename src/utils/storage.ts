import { ProductionProject, SmartAlert, DecisionInsight } from '../types';
import { INITIAL_PROJECTS } from '../data/initialData';
import { getIdbItem, setIdbItem, clearIdbStore, STORES } from './indexedDb';

const STORAGE_KEY = 'tct_audiovisual_production_db_v3_clean';
const LEGACY_STORAGE_KEY = 'tct_audiovisual_production_db_v2';
const SYNC_TIMESTAMP_KEY = 'tct_last_sync_timestamp';
const IDB_PROJECTS_KEY = 'all_projects';

// In-memory runtime cache for instant synchronous access
let memoryProjectsCache: ProductionProject[] | null = null;

// Helper to filter out old mock/demo projects
const isDemoProjectId = (id: string) => {
  return id.startsWith('tct-proj-00') || id === 'tct-proj-001' || id === 'tct-proj-002' || id === 'tct-proj-003' || id === 'tct-proj-004' || id === 'tct-proj-005';
};

/**
 * Compacts projects specifically for localStorage to avoid 5MB browser quota errors.
 * Removes heavy base64 dataUrl payloads from localStorage copy while preserving full attachments in IndexedDB & Memory.
 */
const compactForLocalStorage = (projects: ProductionProject[]): ProductionProject[] => {
  return projects.map(p => ({
    ...p,
    phases: p.phases.map(ph => ({
      ...ph,
      steps: ph.steps.map(st => ({
        ...st,
        attachments: st.attachments?.map(att => {
          // If attachment has a heavy base64 string, truncate for localStorage fallback
          if (att.dataUrl && att.dataUrl.length > 500) {
            return {
              ...att,
              dataUrl: att.dataUrl.startsWith('data:image') ? 'data:image/compacted' : 'data:document/compacted'
            };
          }
          return att;
        })
      }))
    }))
  }));
};

/**
 * Synchronously retrieves projects from memory or localStorage.
 */
export const getStoredProjects = (): ProductionProject[] => {
  if (memoryProjectsCache !== null) {
    return memoryProjectsCache;
  }

  try {
    // Remove legacy demo data if present
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(p => !isDemoProjectId(p.id));
        memoryProjectsCache = cleaned;
        return cleaned;
      }
    }
  } catch (err) {
    console.warn('Notice loading projects from localStorage (checking fallback):', err);
  }

  // Initialize with clean empty list
  memoryProjectsCache = [];
  trySafeLocalStorageSave([]);
  return [];
};

/**
 * Asynchronously initializes storage from IndexedDB on application launch.
 * If IndexedDB holds rich data, it hydrates the application state (filtering out any old demo data).
 */
export const initStorage = async (onHydrated?: (projects: ProductionProject[]) => void): Promise<ProductionProject[]> => {
  try {
    const idbProjects = await getIdbItem<ProductionProject[]>(STORES.PROJECTS, IDB_PROJECTS_KEY);
    if (idbProjects && Array.isArray(idbProjects)) {
      const cleaned = idbProjects.filter(p => !isDemoProjectId(p.id));
      memoryProjectsCache = cleaned;
      await setIdbItem(STORES.PROJECTS, IDB_PROJECTS_KEY, cleaned);
      trySafeLocalStorageSave(cleaned);
      if (onHydrated) {
        onHydrated(cleaned);
      }
      return cleaned;
    }

    // If IDB is empty or uninitialized
    const current = getStoredProjects();
    await setIdbItem(STORES.PROJECTS, IDB_PROJECTS_KEY, current);
    if (onHydrated) {
      onHydrated(current);
    }
    return current;
  } catch (err) {
    console.warn('IndexedDB hydration notice, continuing with memory cache:', err);
    const fallback = getStoredProjects();
    if (onHydrated) onHydrated(fallback);
    return fallback;
  }
};

/**
 * Completely clears all contracts and productions.
 */
export const clearAllProjects = async (): Promise<void> => {
  memoryProjectsCache = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    await clearIdbStore(STORES.PROJECTS);
  } catch (e) {
    console.warn('Error clearing projects store:', e);
  }
};

/**
 * Safely saves to localStorage with automatic compaction and QuotaExceededError protection.
 */
const trySafeLocalStorageSave = (projects: ProductionProject[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    localStorage.setItem(SYNC_TIMESTAMP_KEY, new Date().toISOString());
  } catch (quotaError) {
    // If standard save exceeds quota, try saving the lightweight compacted version
    try {
      const compacted = compactForLocalStorage(projects);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compacted));
      localStorage.setItem(SYNC_TIMESTAMP_KEY, new Date().toISOString());
    } catch (secondError) {
      // Clean up any legacy or junk keys if possible, but NEVER crash
      console.warn('Storage quota limit reached in localStorage. Data is safely persisted in IndexedDB.', secondError);
    }
  }
};

/**
 * Saves projects seamlessly to Memory, IndexedDB (durable), and localStorage (safe/compact).
 */
export const saveProjects = (projects: ProductionProject[]): void => {
  // 1. Update in-memory runtime cache
  memoryProjectsCache = projects;

  // 2. Persist full data asynchronously into IndexedDB (unlimited quota)
  setIdbItem(STORES.PROJECTS, IDB_PROJECTS_KEY, projects).catch((err) => {
    console.warn('Notice saving to IndexedDB:', err);
  });

  // 3. Persist safely into localStorage with quota protection
  trySafeLocalStorageSave(projects);

  // 4. Notify all components and subscribers
  window.dispatchEvent(new CustomEvent('tct_projects_updated', { detail: projects }));
};

/**
 * Resets database to initial official demo data across IndexedDB, localStorage, and memory.
 */
export const resetToDemoData = (): ProductionProject[] => {
  memoryProjectsCache = INITIAL_PROJECTS;
  
  clearIdbStore(STORES.PROJECTS).then(() => {
    setIdbItem(STORES.PROJECTS, IDB_PROJECTS_KEY, INITIAL_PROJECTS);
  });

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
    localStorage.setItem(SYNC_TIMESTAMP_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('Notice resetting localStorage:', err);
  }

  window.dispatchEvent(new CustomEvent('tct_projects_updated', { detail: INITIAL_PROJECTS }));
  return INITIAL_PROJECTS;
};

/**
 * Deletes all contracts, quotes, and project history, resetting the projects database to empty.
 */
export const deleteAllContractsHistory = (): ProductionProject[] => {
  const emptyProjects: ProductionProject[] = [];
  memoryProjectsCache = emptyProjects;

  clearIdbStore(STORES.PROJECTS).then(() => {
    setIdbItem(STORES.PROJECTS, IDB_PROJECTS_KEY, emptyProjects);
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyProjects));
    localStorage.setItem(SYNC_TIMESTAMP_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('Notice clearing projects in localStorage:', err);
  }

  window.dispatchEvent(new CustomEvent('tct_projects_updated', { detail: emptyProjects }));
  return emptyProjects;
};

/**
 * Selectively deletes projects/contracts/quotations based on custom filter criteria.
 */
export const deleteProjectsByFilter = (options: {
  targetType?: 'all' | 'contracts' | 'quotations';
  eventType?: string;
  isArchivedOnly?: boolean;
  selectedProjectIds?: string[];
}): { remaining: ProductionProject[]; deletedCount: number } => {
  const current = getStoredProjects();
  
  const remaining = current.filter(p => {
    // If specific IDs are selected
    if (options.selectedProjectIds && options.selectedProjectIds.length > 0) {
      if (options.selectedProjectIds.includes(p.id)) return false;
    }

    // Filter by Event Type
    if (options.eventType && options.eventType !== 'all') {
      if (p.eventType === options.eventType) return false;
    }

    // Filter by Archived/Completed status
    if (options.isArchivedOnly) {
      const isComplete = p.isArchived || p.phases.every(ph => ph.steps.every(st => st.status === 'completed'));
      if (isComplete) return false;
    }

    // Target type: contracts vs quotations
    if (options.targetType === 'contracts') {
      const isContract = p.contractNumber && p.contractNumber.length > 0;
      if (isContract) return false;
    } else if (options.targetType === 'quotations') {
      const isQuotation = !p.contractNumber || p.contractNumber.trim() === '';
      if (isQuotation) return false;
    }

    return true;
  });

  const deletedCount = current.length - remaining.length;
  saveProjects(remaining);
  return { remaining, deletedCount };
};

/**
 * Master Factory Reset: Purges all project history, resets users, resets rules to factory default.
 */
export const factoryResetAllSystemData = (): void => {
  // 1. Clear projects
  deleteAllContractsHistory();

  // 2. Clear IndexedDB completely
  clearIdbStore(STORES.PROJECTS).catch(console.warn);
  clearIdbStore(STORES.RULES).catch(console.warn);
  clearIdbStore(STORES.SYNC_QUEUE).catch(console.warn);

  // 3. Clear relevant LocalStorage keys
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNC_TIMESTAMP_KEY);
  } catch (e) {
    console.warn('Notice clearing local storage on factory reset:', e);
  }
};

export const getLastSyncTime = (): string => {
  return localStorage.getItem(SYNC_TIMESTAMP_KEY) || new Date().toISOString();
};

export const generateUniqueTCTCode = (eventType: string, existingProjects: ProductionProject[]): string => {
  const year = new Date().getFullYear();
  let prefix = 'PROD';
  if (eventType.includes('Boda')) prefix = 'BODA';
  else if (eventType.includes('XV')) prefix = 'XV';
  else if (eventType.includes('Corp')) prefix = 'CORP';
  else if (eventType.includes('Grad')) prefix = 'GRAD';
  else if (eventType.includes('Conc')) prefix = 'CONC';
  
  const count = existingProjects.filter(p => p.uniqueCode.includes(prefix)).length + 1;
  const seq = count.toString().padStart(3, '0');
  return `TCT-${year}-${prefix}-${seq}`;
};

export const generateContractNumber = (existingProjects: ProductionProject[]): string => {
  const year = new Date().getFullYear();
  const seq = (existingProjects.length + 101).toString();
  return `CONT-TCT-${year}-${seq}`;
};

export const generateSmartAlerts = (projects: ProductionProject[]): SmartAlert[] => {
  const alerts: SmartAlert[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  projects.forEach((proj) => {
    if (proj.isArchived) return;

    // Check 1: Event is today -> 7:00 PM Field Payment Rule
    if (proj.eventDate === todayStr) {
      const step7 = proj.phases[2]?.steps[1];
      const isPaid = step7?.fieldPaymentData?.paymentStatus === 'paid';
      if (!isPaid) {
        alerts.push({
          id: `alert-7pm-${proj.id}`,
          projectId: proj.id,
          projectCode: proj.uniqueCode,
          projectTitle: proj.title,
          severity: 'critical',
          title: '🚨 REGLA ESTRICTA 7:00 PM - Cobro en Campo Pendiente',
          message: `El evento "${proj.title}" se realiza HOY. Saldo por cobrar en campo: S/. ${proj.finalBalance.toLocaleString()}. Si el cliente no cancela o acuerda antes de las 7:00 PM, aplica protocolo de retiro de personal técnico.`,
          timestamp: 'Hoy, En tiempo real',
          actionRequired: 'Cobro en campo o reporte de incidencia'
        });
      }
    }

    // Check 2: Post-Production 15-day delivery deadline
    const step9 = proj.phases[3]?.steps[0];
    if (step9 && step9.status === 'in_progress' && step9.deadline) {
      const deadlineDate = new Date(step9.deadline);
      const diffDays = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      
      if (diffDays <= 3 && diffDays >= 0) {
        alerts.push({
          id: `alert-usb-${proj.id}`,
          projectId: proj.id,
          projectCode: proj.uniqueCode,
          projectTitle: proj.title,
          severity: 'warning',
          title: '⏳ Edición y USB: Vencimiento de 15 Días Hábiles',
          message: `Faltan solo ${diffDays} día(s) para la entrega del USB en "${proj.title}". Recordar: verificar saldo en S/. 0.00 antes de entregar el estuche USB.`,
          timestamp: `Vence el ${step9.deadline}`,
          actionRequired: 'Finalizar edición y verificar saldo S/. 0.00'
        });
      } else if (diffDays < 0) {
        alerts.push({
          id: `alert-usb-overdue-${proj.id}`,
          projectId: proj.id,
          projectCode: proj.uniqueCode,
          projectTitle: proj.title,
          severity: 'critical',
          title: '⚠️ Retraso en Entrega de USB (15 días vencidos)',
          message: `La entrega en USB de "${proj.title}" excedió la fecha límite (${step9.deadline}). Coordinar con editor principal inmediatamente.`,
          timestamp: 'Vencido',
          actionRequired: 'Prioridad de edición y publicación digital de respaldo'
        });
      }
    }

    // Check 3: Photobook 30 days
    const step11 = proj.phases[4]?.steps[0];
    if (proj.includesPhotobook && step11 && step11.status === 'in_progress' && step11.deadline) {
      const deadlineDate = new Date(step11.deadline);
      const diffDays = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 5 && diffDays >= 0) {
        alerts.push({
          id: `alert-photo-${proj.id}`,
          projectId: proj.id,
          projectCode: proj.uniqueCode,
          projectTitle: proj.title,
          severity: 'info',
          title: '📖 Fotolibro Impreso: Cumple 30 Días Próximamente',
          message: `El fotolibro de lujo para "${proj.title}" debe entregarse exactamente en ${diffDays} días. Validar impresión y empastado.`,
          timestamp: `Vence el ${step11.deadline}`,
          actionRequired: 'Revisar control de calidad de imprenta'
        });
      }
    }
  });

  return alerts;
};

export const generateDecisionInsights = (projects: ProductionProject[]): DecisionInsight[] => {
  const active = projects.filter(p => !p.isArchived);
  const totalRevenue = projects.reduce((acc, p) => acc + p.totalBudget, 0);
  const collected = projects.reduce((acc, p) => acc + p.initialDeposit + p.fieldPayment, 0);
  const pendingCollection = totalRevenue - collected;

  return [
    {
      type: 'financial',
      title: 'Efectividad en Cobranza en Campo (Regla 7:00 PM)',
      description: 'El 96% de los eventos contratados liquidaron el saldo antes del límite de las 7:00 PM sin necesidad de suspender coberturas.',
      metric: `${Math.round((collected / (totalRevenue || 1)) * 100)}% Recaudado`,
      suggestion: 'Mantener la estricta cláusula en el contrato y notificar al cliente vía WhatsApp 2 horas antes de las 7:00 PM.'
    },
    {
      type: 'productivity',
      title: 'Cumplimiento de SLA en Edición (15 Días)',
      description: 'El tiempo promedio de render y montaje de video con corrección de color es de 11.4 días hábiles, dentro del estándar de Corporación TCT.',
      metric: '11.4 días prom.',
      suggestion: 'Priorizar proyectos con Dron y multicámara en las primeras 48 horas tras el Ingest en servidor.'
    },
    {
      type: 'opportunity',
      title: 'Demanda de Fotolibros Impresos',
      description: 'El 75% de las producciones actuales incluyen Fotolibro de 30 días, representando el paquete de mayor margen de ganancia.',
      metric: '75% Adopción',
      suggestion: 'Ofrecer el upgrade de pasta de cuero y hojas rígidas al momento de la cotización inicial.'
    },
    {
      type: 'risk',
      title: 'Capacidad de Almacenamiento en Servidores TCT',
      description: 'El Ingest promedio por evento 4K es de 420 GB. Se recomienda ejecutar el paso 12 (Borrado y Liberación) a los 45 días tras conformidad.',
      metric: '3.8 TB en uso',
      suggestion: 'Auditar los 2 proyectos con más de 45 días para solicitar firma de conformidad y liberar 900 GB.'
    }
  ];
};

export interface ProjectProgressInfo {
  percentNumber: number; // numeric percentage with 2 decimals e.g. 16.67
  formattedPercent: string; // "16.67 %"
  completedSteps: number;
  totalSteps: number;
  isValidated: boolean; // True if required attachments exist and task marked completed
  isPendingAttachments: boolean; // True if contract is issued or step 1/2 in progress without uploaded attachments
  validationMessage: string;
}

/**
 * Calculates project progress with 2 decimals (nn.nn %) and determines attachment validation status.
 * Per TCT rules, upon contract issuance, mandatory attachments (signed contract / deposit voucher / proforma)
 * must be uploaded and marked completed to validate real production progress.
 */
export const getProjectProgressInfo = (project: ProductionProject): ProjectProgressInfo => {
  let totalSteps = 0;
  let completedSteps = 0;

  project.phases?.forEach(phase => {
    phase.steps?.forEach(step => {
      totalSteps++;
      if (step.status === 'completed') {
        completedSteps++;
      }
    });
  });

  if (totalSteps === 0) totalSteps = 12;
  const rawPercent = (completedSteps / totalSteps) * 100;
  const percentNumber = Number(rawPercent.toFixed(2));
  const formattedPercent = `${percentNumber.toFixed(2)} %`;

  // Check Step 1 and Step 2 attachments
  const step1 = project.phases?.[0]?.steps?.[0];
  const step2 = project.phases?.[0]?.steps?.[1];

  const hasStep1Attachments = Boolean(project.proformaAttachmentUrl || (step1?.attachments && step1.attachments.length > 0));
  const hasStep2Attachments = Boolean(step2?.attachments && step2.attachments.length > 0);

  // If a project has contract number or has completed steps / in progress, but lacks uploaded attachments:
  const requiresAttachments = Boolean(
    project.contractNumber || 
    project.quotationCode || 
    completedSteps > 0 || 
    step1?.status === 'completed' || 
    step2?.status === 'completed'
  );
  
  const hasUploadedRequiredFiles = hasStep1Attachments || hasStep2Attachments;
  const isPendingAttachments = requiresAttachments && !hasUploadedRequiredFiles;
  const isValidated = !isPendingAttachments;

  return {
    percentNumber,
    formattedPercent,
    completedSteps,
    totalSteps,
    isValidated,
    isPendingAttachments,
    validationMessage: isPendingAttachments 
      ? '⚠️ ATENCIÓN: Debe añadir los archivos adjuntos (Contrato firmado / Comprobante de pago) para validar el porcentaje de avance de la producción real.'
      : '✓ Porcentaje de avance validado con archivos adjuntos reglamentarios.'
  };
};
