import { TCTMasterRules, TCTMasterPackage, EquipmentItem, MasterStepChecklistRule, TemplateDocumentFormat, TCTCompanyInfo, TCTContractDesign } from '../types';
import { getIdbItem, setIdbItem, STORES } from './indexedDb';

const RULES_STORAGE_KEY = 'tct_master_rules_v1';

export const INITIAL_CONTRACT_DESIGN: TCTContractDesign = {
  headerTitle: 'CORPORACIÓN TCT',
  headerSubtitle: 'Servicios Audiovisuales, Producción Cinematográfica & Fotografía Profesional',
  headerLegalInfo: 'RUC: 20608941253 • Jr. Las Camelias 450, San Isidro, Lima • Tel: (01) 748-9200',
  logoType: 'official',
  fontFamily: 'sans',
  primaryColor: '#0f172a',
  accentColor: '#b45309',
  contractTitle: 'CONTRATO PRIVADO DE PRESTACIÓN DE SERVICIOS AUDIOVISUALES',
  contractIntroText: 'Conste por el presente documento el contrato de servicios celebrado entre CORPORACIÓN TCT y EL CLIENTE.',
  clause4PreservationText: '* CORPORACIÓN TCT conservará los archivos MASTER y brutos, hasta un plazo de 03 días posteriores a la fecha programada de entrega del material. De no recoger en la fecha de entrega sólo se conservará el archivo MASTER.',
  internetPublishingAgreementText: 'EL CLIENTE declara que de forma libre, voluntaria y expresa la publicación, exhibición y difusión de extractos de los videos y fotografías del evento en las plataformas de internet, redes sociales y portafolio profesional de CORPORACIÓN TCT.',
  footerText: 'Documento emitido formalmente por el Sistema Integrado de Gestión Audiovisual de Corporación TCT: SIGAT • Perú',
  signerAdvisorRole: 'Director de Producción / Asesor Comercial'
};

export const INITIAL_COMPANY_INFO: TCTCompanyInfo = {
  legalName: 'CORPORACIÓN TCT S.A.C.',
  commercialName: 'CORPORACIÓN TCT',
  slogan: 'Marcando Historia',
  ruc: '20608941253',
  legalRepresentative: 'Ing. Michael RomeroReyes',
  productionDirector: 'Director de Producción / Asesor Comercial',
  address: 'Av. Las Palmeras 451, Of. 302, Los Olivos, Lima - Perú',
  fiscalAddress: 'Av. Las Palmeras 451, Of. 302, Los Olivos, Lima - Perú',
  phoneMain: '+51 912 345 678',
  phoneSecondary: '+51 987 654 321',
  email: 'contacto@corporaciontct.com',
  website: 'https://corporaciontct.com',
  contractMasterStorageDays: 5,
  bankAccounts: [
    {
      id: 'bank-bcp-soles',
      bankName: 'BCP (Banco de Crédito del Perú)',
      accountType: 'Corriente',
      accountNumber: '193-98217361-0-45',
      cci: '002-193-0098217361045-12',
      holderName: 'CORPORACION TCT S.A.C.',
      currency: 'PEN'
    },
    {
      id: 'bank-bbva-soles',
      bankName: 'BBVA Continental',
      accountType: 'Ahorros',
      accountNumber: '0011-0482-0200847291',
      cci: '011-482-000200847291-55',
      holderName: 'CORPORACION TCT S.A.C.',
      currency: 'PEN'
    },
    {
      id: 'bank-interbank-soles',
      bankName: 'Interbank',
      accountType: 'Corriente',
      accountNumber: '200-3001892841',
      cci: '003-200-003001892841-89',
      holderName: 'CORPORACION TCT S.A.C.',
      currency: 'PEN'
    }
  ]
};

