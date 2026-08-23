import { PhaseData } from '../types';

export const createDefaultPhases = (eventDate: string, includesPhotobook = true): PhaseData[] => {
  const eventDateObj = new Date(eventDate || new Date().toISOString().split('T')[0]);
  
  // Calculate default deadline dates based on workflow rules
  const flyerDate = new Date(eventDateObj);
  flyerDate.setDate(flyerDate.getDate() - 30);
  
  const usbDeliveryDate = new Date(eventDateObj);
  usbDeliveryDate.setDate(usbDeliveryDate.getDate() + 15);
  
  const photobookDeliveryDate = new Date(eventDateObj);
  photobookDeliveryDate.setDate(photobookDeliveryDate.getDate() + 30);
  
  const purgeDate = new Date(eventDateObj);
  purgeDate.setDate(purgeDate.getDate() + 45);

  return [
    {
      phaseNumber: 1,
      name: '1. Negociación y Contratación',
      description: 'Presupuesto oficial, anticipo de congelamiento de fecha y formalización contractual.',
      color: '#10B981', // Emerald green
      steps: [
        {
          stepNumber: 1,
          title: 'Cotización Oficial TCT',
          badgeText: 'CÓDIGO ÚNICO',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          status: 'completed',
          checklist: [
            { id: 'c1_1', text: 'Emisión de presupuesto formal membretado TCT', completed: true },
            { id: 'c1_2', text: 'Asignación de Código de Seguimiento exclusivo', completed: true },
            { id: 'c1_3', text: 'Aceptación de propuesta económica por el cliente', completed: true }
          ]
        },
        {
          stepNumber: 2,
          title: 'Adelanto en Efectivo',
          badgeText: 'OBLIGATORIO',
          badgeColor: 'bg-green-100 text-green-800 border-green-300',
          status: 'completed',
          checklist: [
            { id: 'c2_1', text: 'Recepción del pago inicial de adelanto', completed: true },
            { id: 'c2_2', text: 'Congelamiento oficial de la fecha en la agenda de filmación', completed: true },
            { id: 'c2_3', text: 'Emisión de recibo / comprobante de caja Corporación TCT', completed: true }
          ]
        },
        {
          stepNumber: 3,
          title: 'Firma de Contrato',
          badgeText: 'CONTRATO FORMAL',
          badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
          status: 'in_progress',
          checklist: [
            { id: 'c3_1', text: 'Firma formal del acuerdo legal especificando N° Cotización y Contrato', completed: true },
            { id: 'c3_2', text: 'Aprobación de cláusula de pago y tiempos de entrega', completed: true },
            { id: 'c3_3', text: 'Entrega de copia física o digital al cliente', completed: false }
          ]
        }
      ]
    },
    {
      phaseNumber: 2,
      name: '2. Planificación y Preparativos',
      description: 'Creación de arte promocional con 30 días de anticipación y logística de viaje y equipos.',
      color: '#3B82F6', // Blue
      steps: [
        {
          stepNumber: 4,
          title: 'Diseño del Flyer',
          badgeText: '1 MES ANTES',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
          deadline: flyerDate.toISOString().split('T')[0],
          status: 'pending',
          checklist: [
            { id: 'c4_1', text: 'Solicitud de fotos e información del evento al cliente', completed: false },
            { id: 'c4_2', text: 'Elaboración del arte gráfico con 30 días de anticipación', completed: false },
            { id: 'c4_3', text: 'Aprobación del flyer por el cliente y publicación promocional', completed: false }
          ],
          links: [
            { label: 'Flyer en Alta Resolución (Drive)', url: 'https://drive.google.com/drive/folders/sample-flyer-tct', platform: 'drive' }
          ]
        },
        {
          stepNumber: 5,
          title: 'Logística de Viaje',
          badgeText: 'COORDINADO',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          status: 'pending',
          checklist: [
            { id: 'c5_1', text: 'Coordinación de movilidad y transporte técnico', completed: false },
            { id: 'c5_2', text: 'Asignación y confirmación de personal técnico de TCT', completed: false },
            { id: 'c5_3', text: 'Revisión y checklist de cámaras, lentes, dron, baterías y audio', completed: false },
            { id: 'c5_4', text: 'Definición de itinerario y tiempos de viaje', completed: false }
          ]
        }
      ]
    },
    {
      phaseNumber: 3,
      name: '3. Día del Evento y Cláusula de Pago',
      description: 'Cobertura audiovisual, regla estricta de cobro antes de las 7:00 PM y respaldo inmediato.',
      color: '#F59E0B', // Amber
      steps: [
        {
          stepNumber: 6,
          title: 'Viaje y Filmación Técnica',
          badgeText: 'COBERTURA TCT',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
          status: 'pending',
          checklist: [
            { id: 'c6_1', text: 'Llegada puntual del equipo técnico a la locación', completed: false },
            { id: 'c6_2', text: 'Tomas previas / sesión de fotos y preparativos', completed: false },
            { id: 'c6_3', text: 'Cobertura de ceremonia y protocolo principal', completed: false },
            { id: 'c6_4', text: 'Tomas aéreas con Dron (si aplica)', completed: false }
          ]
        },
        {
          stepNumber: 7,
          title: 'Regla de Cobro en Campo (Límite: 7:00 PM)',
          badgeText: 'LÍMITE 7:00 PM',
          badgeColor: 'bg-red-100 text-red-800 border-red-300 font-bold',
          status: 'pending',
          checklist: [
            { id: 'c7_1', text: 'Solicitud formal de cancelación de saldo acordado al cliente en campo', completed: false },
            { id: 'c7_2', text: 'VERIFICACIÓN: Si cancela/acuerda -> Continuar filmación hasta culminar evento', completed: false },
            { id: 'c7_3', text: 'REGLA TCT: Si NO cancela sin acuerdo -> Retiro inmediato del personal técnico', completed: false }
          ],
          fieldPaymentData: {
            paymentStatus: 'pending',
            amountCollected: 0,
            paymentMethod: 'Efectivo',
            technicianInCharge: 'Director de Cámara TCT'
          }
        },
        {
          stepNumber: 8,
          title: 'Resguardo de Material (Ingest)',
          badgeText: 'SERVIDOR TCT',
          badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          status: 'pending',
          checklist: [
            { id: 'c8_1', text: 'Retorno seguro a oficinas centrales de Corporación TCT', completed: false },
            { id: 'c8_2', text: 'Descarga y respaldo inmediato de tarjetas de video y fotografía en Servidor RAID', completed: false },
            { id: 'c8_3', text: 'Verificación de integridad de archivos y conteo total de GB', completed: false }
          ],
          ingestData: {
            sdCardsCount: 6,
            totalGigabytes: 320,
            serverLocation: 'NAS-TCT-STORAGE-01 / Proyectos-2026',
            backupVerified: false,
            technicianName: 'Ingest Specialist TCT',
            backupDate: ''
          }
        }
      ]
    },
    {
      phaseNumber: 4,
      name: '4. Post-Producción y Montaje',
      description: 'Edición general en 15 días hábiles con saldo en S/. 0.00 y resguardo digital en redes.',
      color: '#8B5CF6', // Purple
      steps: [
        {
          stepNumber: 9,
          title: 'Edición y Entrega en USB',
          badgeText: '15 DÍAS HÁBILES',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
          deadline: usbDeliveryDate.toISOString().split('T')[0],
          status: 'pending',
          checklist: [
            { id: 'c9_1', text: 'Selección de tomas y montaje de video resumen (Reels / Tráiler)', completed: false },
            { id: 'c9_2', text: 'Edición de película completa con corrección de color y mezcla de audio', completed: false },
            { id: 'c9_3', text: 'Grabación en memoria USB Corporación TCT en estuche de lujo', completed: false },
            { id: 'c9_4', text: 'VERIFICACIÓN OBLIGATORIA: Saldo verificado en S/. 0.00 antes de entrega física', completed: false }
          ]
        },
        {
          stepNumber: 10,
          title: 'Publicación Garantizada',
          badgeText: 'RESGUARDO DIGITAL',
          badgeColor: 'bg-violet-100 text-violet-800 border-violet-300',
          status: 'pending',
          checklist: [
            { id: 'c10_1', text: 'Carga de video a canal oficial de YouTube (Privado/Público)', completed: false },
            { id: 'c10_2', text: 'Publicación de clips destacados en Facebook y TikTok Corporación TCT', completed: false },
            { id: 'c10_3', text: 'Envío de enlaces digitales directos al cliente', completed: false }
          ],
          links: [
            { label: 'Video YouTube TCT', url: 'https://youtube.com/@corporaciontct', platform: 'youtube' },
            { label: 'Clips TikTok TCT', url: 'https://tiktok.com/@corporaciontct', platform: 'tiktok' },
            { label: 'Álbum Facebook TCT', url: 'https://facebook.com/corporaciontct', platform: 'facebook' }
          ]
        }
      ]
    },
    {
      phaseNumber: 5,
      name: '5. Fotolibro Impreso',
      description: 'Diseño, aprobación e impresión premium entregada exactamente a los 30 días posteriores.',
      color: '#EC4899', // Pink
      steps: [
        {
          stepNumber: 11,
          title: 'Entrega de Fotolibro',
          badgeText: includesPhotobook ? '30 DÍAS CALENDARIZADOS' : 'NO INCLUIDO EN PAQUETE',
          badgeColor: includesPhotobook ? 'bg-pink-100 text-pink-800 border-pink-300' : 'bg-gray-100 text-gray-600 border-gray-300',
          deadline: photobookDeliveryDate.toISOString().split('T')[0],
          status: includesPhotobook ? 'pending' : 'completed',
          checklist: [
            { id: 'c11_1', text: 'Recepción y filtrado de mejores fotografías para el álbum', completed: !includesPhotobook },
            { id: 'c11_2', text: 'Diagramación de páginas y maquetación de portada de lujo', completed: !includesPhotobook },
            { id: 'c11_3', text: 'Aprobación final de diseño por el cliente', completed: !includesPhotobook },
            { id: 'c11_4', text: 'Impresión en papel fotográfico de alta gama y empastado', completed: !includesPhotobook },
            { id: 'c11_5', text: 'Entrega física a los 30 días del evento con acta firmada', completed: !includesPhotobook }
          ]
        }
      ]
    },
    {
      phaseNumber: 6,
      name: '6. Depuración y Cierre',
      description: 'Liberación definitiva de almacenamiento en servidor tras conformidad total.',
      color: '#475569', // Slate
      steps: [
        {
          stepNumber: 12,
          title: 'Borrado de Archivos',
          badgeText: 'LIBERACIÓN',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          deadline: purgeDate.toISOString().split('T')[0],
          status: 'pending',
          checklist: [
            { id: 'c12_1', text: 'Verificación de entrega completa de USB, videos y Fotolibro', completed: false },
            { id: 'c12_2', text: 'Constancia de conformidad y satisfacción del cliente firmada', completed: false },
            { id: 'c12_3', text: 'Depuración y borrado definitivo de archivos RAW en servidor TCT', completed: false },
            { id: 'c12_4', text: 'Cierre formal de expediente de producción en sistema TCT', completed: false }
          ]
        }
      ]
    }
  ];
};
