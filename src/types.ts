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
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
  responsibleStaff?: string;
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
  code?: string;
  name: string;
  category: 'Cámara' | 'Lente' | 'Dron' | 'Audio' | 'Iluminación' | 'Accesorios / Memorias' | 'Estabilizadores / Soportes' | 'Almacenamiento' | 'Batería' | 'Accesorio' | string;
  serialNumber?: string;
  imageUrl?: string;
  features?: string;
  registrationDate?: string;
  condition?: 'Operativo' | 'En Mantenimiento' | 'De Baja' | 'Nuevo' | 'good' | 'fair' | 'maintenance' | string;
  checkedOut: boolean;
  isAvailable?: boolean;
  maintenanceRequired?: boolean;
  assignedProjectTitle?: string;
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
  clientAddress?: string; // Domicilio exacto del cliente
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
  appliesIgv?: boolean; // Aplica IGV (18%)
  igvAmount?: number; // Monto calculado del 18% de IGV
  totalBudget: number; // Precio final pactado (incluye IGV si aplica)
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
  
  // Production specifics & Contract terms
  includesPhotobook: boolean;
  photobookPagesCount?: number; // Número de páginas del fotobook (ej. 30, 40, 50 páginas)
  includesPhotoshoot?: boolean; // Sesión fotográfica (1 cámara de foto, plazo 15 días)
  includesDrone: boolean;
  includesFlyerDesign?: boolean; // Diseño de 01 Flyer digital de invitación
  flyerAnticipationDays?: number; // Días de anticipación para entrega del Flyer (ej. 15 días)
  includesAudioVideoSpot?: boolean; // Producir 01 Spot Publicitario de Audio y Video
  spotDuration?: string; // Duración del Spot (ej. "30 seg", "45 seg", "60 seg")
  spotPrice?: number; // Precio por la creación del spot en S/.
  includesLiveStreaming?: boolean; // Transmisión en vivo por internet (Streaming HD)
  liveStreamPrice?: number; // Precio del streaming (si es 0 figura como CORTESÍA)
  giftIncluded?: boolean; // Regalo sorpresa entregado el mismo día de los entregables finales
  usbSpecification?: string; // e.g. "Memoria USB 3.2 de 128 GB" o especificación personalizada
  usbCapacity?: string; // e.g. "128GB", "64GB", "32GB", "256GB"
  technicalCrewDeployment?: string; // e.g. "2 Videógrafos Cine 4K, 1 Fotógrafo Principal, 1 Piloto Operador de Dron Acreditado"
  includeRevisionsPolicy?: boolean; // Si se activa muestra la política de revisiones, si es false está oculta
  revisionRounds?: number; // e.g. 2 rondas de revisiones menores
  revisionDaysLimit?: number; // e.g. 5 días posteriores a la entrega del borrador
  rawCustodyDays?: number; // e.g. 3 días posteriores a la entrega final
  rescheduleNoticeMonths?: number; // e.g. 1 mes de anticipación
  specialContractClause?: string; // Cláusula especial / acuerdos mutuos opcionales
  additionalCustomClauseTitle?: string;
  additionalCustomClause?: string;
  estimatedDeliveryDate: string;
  
  // Multiple event schedules / shifts if applicable
  eventSchedules?: Array<{ id?: string; date: string; startTime: string; endTime: string; reference?: string; notes?: string }>;
  
  // Client Authorization for Online Publication (SI / NO)
  authorizeInternetPublishing?: boolean;
  
  // Staff & Equipment
  assignedStaff: AssignedStaff[];
  equipmentList: EquipmentItem[];
  staffCheckIns?: StaffCheckInRecord[];
  
  // Phases 1 through 6
  phases: PhaseData[];
  
  // Step 3 Contract Export & Sequential Lock Status
  contractExported?: boolean;
  contractExportDate?: string;
  initialCommercialLocked?: boolean;
  contractPendingAttachment?: boolean; // Tacha el avance (25.00%) hasta subir adjuntos de pasos 1, 2, 3
  
  // Creator / Commercial Advisor info
  createdByUserId?: string;
  createdByUsername?: string;
  createdByName?: string;
  createdByDni?: string;
  contractHolderDni?: string;
  
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
    | 'contract_exported'
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