export const INITIAL_PACKAGES: TCTMasterPackage[] = [
  {
    id: 'pack-boda-oro',
    name: 'Paquete Boda de Oro (Cine 4K + Dron + Fotolibro)',
    eventType: 'Boda',
    basePrice: 4200,
    standardHours: 10,
    includesDrone: true,
    includesPhotobook: true,
    description: 'Cobertura cinematográfica completa desde preparativos hasta fiesta con 2 cámaras 4K, piloto dron profesional y fotolibro premium.',
    includedServices: [
      'Cobertura continua de 10 horas de servicio',
      '2 Operadores de Cámara Cinema 4K (Sony FX3 / A7S III)',
      '1 Piloto Certificado de Dron 4K (DJI Mavic 3 Pro)',
      '1 Fotógrafo Profesional con iluminación de estudio portátil',
      'Video Trailer Highlight de 3 a 5 minutos (Musicalizado y etalonado)',
      'Video Crónica Documental Completa de 60 a 90 minutos en 4K',
      'Fotolibro de Lujo 30x30 cm con 50 páginas en papel fotográfico seda',
      'Estuche de madera grabado con 2 Memorias USB 3.0 de alta velocidad',
      'Entrega digital privada en alta resolución vía Google Drive'
    ],
    recommendedEquipment: [
      'Sony FX3 Cinema Line 4K',
      'Sony A7S III 4K 120fps',
      'Dron DJI Mavic 3 Pro 4K',
      'Gimbal DJI Ronin RS3 Pro',
      'Set Micrófonos Inalámbricos DJI Mic 2'
    ],
    slaDaysVideo: 15,
    slaDaysPhotobook: 30
  },
  {
    id: 'pack-xv-deluxe',
    name: 'Paquete XV Años Deluxe (Cinema + Sesión Previa)',
    eventType: 'XV Años',
    basePrice: 3200,
    standardHours: 8,
    includesDrone: true,
    includesPhotobook: true,
    description: 'Pack juvenil con sesión pre-evento, videoclip de entrada cinematográfico y cobertura completa de la recepción.',
    includedServices: [
      'Sesión Pre-XV en locación exterior con videoclip de estreno',
      'Cobertura de 8 horas en salón de recepciones y misa',
      '2 Cámaras Full HD / 4K + 1 Estabilizador Electrónico',
      '1 Piloto Dron para tomas aéreas de exteriores',
      'Video Reel vertical optimizado para TikTok e Instagram',
      'Video Película de 45 a 60 minutos con edición rítmica',
      'Fotolibro 25x25 cm con portada acrílica personalizada',
      'Caja de presentación con memoria USB 3.0'
    ],
    recommendedEquipment: [
      'Sony A7 IV 4K',
      'Sony A7 III Full Frame',
      'Dron DJI Mini 4 Pro',
      'Lente Sony G Master 24-70mm f/2.8',
      'Kit Luces LED Amaran 100d'
    ],
    slaDaysVideo: 15,
    slaDaysPhotobook: 30
  },
  {
    id: 'pack-corporativo-spot',
    name: 'Paquete Corporativo Spot Publicitario & Evento Institucional',
    eventType: 'Evento Corporativo',
    basePrice: 2800,
    standardHours: 6,
    includesDrone: true,
    includesPhotobook: false,
    description: 'Producción de alta gama para marcas, lanzamientos, conferencias y spots comerciales.',
    includedServices: [
      'Cobertura de evento institucional / congreso de 6 horas',
      'Captura de audio directo desde consola matriz en alta fidelidad',
      'Entrevistas testimoniales a ponentes y directivos con microfónico corbatero',
      'Video Resumen Institucional de 2 a 3 minutos para redes corporativas',
      'Video Registro Íntegro de Ponencias y Ceremonia Protocolar',
      'Fotografía ejecutiva de prensa y galería online inmediata',
      'Entrega de archivos máster en ProRes y MP4 optimizado para Web'
    ],
    recommendedEquipment: [
      'Sony FX3 Cinema Line',
      'Grabador Tascam DR-40X 4 Canales',
      'Set Microfonía Sennheiser G4',
      'Kit Iluminación Softbox 200W'
    ],
    slaDaysVideo: 7,
    slaDaysPhotobook: 0
  },
  {
    id: 'pack-graduacion-promo',
    name: 'Paquete Graduación / Promoción Integral',
    eventType: 'Graduación',
    basePrice: 3500,
    standardHours: 8,
    includesDrone: true,
    includesPhotobook: true,
    description: 'Cobertura protocolar y fiesta de promoción escolar o universitaria con cuadro de firmas y photobook.',
    includedServices: [
      'Cobertura protocolar de entrega de diplomas y fiesta de graduación',
      'Tomas aéreas con Dron del lanzamiento de birretes y grupo',
      'Fotografía individual de cada graduado y foto de promoción panorámica',
      'Video resumen emotivo con música orquestada y discursos',
      'Álbum digital conmemorativo y enlace de descarga individual para cada alumno'
    ],
    recommendedEquipment: [
      'Sony A7 IV 4K',
      'Dron DJI Mavic 3 Pro',
      'Lente Sony 70-200mm f/2.8 GM',
      'Flash Godox AD200 Pro'
    ],
    slaDaysVideo: 15,
    slaDaysPhotobook: 30
  }
];

