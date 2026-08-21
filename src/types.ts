export type UserRole = 'admin' | 'employee';

export type EventType = 
  | 'Boda'
  | 'XV Años'
  | 'Evento Corporativo'
  | 'Graduación'
  | 'Concierto / Festival'
  | 'Bautizo / Primera Comunión'
  | 'Spot Publicitario'
  | 'Otro';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'alert';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface IngestLog {
  sdCardsCount: number;
  totalGigabytes: number;
  serverLocation: string;
  backupVerified: boolean;
  technicianName: string;
  backupDate: string;
  notes?: string;
}

export interface FieldPaymentLog {
  paymentStatus: 'paid' | 'agreed_extension' | 'unpaid_alert' | 'pending';
  amountCollected: number;
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Yape/Plin' | 'Tarjeta';
  paymentTime?: string;
  technicianInCharge: string;
  notes?: string;
  receiptNumber?: string;
}

export interface StepAttachment {
  id: string;
  name: string;
  type: string; // 'image' | 'pdf' | 'document' | 'other'
  size: string;
  dataUrl: string; // Base64 or URL
  uploadedAt: string;
  uploadedBy?: string;
}

export interface SocialLinksPublishing {
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  dailymotion?: string;
  googleDrive?: string;
  otherPlatform?: string;
  notes?: string;
  publishedDate?: string;
}

export interface ClientConformityAcceptance {
  accepted: boolean;
  clientFullName: string;
  clientDni: string;
  acceptanceDate: string;
  purgingAuthorized: boolean;
  signatureDataUrl?: string;
  signedDocAttachmentUrl?: string;
  signedDocAttachmentName?: string;
  verificationNotes?: string;
  auditRecordId?: string;
  auditTimestamp?: string;
  auditOfficerName?: string;
  serverFilesPurged?: boolean;
  deliverablesConfirmed?: {
    usbDelivered: boolean;
    photobookDelivered: boolean;
    digitalGalleryDelivered: boolean;
    rawPurgeAuthorized: boolean;
  };
}

export interface StepData {
  stepNumber: number; // 1 to 12
  title: string;
  badgeText: string;
  badgeColor: string;
  status: StepStatus;
  completedAt?: string;
  completedBy?: string;
  deadline?: string;
  notes?: string;
  checklist?: ChecklistItem[];
  attachments?: StepAttachment[];
  // Specific payload data
  links?: {
    label: string;
    url: string;
    platform?: 'youtube' | 'tiktok' | 'facebook' | 'dailymotion' | 'drive' | 'canva' | 'other';
  }[];
  socialLinks?: SocialLinksPublishing;
  conformityAcceptance?: ClientConformityAcceptance;
  ingestData?: IngestLog;
  fieldPaymentData?: FieldPaymentLog;
}

export interface PhaseData {
  phaseNumber: number; // 1 to 6
  name: string;
  description: string;
  color: string;
  steps: StepData[];
}

export interface AssignedStaff {
  id: string;
  name: string;
  role: 'Director de Cámara' | 'Fotógrafo Principal' | 'Piloto Dron' | 'Editor Principal' | 'Asistente de Audio / Iluminación' | 'Diseñador Gráfico' | string;
  phone: string;
  confirmed: boolean;
  checkedIn?: boolean;
  checkInTime?: string;
  checkInStatus?: 'on_time' | 'early' | 'late';
  checkInLocation?: string;
}

export interface StaffCheckInRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  checkInTime: string; // formatted e.g. "18/08/2026 04:30 PM"
  timestamp: string; // ISO string
  status: 'on_time' | 'early' | 'late';
  locationNotes?: string;
  latitude?: number;
  longitude?: number;
  deviceInfo?: string;
  verifiedByQr: boolean;
  notes?: string;
}

export type StaffMember = AssignedStaff;

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'Cámara' | 'Lente' | 'Dron' | 'Audio' | 'Iluminación' | 'Accesorios / Memorias' | 'Estabilizadores / Soportes';
  serialNumber?: string;
  checkedOut: boolean;
  isAvailable?: boolean;
  condition?: 'good' | 'fair' | 'maintenance' | string;
  maintenanceRequired?: boolean;
}

export interface ProductionProject {
  id: string;
  uniqueCode: string; // e.g. TCT-2026-BODA-042
  quotationCode: string; // e.g. COT-2026-042 (Código de Cotización vinculado)
  contractNumber: string; // e.g. CONT-TCT-2026-089 (Código de Contrato)
  contractHolder: string; // e.g. "Ing. Roberto Acuña - Asesor Comercial" (Quién tomó/cerró el contrato)
  title: string;
  clientName: string;
  clientDniRuc?: string;
  clientPhone: string;
  clientEmail: string;
  eventType: EventType;
  eventDate: string; // ISO date YYYY-MM-DD
  eventLocation: string;
  eventAddress?: string;
  eventTime: string;
  eventStartTime?: string;
  eventEndTime?: string;
  
  // Financials in Soles Peruanos (S/.) & Discounts
  listPrice?: number; // Precio de lista original
  discountAmount?: number; // Descuento aplicado en S/.
  discountReason?: string; // Motivo del descuento
  totalBudget: number; // Precio final pactado
  initialDeposit: number;
  paymentMethodDeposit?: string;
  depositOperationCode?: string; // Código de Operación bancaria
  depositBankName?: string; // Banco de procedencia
  depositReceiptUrl?: string;
  depositReceiptName?: string;
  fieldPayment: number;
  finalBalance: number;
  currency: 'PEN'; // Soles Peruanos
  