export interface TCTCompanyBankAccount {
  id: string;
  bankName: string; // e.g. "BCP", "BBVA", "Interbank", "Banco de la Nación"
  accountType: 'Corriente' | 'Ahorros' | 'Detracciones';
  accountNumber: string;
  cci?: string;
  holderName: string;
  currency: 'PEN' | 'USD';
}

export interface TCTCompanyInfo {
  legalName: string; // "CORPORACIÓN TCT S.A.C."
  commercialName: string; // "CORPORACIÓN TCT"
  slogan: string; // "Marcando Historia"
  ruc: string; // "20608941253"
  legalRepresentative: string; // "Ing. Michael RomeroReyes"
  productionDirector: string; // "Director de Producción"
  address: string; // "Lima, Perú"
  fiscalAddress?: string;
  phoneMain: string; // "+51 912 345 678"
  phoneSecondary?: string;
  email: string; // "contacto@corporaciontct.com"
  website?: string;
  bankAccounts: TCTCompanyBankAccount[];
  contractMasterStorageDays: number; // default 5 days
  loginLogoConfig?: TCTLoginLogoConfig;
}

export interface TCTLoginLogoConfig {
  logoUrl?: string; // custom image url, uploaded file base64 data, or empty for official default
  shape: 'circle' | 'rounded-square' | 'flat'; // 'circle' = Circular TCT emblem, 'rounded-square' = Rounded square box, 'flat' = No border/flat
  fit: 'cover' | 'contain' | 'fill'; // Object fit for logo image
  scale: number; // 70 to 140 (% scale, 100 is default)
  hasGoldenRing: boolean; // Golden neon aura and border (default true)
  hasGlowHalo: boolean; // Ambient background golden/emerald glow (default true)
  customBorderColor?: string; // Custom border accent
}

export interface TCTContractDesign {
  headerTitle: string; // "CORPORACIÓN TCT"
  headerSubtitle: string; // "Servicios Audiovisuales, Producción Cinematográfica & Fotografía Profesional"
  headerLegalInfo: string; // "RUC: 20608941253 • Jr. Las Camelias 450, San Isidro, Lima • Tel: (01) 748-9200"
  logoType: 'official' | 'custom';
  customLogoUrl?: string;
  fontFamily: 'sans' | 'serif' | 'mono' | 'geometric';
  primaryColor: string; // e.g. '#0f172a'
  accentColor: string; // e.g. '#b45309' or '#f59e0b'
  contractTitle: string; // "CONTRATO PRIVADO DE PRESTACIÓN DE SERVICIOS AUDIOVISUALES"
  contractIntroText: string; // "Conste por el presente documento el contrato de servicios celebrado entre CORPORACIÓN TCT y EL CLIENTE."
  clause4PreservationText: string;
  internetPublishingAgreementText: string;
  footerText: string; // "Documento emitido formalmente por el Sistema Integrado de Gestión Audiovisual de Corporación TCT: SIGAT • Perú"
  signerAdvisorRole: string; // "Director de Producción / Asesor Comercial"
}

export interface TCTMasterRules {
  companyInfo?: TCTCompanyInfo;
  packages: TCTMasterPackage[];
  equipmentCatalog: EquipmentItem[];
  stepChecklists: MasterStepChecklistRule[];
  templateFormats: TemplateDocumentFormat[];
  contractDesign?: TCTContractDesign;
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
  dni?: string; // 8-digit DNI
  jobTitle: string; // e.g. "Administrador General", "Director de Cámara", "Fotógrafo", "Piloto Dron", "Editor & Ingest"
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  currentSessionToken?: string;
}