export const INITIAL_EQUIPMENT_CATALOG: EquipmentItem[] = [
  { id: 'eq-1', code: 'CAM-001', name: 'Cámara Sony FX3 Cinema Line 4K (Cuerpo Principal)', category: 'Cámara', serialNumber: 'SN-FX3-88219', features: 'Sensor Full-Frame 12.1 MP, 4K 120p, S-Cinetone, 10-bit 4:2:2, Dual Base ISO', registrationDate: '2025-01-15', condition: 'Operativo', checkedOut: false },
  { id: 'eq-2', code: 'CAM-002', name: 'Cámara Sony A7S III 4K 120fps (Cuerpo Secundario)', category: 'Cámara', serialNumber: 'SN-A7S3-44102', features: 'Sensor Full-Frame 12.1 MP, 4K 120p All-Intra, S-Log3, Enfoque al Ojo en Tiempo Real', registrationDate: '2025-02-10', condition: 'Operativo', checkedOut: false },
  { id: 'eq-3', code: 'CAM-003', name: 'Cámara Sony A7 IV Full Frame 33MP (Foto / Video)', category: 'Cámara', serialNumber: 'SN-A74-10928', features: 'Sensor 33 MP Exmor R CMOS, BIONZ XR, 4K 60p, 10 fps continuo, S-Cinetone', registrationDate: '2025-03-01', condition: 'Operativo', checkedOut: false },
  { id: 'eq-4', code: 'LEN-001', name: 'Lente Sony FE 24-70mm f/2.8 GM II', category: 'Lente', serialNumber: 'SN-GM-2470-91', features: 'Apertura constante f/2.8, 4 motores lineales XD, Nano AR II, Peso ultraligero', registrationDate: '2025-01-20', condition: 'Operativo', checkedOut: false },
  { id: 'eq-5', code: 'LEN-002', name: 'Lente Sony FE 70-200mm f/2.8 GM OSS II', category: 'Lente', serialNumber: 'SN-GM-70200-33', features: 'Teleobjetivo profesional f/2.8, Estabilización óptica OSS, 43% más liviano', registrationDate: '2025-02-14', condition: 'Operativo', checkedOut: false },
  { id: 'eq-6', code: 'LEN-003', name: 'Lente Sony FE 16-35mm f/2.8 GM Gran Angular', category: 'Lente', serialNumber: 'SN-GM-1635-12', features: 'Gran angular f/2.8 serie G Master, 2 elementos XA, Recubrimiento flúor', registrationDate: '2025-03-10', condition: 'Operativo', checkedOut: false },
  { id: 'eq-7', code: 'DRN-001', name: 'Dron DJI Mavic 3 Pro (Tri-Cámara Hasselblad 4K/5.1K)', category: 'Dron', serialNumber: 'SN-DJI-M3P-77', features: 'Tri-cámara Hasselblad 4/3 CMOS + 70mm + 166mm, Transmisión O3+ 15km, 43 min de vuelo', registrationDate: '2025-01-18', condition: 'Operativo', checkedOut: false },
  { id: 'eq-8', code: 'DRN-002', name: 'Dron DJI Mini 4 Pro (Respaldo / Interiores)', category: 'Dron', serialNumber: 'SN-DJI-M4P-05', features: 'Peso <249g, Sensor 1/1.3 pulgadas CMOS, Grabación vertical nativa 4K/60fps HDR', registrationDate: '2025-04-05', condition: 'Operativo', checkedOut: false },
  { id: 'eq-9', code: 'EST-001', name: 'Estabilizador Gimbal DJI Ronin RS3 Pro + Focus Motor', category: 'Estabilizadores / Soportes', serialNumber: 'SN-RS3P-9981', features: 'Brazos de fibra de carbono, Carga máx 4.5kg, Pantalla OLED táctil 1.8 pulgadas', registrationDate: '2025-01-22', condition: 'Operativo', checkedOut: false },
  { id: 'eq-10', code: 'AUD-001', name: 'Set Micrófonos Inalámbricos DJI Mic 2 (2 Tx + 1 Rx 32-bit Float)', category: 'Audio', serialNumber: 'SN-DJIMIC2-40', features: 'Grabación interna flotante de 32 bits, Cancelación de ruido inteligente, Alcance 250m', registrationDate: '2025-02-18', condition: 'Operativo', checkedOut: false },
  { id: 'eq-11', code: 'AUD-002', name: 'Grabadora Profesional Tascam DR-40X 4 Canales XLR', category: 'Audio', serialNumber: 'SN-TASC-8812', features: 'Micrófonos estéreo unidireccionales A/B o X/Y, Entradas duales Neutrik XLR/TRS', registrationDate: '2025-03-12', condition: 'Operativo', checkedOut: false },
  { id: 'eq-12', code: 'ILU-001', name: 'Kit Iluminación LED Amaran 200x Bi-Color + Octabox 90cm', category: 'Iluminación', serialNumber: 'SN-AMARAN-200', features: '200W Potencia puntual, 2700K-6500K CCT, Control inalámbrico Sidus Link, CRI 95+', registrationDate: '2025-02-25', condition: 'Operativo', checkedOut: false },
  { id: 'eq-13', code: 'ILU-002', name: 'Flash de Estudio Portátil Godox AD200 Pro + Transmisor XPro', category: 'Iluminación', serialNumber: 'SN-GDX-AD200', features: '200Ws Potencia, Batería Litio 2900mAh (500 disparos full), TTL HSS 1/8000s', registrationDate: '2025-03-15', condition: 'Operativo', checkedOut: false },
  { id: 'eq-14', code: 'ACC-001', name: 'Pack 6x Memorias SD Sandisk Extreme Pro V90 128GB UHS-II', category: 'Accesorios / Memorias', serialNumber: 'SN-SD-V90-SET', features: 'Lectura hasta 300 MB/s, Escritura 260 MB/s, Video Speed Class V90 para 4K/8K', registrationDate: '2025-01-10', condition: 'Operativo', checkedOut: false },
  { id: 'eq-15', code: 'ACC-002', name: 'Baterías Sony NP-FZ100 Originales (Pack x8) + Cargadores Dual', category: 'Accesorios / Memorias', serialNumber: 'SN-BAT-FZ100-8', features: '2280mAh 7.2V por batería, InfoLITHIUM de Sony, Cargadores rápidos simultáneos', registrationDate: '2025-01-12', condition: 'Operativo', checkedOut: false }
];

