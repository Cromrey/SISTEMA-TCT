import { ProductionProject, ProjectAuditLog } from '../types';
import { createDefaultPhases } from './templateWorkflow';
import { formatAuditTimestamp } from '../utils/auditLogger';

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];

const dateToday = formatDate(today);

const dateTomorrow = new Date(today);
dateTomorrow.setDate(today.getDate() + 1);
const dateTomorrowStr = formatDate(dateTomorrow);

const datePast10 = new Date(today);
datePast10.setDate(today.getDate() - 10);
const datePast10Str = formatDate(datePast10);

const datePast28 = new Date(today);
datePast28.setDate(today.getDate() - 28);
const datePast28Str = formatDate(datePast28);

const datePast50 = new Date(today);
datePast50.setDate(today.getDate() - 50);
const datePast50Str = formatDate(datePast50);

const dateFuture20 = new Date(today);
dateFuture20.setDate(today.getDate() + 20);
const dateFuture20Str = formatDate(dateFuture20);

// Helper for initial seed logs
const makeLog = (
  id: string,
  daysAgo: number,
  userName: string,
  userRole: string,
  action: ProjectAuditLog['action'],
  title: string,
  description: string,
  stepNumber?: number
): ProjectAuditLog => {
  const d = new Date(today.getTime() - daysAgo * 86400000);
  const iso = d.toISOString();
  return {
    id,
    timestamp: iso,
    formattedDate: formatAuditTimestamp(iso),
    userName,
    userRole,
    action,
    title,
    description,
    stepNumber
  };
};

// Project 1: Evento HOY (en vivo - Día del Evento y cobro 7:00 PM)
const phasesProject1 = createDefaultPhases(dateToday, true);
phasesProject1[0].steps.forEach(s => s.status = 'completed');
phasesProject1[1].steps.forEach(s => s.status = 'completed');
phasesProject1[2].steps[0].status = 'in_progress'; // Viaje y Filmación Técnica
phasesProject1[2].steps[1].status = 'pending'; // Regla de Cobro 7:00 PM activa hoy!

// Project 2: En Post-Producción (Día 10 de 15 días hábiles - Edición USB)
const phasesProject2 = createDefaultPhases(datePast10Str, true);
phasesProject2[0].steps.forEach(s => s.status = 'completed');
phasesProject2[1].steps.forEach(s => s.status = 'completed');
phasesProject2[2].steps.forEach(s => s.status = 'completed');
phasesProject2[2].steps[1].fieldPaymentData = {
  paymentStatus: 'paid',
  amountCollected: 1600,
  paymentMethod: 'Efectivo',
  paymentTime: '18:30 PM (Cumplido antes de 7:00 PM)',
  technicianInCharge: 'Carlos Mendoza - Director TCT',
  receiptNumber: 'REC-TCT-8834'
};
phasesProject2[2].steps[2].ingestData = {
  sdCardsCount: 8,
  totalGigabytes: 480,
  serverLocation: 'NAS-TCT-01 / Proyectos-2026/TCT-2026-0412',
  backupVerified: true,
  technicianName: 'Pedro Alva',
  backupDate: datePast10Str
};
phasesProject2[3].steps[0].status = 'in_progress'; // Edición USB
phasesProject2[3].steps[0].checklist![0].completed = true;
phasesProject2[3].steps[0].checklist![1].completed = true;

// Project 3: En Fotolibro Impreso (Día 28 de 30 días calendarizados)
const phasesProject3 = createDefaultPhases(datePast28Str, true);
phasesProject3[0].steps.forEach(s => s.status = 'completed');
phasesProject3[1].steps.forEach(s => s.status = 'completed');
phasesProject3[2].steps.forEach(s => s.status = 'completed');
phasesProject3[3].steps.forEach(s => s.status = 'completed');
// Step 10: Redes sociales publicadas
phasesProject3[3].steps[1].status = 'completed';
phasesProject3[3].steps[1].socialLinks = {
  tiktok: 'https://www.tiktok.com/@corporaciontct/video/73891283921',
  youtube: 'https://www.youtube.com/watch?v=corporacion_tct_gala_minera',
  facebook: 'https://www.facebook.com/CorporacionTCT/posts/991823741',
  dailymotion: 'https://www.dailymotion.com/video/x8gala01',
  googleDrive: 'https://drive.google.com/drive/folders/1GALA_MINERA_TCT_RAW_4K',
  notes: 'Enlaces aprobados y difundidos con éxito.'
};
phasesProject3[4].steps[0].status = 'in_progress'; // Fotolibro
phasesProject3[4].steps[0].checklist![0].completed = true;
phasesProject3[4].steps[0].checklist![1].completed = true;
phasesProject3[4].steps[0].checklist![2].completed = true;
phasesProject3[4].steps[0].checklist![3].completed = true;

// Project 4: En Planificación (Flyer y Logística)
const phasesProject4 = createDefaultPhases(dateFuture20Str, true);
phasesProject4[0].steps.forEach(s => s.status = 'completed');
phasesProject4[1].steps[0].status = 'in_progress'; // Flyer
phasesProject4[1].steps[1].status = 'pending';

// Project 5: Culminado y Depurado
const phasesProject5 = createDefaultPhases(datePast50Str, true);
phasesProject5.forEach(p => p.steps.forEach(s => {
  s.status = 'completed';
  s.checklist?.forEach(c => c.completed = true);
}));
phasesProject5[3].steps[1].socialLinks = {
  tiktok: 'https://www.tiktok.com/@corporaciontct/video/73771928311',
  youtube: 'https://www.youtube.com/watch?v=boda_andrea_gonzalo_tct',
  facebook: 'https://www.facebook.com/CorporacionTCT/posts/882716291',
  dailymotion: 'https://www.dailymotion.com/video/x8boda05',
  googleDrive: 'https://drive.google.com/drive/folders/1BODA_ANDREA_TCT_FINAL',
  notes: 'Publicado y aprobado por los novios.'
};
phasesProject5[5].steps[0].status = 'completed';
phasesProject5[5].steps[0].completedAt = datePast10Str;
phasesProject5[5].steps[0].conformityAcceptance = {
  accepted: true,
  clientFullName: 'Andrea Navarro De la Cuba',
  clientDni: '47891234',
  acceptanceDate: datePast10Str,
  purgingAuthorized: true,
  verificationNotes: 'Cliente firmó conformidad física y digital tras recibir estuche con USB y 2 Fotolibros.',
  signedDocAttachmentName: 'ACTA-CONFORMIDAD-FIRMADA-ANDREA-NAVARRO.pdf'
};

export const INITIAL_PROJECTS: ProductionProject[] = [];

