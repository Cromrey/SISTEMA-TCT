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

export const INITIAL_PROJECTS: ProductionProject[] = [
  {
    id: 'tct-proj-001',
    uniqueCode: 'TCT-2026-BODA-042',
    quotationCode: 'COT-2026-089',
    contractNumber: 'CONT-TCT-2026-089',
    contractHolder: 'Ing. Roberto Acuña - Asesor Comercial Principal',
    title: 'Boda Elegance: Mariana Valdivia & Carlos Benavides',
    clientName: 'Mariana Valdivia',
    clientPhone: '+51 987 654 321',
    clientEmail: 'mariana.valdivia@gmail.com',
    eventType: 'Boda',
    eventDate: dateToday,
    eventLocation: 'Hacienda Villa Verde, Pachacámac, Lima',
    eventTime: '15:00 - 02:00',
    selectedPackageName: 'Paquete Boda de Oro (Cine 4K + Dron + Fotolibro)',
    listPrice: 3800,
    discountAmount: 300,
    discountReason: 'Promoción Feria Nupcial 2026',
    totalBudget: 3500,
    initialDeposit: 1500,
    fieldPayment: 0, // Pendiente de cobro HOY antes de 7:00 PM
    finalBalance: 2000,
    currency: 'PEN',
    standardHours: 10,
    extraHoursCount: 1,
    extraHourRate: 150,
    additionalEquipmentNotes: '1x Dron adicional DJI Mavic 3 Pro para exteriores + 2 Micrófonos corbateros',
    includesPhotobook: true,
    includesDrone: true,
    estimatedDeliveryDate: formatDate(new Date(today.getTime() + 15 * 86400000)),
    assignedStaff: [
      { id: 'st-1', name: 'Carlos Mendoza', role: 'Director de Cámara', phone: '+51 912 345 678', confirmed: true },
      { id: 'st-2', name: 'Valeria Castro', role: 'Fotógrafo Principal', phone: '+51 923 456 789', confirmed: true },
      { id: 'st-3', name: 'Jorge Huamán', role: 'Piloto Dron', phone: '+51 934 567 890', confirmed: true },
      { id: 'st-4', name: 'Mateo Quispe', role: 'Editor Principal', phone: '+51 945 678 901', confirmed: true }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Sony FX3 Cinema Camera + 24-70mm f/2.8 GM II', category: 'Cámara', checkedOut: true },
      { id: 'eq-2', name: 'Sony A7 IV + 70-200mm f/2.8 GM', category: 'Cámara', checkedOut: true },
      { id: 'eq-3', name: 'DJI Mavic 3 Pro Cine Drone', category: 'Dron', checkedOut: true },
      { id: 'eq-4', name: 'Kit Micrófonos Inalámbricos DJI Mic 2', category: 'Audio', checkedOut: true },
      { id: 'eq-5', name: 'Kit Luces Nanlite Forza 60B + Softbox', category: 'Iluminación', checkedOut: true },
      { id: 'eq-6', name: '4x Tarjetas SanDisk Extreme Pro 128GB V90', category: 'Accesorios / Memorias', checkedOut: true }
    ],
    phases: phasesProject1,
    auditLogs: [
      makeLog('log-1-01', 0.1, 'Carlos Mendoza (Director)', 'Director', 'step_updated', 'Paso 5 En Curso: Rodaje en Hacienda Villa Verde', 'El equipo técnico arribó puntualmente a locación y comenzó cobertura preparativos.', 5),
      makeLog('log-1-02', 0.5, 'Ing. Roberto Acuña (Admin)', 'admin', 'step_completed', 'Paso 4 Completado: Almacén y Baterías', 'Verificación de 6 baterías Sony NP-FZ100 al 100% y 4 tarjetas SD formateadas.', 4),
      makeLog('log-1-03', 1, 'Ing. Roberto Acuña (Admin)', 'admin', 'step_completed', 'Paso 3 Completado: Asignación Técnica', 'Asignación de Carlos Mendoza, Valeria Castro y Jorge Huamán con vehículos confirmados.', 3),
      makeLog('log-1-04', 15, 'Ing. Roberto Acuña (Admin)', 'admin', 'step_completed', 'Paso 2 Completado: Contrato y Adelanto S/. 1,500', 'Voucher BCP validado en tesorería y contrato firmado adjuntado.', 2),
      makeLog('log-1-05', 28, 'Ing. Roberto Acuña (Admin)', 'admin', 'project_created', 'Creación del Expediente TCT-2026-BODA-042', 'Apertura de ficha técnica y cotización COT-2026-089 para Mariana Valdivia.')
    ],
    createdAt: datePast28Str,
    updatedAt: dateToday
  },
  {
    id: 'tct-proj-002',
    uniqueCode: 'TCT-2026-XV-038',
    quotationCode: 'COT-2026-074',
    contractNumber: 'CONT-TCT-2026-074',
    contractHolder: 'Valeria Castro - Gestora Senior de Cuentas',
    title: 'XV Años Mágicos: Luciana Fernández',
    clientName: 'Roberto Fernández (Padre)',
    clientPhone: '+51 998 112 233',
    clientEmail: 'r.fernandez@outlook.com',
    eventType: 'XV Años',
    eventDate: datePast10Str,
    eventLocation: 'Salón de Eventos Las Terrazas, Miraflores',
    eventTime: '18:00 - 03:00',
    selectedPackageName: 'Paquete XV Años Deluxe (Cinema + Sesión Previa)',
    listPrice: 3000,
    discountAmount: 200,
    discountReason: 'Descuento especial por recomendación familiar',
    totalBudget: 2800,
    initialDeposit: 1200,
    fieldPayment: 1600, // Cancelado en campo con éxito!
    finalBalance: 0, // Saldo S/. 0 cumplido!
    currency: 'PEN',
    standardHours: 8,
    extraHoursCount: 0,
    extraHourRate: 150,
    additionalEquipmentNotes: 'Sesión Pre-XV en Parque El Olivar + Cuadro de firmas 50x70',
    includesPhotobook: true,
    includesDrone: false,
    estimatedDeliveryDate: formatDate(new Date(new Date(datePast10Str).getTime() + 15 * 86400000)),
    assignedStaff: [
      { id: 'st-1', name: 'Carlos Mendoza', role: 'Director de Cámara', phone: '+51 912 345 678', confirmed: true },
      { id: 'st-4', name: 'Mateo Quispe', role: 'Editor Principal', phone: '+51 945 678 901', confirmed: true }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Sony FX3 Cinema Camera', category: 'Cámara', checkedOut: false },
      { id: 'eq-4', name: 'DJI Mic 2 Inalámbrico', category: 'Audio', checkedOut: false }
    ],
    phases: phasesProject2,
    auditLogs: [
      makeLog('log-2-01', 2, 'Mateo Quispe (Editor)', 'Editor', 'step_updated', 'Paso 8 En Proceso: Edición Trailer 4K', 'Sincronización multicámara y gradación de color completada al 60%.', 8),
      makeLog('log-2-02', 10, 'Pedro Alva (Técnico Ingest)', 'Técnico Ingest', 'ingest_logged', 'Paso 7 Completado: Ingest NAS 480 GB', '8 tarjetas SD copiadas a servidor RAID dual con verificación MD5 completada.', 7),
      makeLog('log-2-03', 10, 'Carlos Mendoza (Director)', 'Director', 'field_payment_registered', 'Paso 6 Completado: Cobro 7:00 PM Liquidado', 'Cobro de saldo S/. 1,600 en efectivo liquidado antes de las 7PM. Recibo REC-TCT-8834.', 6),
      makeLog('log-2-04', 35, 'Valeria Castro (Gestora)', 'employee', 'step_completed', 'Paso 2 Completado: Adelanto S/. 1,200', 'Firma de contrato presencial en oficina Miraflores.', 2),
      makeLog('log-2-05', 50, 'Valeria Castro (Gestora)', 'employee', 'project_created', 'Creación de Expediente TCT-2026-XV-038', 'Apertura de registro y reserva de fecha.')
    ],
    createdAt: datePast50Str,
    updatedAt: datePast10Str
  },
  {
    id: 'tct-proj-003',
    uniqueCode: 'TCT-2026-CORP-015',
    quotationCode: 'COT-2026-062',
    contractNumber: 'CONT-TCT-2026-062',
    contractHolder: 'Ing. Roberto Acuña - Asesor Comercial Principal',
    title: 'Convención Anual & Gala Minera Los Andes',
    clientName: 'Ing. Sofía Morales',
    clientPhone: '+51 976 543 210',
    clientEmail: 'smorales@minera-andes.pe',
    eventType: 'Evento Corporativo',
    eventDate: datePast28Str,
    eventLocation: 'Centro de Convenciones de Lima, San Borja',
    eventTime: '08:00 - 20:00',
    selectedPackageName: 'Paquete Corporativo Spot Publicitario & Evento Institucional',
    listPrice: 5600,
    discountAmount: 400,
    discountReason: 'Convenio Institucional Corporativo 2026',
    totalBudget: 5200,
    initialDeposit: 2500,
    fieldPayment: 2700,
    finalBalance: 0,
    currency: 'PEN',
    standardHours: 12,
    extraHoursCount: 2,
    extraHourRate: 200,
    additionalEquipmentNotes: 'Grabación de audio directo consola matriz + 2 pantallas LED de retorno',
    includesPhotobook: true,
    includesDrone: true,
    estimatedDeliveryDate: formatDate(new Date(new Date(datePast28Str).getTime() + 30 * 86400000)),
    assignedStaff: [
      { id: 'st-2', name: 'Valeria Castro', role: 'Fotógrafo Principal', phone: '+51 923 456 789', confirmed: true },
      { id: 'st-3', name: 'Jorge Huamán', role: 'Piloto Dron', phone: '+51 934 567 890', confirmed: true }
    ],
    equipmentList: [
      { id: 'eq-2', name: 'Sony A7 IV', category: 'Cámara', checkedOut: false },
      { id: 'eq-3', name: 'DJI Mavic 3 Pro', category: 'Dron', checkedOut: false }
    ],
    phases: phasesProject3,
    auditLogs: [
      makeLog('log-3-01', 1, 'Valeria Castro (Fotógrafa)', 'Fotógrafo', 'step_updated', 'Paso 9 En Proceso: Maquetación Fotolibro 30d', 'Revisión final de pliegos y aprobación de portada grabada.', 9),
      makeLog('log-3-02', 8, 'Mateo Quispe (Editor)', 'Editor', 'social_link_published', 'Paso 10 Completado: Redes Oficiales Publicadas', 'Videos TikTok, YouTube 4K y carpeta Drive corporativa compartidas con el cliente.', 10),
      makeLog('log-3-03', 14, 'Mateo Quispe (Editor)', 'Editor', 'step_completed', 'Paso 8 Completado: Video Master 4K Entregado', 'Entrega de video corporativo 4K dentro del plazo de 15 días hábiles.', 8),
      makeLog('log-3-04', 28, 'Carlos Mendoza (Director)', 'Director', 'field_payment_registered', 'Paso 6 Completado: Liquidación S/. 2,700', 'Cobro de saldo cancelado mediante transferencia BCP a las 18:45 PM.', 6),
      makeLog('log-3-05', 50, 'Ing. Roberto Acuña (Admin)', 'admin', 'project_created', 'Creación de Expediente TCT-2026-CORP-015', 'Contrato corporativo cerrado con Minera Los Andes.')
    ],
    createdAt: datePast50Str,
    updatedAt: dateToday
  },
  {
    id: 'tct-proj-004',
    uniqueCode: 'TCT-2026-CONC-007',
    quotationCode: 'COT-2026-095',
    contractNumber: 'CONT-TCT-2026-095',
    contractHolder: 'Lic. Patricia Romero - Coordinadora de Ventas',
    title: 'Festival Musical FestiSur 2026',
    clientName: 'Diego Paredes (Productor)',
    clientPhone: '+51 965 432 198',
    clientEmail: 'diego@festisur.pe',
    eventType: 'Concierto / Festival',
    eventDate: dateFuture20Str,
    eventLocation: 'Explanada Arena 1, Costa Verde',
    eventTime: '14:00 - 04:00',
    selectedPackageName: 'Paquete Festival & Concierto Multicámara 4K',
    listPrice: 7200,
    discountAmount: 400,
    discountReason: 'Descuento por contrato anticipado de temporada',
    totalBudget: 6800,
    initialDeposit: 3000,
    fieldPayment: 0,
    finalBalance: 3800,
    currency: 'PEN',
    standardHours: 14,
    extraHoursCount: 0,
    extraHourRate: 200,
    additionalEquipmentNotes: 'Grúa Jimmy Jib de 6 metros con cabezal robótico',
    includesPhotobook: false,
    includesDrone: true,
    estimatedDeliveryDate: formatDate(new Date(new Date(dateFuture20Str).getTime() + 15 * 86400000)),
    assignedStaff: [
      { id: 'st-1', name: 'Carlos Mendoza', role: 'Director de Cámara', phone: '+51 912 345 678', confirmed: true },
      { id: 'st-3', name: 'Jorge Huamán', role: 'Piloto Dron', phone: '+51 934 567 890', confirmed: true }
    ],
    equipmentList: [],
    phases: phasesProject4,
    auditLogs: [
      makeLog('log-4-01', 2, 'Lic. Patricia Romero', 'employee', 'step_updated', 'Paso 3 En Proceso: Logística de Festival', 'Coordinación de permisos de vuelo de dron en Costa Verde con DICAPI.', 3),
      makeLog('log-4-02', 5, 'Lic. Patricia Romero', 'employee', 'step_completed', 'Paso 2 Completado: Adelanto Inicial S/. 3,000', 'Recepción de abono 50% de reserva.', 2),
      makeLog('log-4-03', 10, 'Lic. Patricia Romero', 'employee', 'project_created', 'Creación de Expediente TCT-2026-CONC-007', 'Registro inicial para el Festival FestiSur 2026.')
    ],
    createdAt: datePast10Str,
    updatedAt: dateToday
  },
  {
    id: 'tct-proj-005',
    uniqueCode: 'TCT-2026-BODA-031',
    quotationCode: 'COT-2026-051',
    contractNumber: 'CONT-TCT-2026-051',
    contractHolder: 'Ing. Roberto Acuña - Asesor Comercial Principal',
    title: 'Boda Real: Andrea & Gonzalo',
    clientName: 'Andrea Navarro',
    clientPhone: '+51 954 321 098',
    clientEmail: 'andrea.navarro@gmail.com',
    eventType: 'Boda',
    eventDate: datePast50Str,
    eventLocation: 'Casona de las Brujas, Cieneguilla',
    eventTime: '16:00 - 03:00',
    selectedPackageName: 'Paquete Boda de Oro (Cine 4K + Dron + Fotolibro)',
    listPrice: 4500,
    discountAmount: 300,
    discountReason: 'Paquete integral con descuento de aniversario',
    totalBudget: 4200,
    initialDeposit: 2000,
    fieldPayment: 2200,
    finalBalance: 0,
    currency: 'PEN',
    standardHours: 10,
    extraHoursCount: 1,
    extraHourRate: 150,
    additionalEquipmentNotes: '2 Fotolibros para padres de 20x20 cm',
    includesPhotobook: true,
    includesDrone: true,
    estimatedDeliveryDate: datePast28Str,
    assignedStaff: [],
    equipmentList: [],
    phases: phasesProject5,
    auditLogs: [
      makeLog('log-5-01', 10, 'Ing. Roberto Acuña (Admin)', 'admin', 'conformity_signed', 'Paso 12 Completado: Acta de Conformidad y Purga RAW', 'Cliente Andrea Navarro firmó conformidad final 100%. Servidores purgados conforme a cláusula.', 12),
      makeLog('log-5-02', 15, 'Ing. Roberto Acuña (Admin)', 'admin', 'step_completed', 'Paso 11 Completado: Entrega de Fotolibro de Lujo', 'Entrega física en oficina TCT con saldo final liquidado a S/. 0.00.', 11),
      makeLog('log-5-03', 25, 'Mateo Quispe (Editor)', 'Editor', 'step_completed', 'Paso 8 Completado: Master 4K USB Entregado', 'Estuche grabado con USB 3.0 entregado al cliente.', 8),
      makeLog('log-5-04', 50, 'Carlos Mendoza (Director)', 'Director', 'field_payment_registered', 'Paso 6 Completado: Cobro 7:00 PM S/. 2,200', 'Cancelación de saldo en Casona de las Brujas.', 6),
      makeLog('log-5-05', 60, 'Ing. Roberto Acuña (Admin)', 'admin', 'project_created', 'Creación de Expediente TCT-2026-BODA-031', 'Apertura de proyecto y contrato formal.')
    ],
    createdAt: datePast50Str,
    updatedAt: datePast10Str,
    isArchived: true,
    isDeletedFromServers: true,
    purgedAt: datePast10Str
  }
];