export const INITIAL_STEP_CHECKLISTS: MasterStepChecklistRule[] = [
  {
    stepNumber: 1,
    title: 'Paso 1: Solicitud de Información y Ficha de Pre-Producción',
    requiredDocName: 'Proforma Oficial TCT (PDF/Imagen) con Código COT-TCT y Ficha de Datos del Cliente',
    guideNotes: 'Registrar datos completos de contacto, locación exacta, horario pactado y adjuntar la proforma o cotización enviada al cliente.',
    defaultChecklist: [
      'Recepción de solicitud y registro de datos completos del cliente (Nombre, DNI/RUC, Celular, Correo)',
      'Envío de proforma detallada con código de cotización TCT y paquete seleccionado',
      'Definición de locaciones, horarios clave y tipo de ceremonia',
      'Confirmación de requerimientos especiales (Dron, Fotolibro, Pantallas LED)',
      'Registro del Asesor Comercial / Responsable del contrato'
    ]
  },
  {
    stepNumber: 2,
    title: 'Paso 2: Firma de Contrato y Recepción de Adelanto Inicial',
    requiredDocName: 'Contrato Firmado (PDF/Foto) y Comprobante de Adelanto Inicial (S/.)',
    guideNotes: 'Verificar número de contrato CONT-TCT, aplicar descuentos aprobados, registrar horas extra y confirmar depósito de reserva.',
    defaultChecklist: [
      'Redacción y emisión del contrato con número oficial CONT-TCT',
      'Registro de descuentos pactados, horas contratadas y horas extra',
      'Firma física o digital del contrato por ambas partes',
      'Cobro y emisión de recibo del adelanto inicial pactado (S/.)',
      'Bloqueo oficial de fecha en el calendario corporativo TCT'
    ]
  },
  {
    stepNumber: 3,
    title: 'Paso 3: Planificación de Recursos Técnicos y Equipos',
    requiredDocName: 'Hoja de Asignación de Personal Técnico y Reserva de Equipamiento',
    guideNotes: 'Designar directores de cámara, fotógrafos, piloto dron y verificar disponibilidad de cuerpos Sony FX3/A7 y kits de lentes.',
    defaultChecklist: [
      'Asignación formal de técnicos (Cámara, Foto, Dron, Audio)',
      'Verificación y checkout de inventario de equipos (Baterías, Lentes, SDs)',
      'Permisos de vuelo de dron y coordinación con la administración del local',
      'Confirmación de cronograma de trabajo con el cliente o wedding planner'
    ]
  },
  {
    stepNumber: 4,
    title: 'Paso 4: Verificación Previa y Despacho de Equipamiento',
    requiredDocName: 'Hoja de Salida de Almacén y Checklist de Baterías / Memorias SD V90',
    guideNotes: 'Realizar prueba de encendido, formateo de memorias en cámara y verificación de carga de baterías al 100%.',
    defaultChecklist: [
      'Formateo en cámara de memorias SD Sandisk V90',
      'Chequeo de carga 100% en todas las baterías Sony y Dron',
      'Limpieza óptica de sensores y lentes con kit profesional',
      'Salida puntual del equipo técnico hacia la locación del evento'
    ]
  },
  {
    stepNumber: 5,
    title: 'Paso 5: Cobertura en Terreno y Rodaje en Locación',
    requiredDocName: 'Bitácora de Rodaje en Locación y Registro de Asistencia Técnica',
    guideNotes: 'Llegada 45 min antes, captura de audio de consola y cobertura cinematográfica continua.',
    defaultChecklist: [
      'Llegada a locación 45 minutos antes de la hora fijada',
      'Tomas de preparativos, decoración y ambientación',
      'Grabación de audio directo de consola en ceremonia protocolar',
      'Cobertura protocolar y tomas aéreas con Dron',
      'Tomas de fiesta, cotillón y actividades de cierre'
    ]
  },
  {
    stepNumber: 6,
    title: 'Paso 6: Cobro Obligatorio en Terreno 7:00 PM (Límite Contractual)',
    requiredDocName: 'Recibo / Voucher de Cobro en Campo 7:00 PM (S/.)',
    guideNotes: '🚨 REGLA ESTRICTA 7:00 PM: Efectuar el cobro pactado en terreno antes de la hora límite y emitir constancia inmediata.',
    defaultChecklist: [
      'Notificación cortés al cliente o encargado a las 6:30 PM',
      '🚨 REGLA ESTRICTA 7:00 PM: Cobro de saldo pactado en terreno',
      'Emisión y entrega de comprobante de pago de campo al cliente',
      'Registro del método de pago (Efectivo / Transferencia / Yape)'
    ]
  },
  {
    stepNumber: 7,
    title: 'Paso 7: Ingest de Archivos RAW y Respaldo Dual en Servidores',
    requiredDocName: 'Acta de Ingest y Checksum MD5 en Servidor NAS RAID',
    guideNotes: 'Conteo de tarjetas SD, copia bit a bit en NAS y SSD de trabajo, verificación de integridad de video y audio.',
    defaultChecklist: [
      'Recepción y conteo físico de tarjetas SD y memorias de dron',
      'Copia bit a bit mediante software verificado con checksum MD5',
      'Estructura de carpetas TCT: /AÑO/MES/CODIGO_PROYECTO/RAW_CAM_A, B, DRON, AUDIO/',
      'Respaldo dual en Servidor RAID 1 y disco de trabajo SSD NVMe',
      'Firma de acta técnica de entrega de material por el camarógrafo'
    ]
  },
  {
    stepNumber: 8,
    title: 'Paso 8: Selección y Edición de Video (SLA 15 Días)',
    requiredDocName: 'Master de Video Trailer 4K y Crónica Completa Exportada',
    guideNotes: 'Sincronización multicámara, etalonaje cinematográfico, mezcla de audio a -14 LUFS y exportación ProRes/H.264.',
    defaultChecklist: [
      'Sincronización multicámara y alineación de pistas de audio maestro',
      'Corte inicial y selección de las mejores tomas de la jornada',
      'Edición del Video Highlight (3-5 min) y Video Crónica (60 min)',
      'Etalonaje y corrección de color profesional (Color Grading)',
      'Diseño sonoro, mezcla y masterización a -14 LUFS',
      'Exportación del Master en 4K ProRes y H.264 para entrega'
    ]
  },
  {
    stepNumber: 9,
    title: 'Paso 9: Retoque Fotográfico y Diseño de Fotolibro (SLA 30 Días)',
    requiredDocName: 'Maqueta PDF de Fotolibro Aprobada y Archivos de Imprenta',
    guideNotes: 'Revelado RAW en Lightroom, retoque digital en Photoshop y maquetación de pliegos con visto bueno del cliente.',
    defaultChecklist: [
      'Curaduría y revelado digital RAW en Adobe Lightroom',
      'Retoque de pieles y corrección de iluminación en Adobe Photoshop',
      'Maquetación del Fotolibro con el número acordado de pliegos y páginas',
      'Envío de maqueta digital PDF al cliente para visto bueno de diseño',
      'Aprobación final del cliente y envío a imprenta fotográfica especializada'
    ]
  },
  {
    stepNumber: 10,
    title: 'Paso 10: Publicación en Redes Sociales y Plataformas Digitales',
    requiredDocName: 'Enlaces Verificados de Redes (TikTok, YouTube, Facebook, Drive)',
    guideNotes: 'Corte 9:16 vertical para TikTok/Reels, subida 4K en YouTube, publicación de fotos en Facebook y carpeta Google Drive.',
    defaultChecklist: [
      'Exportación de corte vertical 9:16 para TikTok y Reels',
      'Subida y publicación de trailer oficial en YouTube 4K',
      'Publicación de galería destacada en Facebook Oficial TCT',
      'Publicación o respaldo en Dailymotion / Vimeo',
      'Generación de enlace privado de descarga en Google Drive para el cliente',
      'Verificación de funcionamiento de todos los enlaces compartidos'
    ]
  },
  {
    stepNumber: 11,
    title: 'Paso 11: Entrega Física Final al Cliente y Saldo S/. 0.00',
    requiredDocName: 'Acta de Entrega de Estuche de Madera con USB 3.0 y Fotolibro',
    guideNotes: '🚨 REGLA FINANCIERA: Verificar que el saldo del cliente esté en S/. 0.00 antes de la entrega física del estuche grabado.',
    defaultChecklist: [
      'Coordinación de cita de entrega en oficina o domicilio del cliente',
      '🚨 REGLA FINANCIERA: Verificación ineludible de SALDO S/. 0.00',
      'Entrega física del estuche de madera con USB 3.0 y Fotolibro',
      'Demostración y revisión conjunta con el cliente',
      'Firma de conformidad de recepción de materiales físicos'
    ]
  },
  {
    stepNumber: 12,
    title: 'Paso 12: Acta de Conformidad Final, Consentimiento y Purga de Servidores',
    requiredDocName: 'Acta Oficial de Conformidad Firmada por Cliente y Código de Auditoría',
    guideNotes: 'Firma de satisfacción total, consentimiento explícito para purgar archivos RAW del NAS y archivado final de auditoría.',
    defaultChecklist: [
      'Emisión formal del Formato de Conformidad de Entrega de Trabajos Finales',
      'Firma del cliente autorizando la eliminación definitiva de archivos RAW',
      'Registro de DNI, teléfono y fecha formal de consentimiento',
      'Adjuntar acta firmada / documento escaneado al expediente digital',
      'Ejecución del comando de purga y liberación de espacio en Servidores RAID',
      'Archivado definitivo y cierre exitoso del expediente en Corporación TCT'
    ]
  }
];