  // Contract hours & Extra services
  standardHours?: number; // Horas base contratadas (ej. 8 hrs)
  extraHoursCount?: number; // Horas adicionales pactadas
  extraHourRate?: number; // Tarifa por hora adicional S/.
  additionalEquipmentNotes?: string; // Equipos o servicios adicionales
  selectedPackageName?: string; // Nombre del paquete/proforma seleccionado
  proformaAttachmentUrl?: string; // Proforma en PDF o Imagen
  proformaAttachmentName?: string;
  
  // Production specifics
  includesPhotobook: boolean;
  includesPhotoshoot?: boolean; // Sesión fotográfica (1 cámara de foto, plazo 15 días)
  includesDrone: boolean;
  estimatedDeliveryDate: string;
  
  // Multiple event schedules / shifts if applicable
  eventSchedules?: Array<{ date: string; startTime: string; endTime: string }>;
  
  // Client Authorization for Online Publication (SI / NO)
  authorizeInternetPublishing?: boolean;
  
  // Staff & Equipment
  assignedStaff: AssignedStaff[];
  equipmentList: EquipmentItem[];
  staffCheckIns?: StaffCheckInRecord[];
  
  // Phases 1 through 6
  phases: PhaseData[];
  
  // Audit Trail & Logs
  auditLogs?: ProjectAuditLog[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  isDeletedFromServers?: boolean;
  purgedAt?: string;
}

export interface ProjectAuditLog {
  id: string;
  timestamp: string; // ISO string
  formattedDate: string; // e.g. "17/08/2026 10:30 AM"
  userName: string; // e.g. "Ing. Roberto Acuña (Admin)", "Carlos Mendoza (Director)", "Valeria Castro (Editor)"
  userRole: 'admin' | 'employee' | string;
  action: 
    | 'step_completed'
    | 'step_updated'
    | 'checklist_checked'
    | 'field_payment_registered'
    | 'ingest_logged'
    | 'attachment_uploaded'
    | 'social_link_published'
    | 'conformity_signed'
    | 'commercial_edited'
    | 'staff_assigned'
    | 'equipment_assigned'
    | 'staff_checkin_qr'
    | 'manual_note_added'
    | 'project_created';
  title: string;
  description: string;
  stepNumber?: number;
  phaseNumber?: number;
  badgeColor?: string;
  metadata?: Record<string, any>;
}

export interface SmartAlert {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  actionRequired?: string;
}

export interface DecisionInsight {
  type: 'opportunity' | 'risk' | 'productivity' | 'financial';
  title: string;
  description: string;
  metric: string;
  suggestion: string;
}

export interface SyncQueueItem {
  id: string;
  projectId: string;
  projectCode?: string;
  action: 'update_step' | 'update_payment' | 'update_ingest' | 'add_project' | 'update_equipment' | 'add_attachment';
  description: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
}

// Master Rules Types (Reglas TCT)
export interface MasterPackageService {
  id: string;
  name: string;
  category: 'Video' | 'Foto' | 'Audio' | 'Dron' | 'Entrega' | 'Otro';
  description?: string;
}

export interface TCTMasterPackage {
  id: string;
  name: string;
  eventType: EventType;
  basePrice: number;
  price?: number;
  standardHours: number;
  includesDrone: boolean;
  includesPhotobook: boolean;
  description: string;
  includedServices: string[];
  recommendedEquipment: string[];
  slaDaysVideo: number;
  slaDaysPhotobook: number;
  isPopular?: boolean;
  attachmentUrl?: string; // Image or PDF reference URL or base64 data
  attachmentType?: 'image' | 'pdf';
  attachmentName?: string;
}

export interface MasterStepChecklistRule {
  stepNumber: number;
  title: string;
  defaultChecklist: string[];
  requiredDocName?: string;
  guideNotes?: string;
  referenceFileUrl?: string;
  referenceFileName?: string;
}

export interface TemplateDocumentFormat {
  id: string;
  title: string;
  description: string;
  category: 'Contratos' | 'Proformas' | 'Actas y Conformidades' | 'Ingest y Técnica' | 'Guías';
  version: string;
  downloadFilename: string;
  contentTemplate: string; // Plain text or markdown template
  customFileUrl?: string;
  customFileName?: string;
  updatedAt: string;
}

export interface TCTMasterRules {
  packages: TCTMasterPackage[];
  equipmentCatalog: EquipmentItem[];
  stepChecklists: MasterStepChecklistRule[];
  templateFormats: TemplateDocumentFormat[];
  standardExtraHourRate: number;
  maxDiscountPercentageAllowed: number;
  authorizedContractHolders: string[];
}

// User & Authentication Types
export interface AuthUser {
  id: string;
  username: string; // e.g. "TCT" or "carlos"
  password: string; // e.g. "TCT" or "123"
  role: UserRole; // 'admin' | 'employee'
  fullName: string;
  jobTitle: string; // e.g. "Administrador General", "Director de Cámara", "Fotógrafo", "Piloto Dron", "Editor & Ingest"
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}