export const INITIAL_TEMPLATE_FORMATS: TemplateDocumentFormat[] = [
  {
    id: 'fmt-conformidad-paso12',
    title: 'Acta de Conformidad de Entrega y Consentimiento de Purga de Servidores (Paso 12)',
    description: 'Documento legal donde el cliente declara su total satisfacción con los entregables (USB, Fotolibro, Videos) y autoriza la eliminación de los archivos RAW de los servidores.',
    category: 'Actas y Conformidades',
    version: '2026.2',
    downloadFilename: 'TCT-ACTA-CONFORMIDAD-Y-PURGA-PASO12.txt',
    updatedAt: '2026-08-15',
    contentTemplate: `================================================================================
CORPORACIÓN TCT - PRODUCCIÓN AUDIOVISUAL PROFESIONAL
ACTA OFICIAL DE CONFORMIDAD DE ENTREGA Y AUTORIZACIÓN DE PURGA DE ARCHIVOS
================================================================================

Por medio del presente documento, yo, el(la) suscrito(a):
Nombre Completo del Cliente: __________________________________________________
Documento de Identidad (DNI / CE / RUC): ______________________________________
Teléfono de Contacto: ________________________________________________________
Dirección / Ciudad: __________________________________________________________

En calidad de cliente del servicio contratado bajo:
- Código Único de Proyecto TCT: {{CODIGO_PROYECTO}}
- Código de Cotización: {{CODIGO_COTIZACION}}
- Número de Contrato: {{NUMERO_CONTRATO}}
- Tipo de Evento Realizado: {{TIPO_EVENTO}}
- Fecha del Evento: {{FECHA_EVENTO}}

DECLARO EXPRESAMENTE:

1. CONFORMIDAD DE ENTREGA:
Haber recibido a entera y total satisfacción la totalidad de los productos y servicios
audiovisuales estipulados en el contrato, incluyendo:
- Video Highlight / Trailer en resolución 4K.
- Video Documental Completo / Crónica Master.
- Álbum Fotolibro Impreso de Alta Calidad (si aplica).
- Estuche y Memoria(s) USB 3.0 con archivos originales digitales.
- Enlaces de descarga digital verificados.

2. FINIQUITO ECONÓMICO:
Declaro no mantener deuda alguna pendiente, habiéndose liquidado el 100% del presupuesto
pactado (Saldo actual: S/. 0.00).

3. AUTORIZACIÓN DE ELIMINACIÓN DE SERVIDORES (PASO 12):
De conformidad con las políticas de almacenamiento y el periodo de resguardo temporal de
Corporación TCT, AUTORIZO de forma irrevocable a la empresa a proceder con la liberación
de espacio y ELIMINACIÓN DEFINITIVA de todos los archivos RAW, grabaciones en bruto y
proyectos de edición alojados en sus servidores locales y sistemas RAID, declarando
haber respaldado personalmente mis archivos entregados.

En señal de plena conformidad y aceptación, se suscribe la presente acta:


________________________________________          ________________________________________
        FIRMA DEL CLIENTE                                 REPRESENTANTE TCT
DNI:                                              Ing. Roberto Acuña
Fecha: ____ / ____ / 2026                         Asesor Comercial & Operaciones TCT
Hora: _________________
================================================================================`
  },
  {
    id: 'fmt-contrato-oficial',
    title: 'Contrato Marco de Servicios Audiovisuales y Cobertura de Eventos',
    description: 'Contrato estándar con cláusulas de horarios, horas extra, regla de cobro 7:00 PM, tiempos de entrega y derechos de autor.',
    category: 'Contratos',
    version: '2026.1',
    downloadFilename: 'TCT-CONTRATO-AUDIOVISUAL-MODELO-2026.txt',
    updatedAt: '2026-08-15',
    contentTemplate: `================================================================================
CORPORACIÓN TCT - CONTRATO DE LOCACIÓN DE SERVICIOS AUDIOVISUALES
================================================================================
CONTRATO N°: {{NUMERO_CONTRATO}} | COTIZACIÓN ASOCIADA: {{CODIGO_COTIZACION}}

Conste por el presente documento el contrato de servicios que celebran de una parte
CORPORACIÓN TCT, con RUC N° 20608912345, debidamente representada por su Asesor
Comercial {{RESPONSABLE_CONTRATO}}, a quien en adelante se denominará EL PRESTADOR;
y de la otra parte {{NOMBRE_CLIENTE}}, con DNI N° {{DNI_CLIENTE}}, a quien se denominará EL CLIENTE.

CLÁUSULAS PRINCIPALES:
PRIMERA - OBJETO: Cobertura audiovisual profesional para el evento: {{TIPO_EVENTO}}
a realizarse en fecha {{FECHA_EVENTO}}, en la locación: {{LOCACION_EVENTO}}.

SEGUNDA - CONDICIONES ECONÓMICAS:
- Precio de Lista: S/. {{PRECIO_LISTA}}
- Descuento Pactado: S/. {{DESCUENTO}} (Motivo: {{MOTIVO_DESCUENTO}})
- Monto Total Neto Acordado: S/. {{TOTAL_PRESUPUESTO}} Soles Peruanos.
- Adelanto Inicial al firmar: S/. {{ADELANTO_INICIAL}}
- Pago en Terreno (Regla 7:00 PM): S/. {{PAGO_CAMPO}}
- Saldo contra entrega física: S/. {{SALDO_FINAL}} (Debe cancelarse a S/. 0.00).

TERCERA - HORARIOS Y HORAS EXTRA:
- Horas Base de Servicio: {{HORAS_BASE}} horas continúas.
- Horas Adicionales Pactadas: {{HORAS_EXTRA}} horas, a razón de S/. {{TARIFA_HORA_EXTRA}} c/u.

CUARTA - ENTREGABLES Y PLAZOS:
- Video editado en USB 3.0: 15 días hábiles.
- Fotolibro maquetado e impreso: 30 días calendario.
- Publicación en redes sociales autorizadas.

QUINTA - RESGUARDO Y ELIMINACIÓN:
El material RAW permanecerá en los servidores por un máximo de 30 días tras la entrega,
procediéndose a su eliminación definitiva mediante el Acta de Conformidad del Paso 12.

Firmado en dos ejemplares de igual valor legal.
================================================================================`
  },
  {
    id: 'fmt-formulario-datos-contrato',
    title: 'Ficha / Formulario de Datos Requeridos para Contrato & Proforma',
    description: 'Ficha oficial para recolectar datos del cliente, locación, horarios, servicios solicitados, descuentos y firmas antes de emitir el contrato.',
    category: 'Contratos',
    version: '2026.1',
    downloadFilename: 'TCT-FICHA-DATOS-REQUERIDOS-CONTRATO.txt',
    updatedAt: '2026-08-15',
    contentTemplate: `================================================================================
CORPORACIÓN TCT - FICHA DE RECOLECCIÓN DE DATOS PARA CONTRATO Y PROFORMA
================================================================================
CÓDIGO DE COTIZACIÓN: {{CODIGO_COTIZACION}}
NÚMERO DE CONTRATO ASIGNADO: {{NUMERO_CONTRATO}}
ASESOR COMERCIAL RESPONSABLE: {{RESPONSABLE_CONTRATO}}

I. DATOS DEL CLIENTE / CONTRATANTE:
- Nombres y Apellidos: {{NOMBRE_CLIENTE}}
- Documento de Identidad (DNI / RUC / Carnet Ext.): {{DNI_CLIENTE}}
- Teléfono Celular / WhatsApp: {{TELEFONO_CLIENTE}}
- Correo Electrónico: {{EMAIL_CLIENTE}}
- Dirección Domiciliaria: _____________________________________________________

II. DATOS DEL EVENTO Y LOCACIÓN:
- Tipo de Evento: {{TIPO_EVENTO}}
- Fecha del Evento: {{FECHA_EVENTO}}
- Horario Acordado: {{HORARIO_EVENTO}} (Horas base: {{HORAS_BASE}} hrs)
- Locación Principal (Salón / Iglesia / Finca): {{LOCACION_EVENTO}}
- Dirección Exacta de Locación: _______________________________________________

III. SERVICIOS Y EQUIPOS SELECCIONADOS:
- Paquete Base: {{NOMBRE_PAQUETE}}
- Incluye Cobertura Dron 4K: [ X ] SI   [   ] NO
- Incluye Fotolibro Impreso de Lujo: [ X ] SI   [   ] NO
- Horas Extras Pactadas: {{HORAS_EXTRA}} hrs (Tarifa: S/. {{TARIFA_HORA_EXTRA}} / hora)
- Equipos / Requerimientos Adicionales: _______________________________________

IV. CONDICIONES ECONÓMICAS Y FORMA DE PAGO:
- Precio de Lista: S/. {{PRECIO_LISTA}}
- Descuento Comercial Aprobado: - S/. {{DESCUENTO}}
- Motivo del Descuento: {{MOTIVO_DESCUENTO}}
- TOTAL PRESUPUESTO NETO: S/. {{TOTAL_PRESUPUESTO}}
- Adelanto Inicial al Firmar: S/. {{ADELANTO_INICIAL}} (Medio: Transferencia/Efectivo)
- Cobro en Terreno (Regla 7:00 PM): S/. {{PAGO_CAMPO}}
- Saldo Contra Entrega: S/. {{SALDO_FINAL}} (Debe liquidarse a S/. 0.00)

V. DOCUMENTACIÓN ADJUNTA:
[   ] Copia DNI / RUC del Cliente
[   ] Proforma Oficial enviada en PDF o Imagen
[   ] Voucher de Adelanto Inicial
[   ] Cronograma de Actividades del Evento

Firma de Recepción de Datos: _________________________ Fecha: ___/___/2026
================================================================================`
  },
  {
    id: 'fmt-proforma-cotizacion',
    title: 'Plantilla de Proforma / Cotización Oficial Corporativa TCT',
    description: 'Estructura de propuesta económica desglosada con código de cotización, desglose de equipos, servicios y opciones de paquetes.',
    category: 'Proformas',
    version: '2026.1',
    downloadFilename: 'TCT-PROFORMA-COTIZACION-MODELO.txt',
    updatedAt: '2026-08-15',
    contentTemplate: `================================================================================
CORPORACIÓN TCT - PROPUESTA TÉCNICA & COTIZACIÓN OFICIAL
================================================================================
CÓDIGO DE COTIZACIÓN: {{CODIGO_COTIZACION}}
FECHA DE EMISIÓN: {{FECHA_EMISION}} | VALIDEZ: 15 DÍAS CALENDARIO
ASESOR RESPONSABLE: {{RESPONSABLE_CONTRATO}}

ATENCIÓN: {{NOMBRE_CLIENTE}} (Teléfono: {{TELEFONO_CLIENTE}})
EVENTO: {{TIPO_EVENTO}} | FECHA ESTIMADA: {{FECHA_EVENTO}}

PAQUETE PROPUESTO: {{NOMBRE_PAQUETE}}
DESCRIPCIÓN: {{DESCRIPCION_PAQUETE}}

SERVICIOS INCLUIDOS:
{{LISTA_SERVICIOS}}

EQUIPAMIENTO CINEMATOGRÁFICO ASIGNADO:
{{LISTA_EQUIPOS}}

RESUMEN ECONÓMICO (EN SOLES PERUANOS - S/.):
- Inversión Regular: S/. {{PRECIO_LISTA}}
- Descuento Especial Promocional: - S/. {{DESCUENTO}}
--------------------------------------------------------------------------------
TOTAL INVERSIÓN FINAL PACTADA: S/. {{TOTAL_PRESUPUESTO}}
FORMA DE PAGO: 40% Reserva / 40% En evento (7:00 PM) / 20% Contra entrega física.
================================================================================`
  }
];

export const INITIAL_RULES: TCTMasterRules = {
  companyInfo: INITIAL_COMPANY_INFO,
  packages: INITIAL_PACKAGES,
  equipmentCatalog: INITIAL_EQUIPMENT_CATALOG,
  stepChecklists: INITIAL_STEP_CHECKLISTS,
  templateFormats: INITIAL_TEMPLATE_FORMATS,
  contractDesign: INITIAL_CONTRACT_DESIGN,
  standardExtraHourRate: 150,
  maxDiscountPercentageAllowed: 25,
  authorizedContractHolders: [
    'Ing. Roberto Acuña - Asesor Comercial Principal',
    'Valeria Castro - Gestora Senior de Cuentas',
    'Carlos Mendoza - Director de Operaciones',
    'Lic. Patricia Romero - Coordinadora de Ventas'
  ]
};

let memoryRulesCache: TCTMasterRules | null = null;
const IDB_RULES_KEY = 'master_rules';

export const getStoredRules = (): TCTMasterRules => {
  if (memoryRulesCache) return memoryRulesCache;
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const combined: TCTMasterRules = {
        ...INITIAL_RULES,
        ...parsed,
        companyInfo: parsed.companyInfo ? { ...INITIAL_COMPANY_INFO, ...parsed.companyInfo } : INITIAL_COMPANY_INFO,
        packages: parsed.packages || INITIAL_PACKAGES,
        equipmentCatalog: parsed.equipmentCatalog || INITIAL_EQUIPMENT_CATALOG,
        stepChecklists: parsed.stepChecklists || INITIAL_STEP_CHECKLISTS,
        templateFormats: parsed.templateFormats || INITIAL_TEMPLATE_FORMATS,
        contractDesign: parsed.contractDesign ? { ...INITIAL_CONTRACT_DESIGN, ...parsed.contractDesign } : INITIAL_CONTRACT_DESIGN
      };
      memoryRulesCache = combined;
      return combined;
    }
  } catch (err) {
    console.warn('Notice reading rules from storage:', err);
  }
  memoryRulesCache = INITIAL_RULES;
  return INITIAL_RULES;
};

export const initRulesStorage = async (): Promise<TCTMasterRules> => {
  try {
    const idbRules = await getIdbItem<TCTMasterRules>(STORES.RULES, IDB_RULES_KEY);
    if (idbRules) {
      memoryRulesCache = idbRules;
      return idbRules;
    }
  } catch (err) {
    console.warn('IndexedDB rules check:', err);
  }
  return getStoredRules();
};

export const saveMasterRules = (rules: TCTMasterRules): void => {
  memoryRulesCache = rules;
  setIdbItem(STORES.RULES, IDB_RULES_KEY, rules).catch((err) => {
    console.warn('Notice saving rules to IndexedDB:', err);
  });
  try {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch (err) {
    console.warn('Notice saving rules to localStorage (quota protected, stored in IDB):', err);
  }
  window.dispatchEvent(new CustomEvent('tct_rules_updated', { detail: rules }));
};

export const resetMasterRulesToDefault = (): TCTMasterRules => {
  memoryRulesCache = INITIAL_RULES;
  saveMasterRules(INITIAL_RULES);
  return INITIAL_RULES;
};
