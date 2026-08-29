import React, { useState, useMemo } from 'react';
import { ProductionProject, StepData, AssignedStaff } from '../types';
import { TCTLogo } from './TCTLogo';
import { exportElementToPdf, sendToWhatsAppPeru } from '../utils/printHelper';
import { getProjectProgressInfo } from '../utils/projectProgress';
import { getStoredRules } from '../utils/rulesStorage';
import { getStoredUsers } from '../utils/authStorage';
import { 
  Download, 
  X, 
  MessageCircle, 
  Loader2, 
  Users, 
  FileText,
  Camera,
  Video,
  Radio,
  Scissors,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface ProjectProgressReportModalProps {
  project: ProductionProject;
  onClose: () => void;
}

// 6 Official Phases with numbering and distinct colors
interface PhaseStyle {
  phaseNumber: number;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const PHASES_INFO: Record<number, PhaseStyle> = {
  1: {
    phaseNumber: 1,
    name: 'Negociación y Contratación',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200'
  },
  2: {
    phaseNumber: 2,
    name: 'Planificación y Preparativos',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200'
  },
  3: {
    phaseNumber: 3,
    name: 'Día del Evento y Cláusula de Pago',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200'
  },
  4: {
    phaseNumber: 4,
    name: 'Post-Producción y Montaje',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200'
  },
  5: {
    phaseNumber: 5,
    name: 'Fotolibro Impreso',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-200'
  },
  6: {
    phaseNumber: 6,
    name: 'Depuración y Cierre',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300'
  }
};

// 12 Sequential Official Steps mapped to their phase number
const OFFICIAL_STEPS_INFO = [
  { stepNumber: 1, phaseNumber: 1, title: 'Cotización Oficial TCT', defaultStaff: 'Michael Romero (Asesor Comercial)', defaultChecks: 3 },
  { stepNumber: 2, phaseNumber: 1, title: 'Adelanto en Efectivo', defaultStaff: 'Tesorería & Caja TCT', defaultChecks: 3 },
  { stepNumber: 3, phaseNumber: 1, title: 'Firma de Contrato', defaultStaff: 'Carlos Mendoza (Director General)', defaultChecks: 3 },
  { stepNumber: 4, phaseNumber: 2, title: 'Diseño del Flyer', defaultStaff: 'Álvaro Ruiz (Diseñador Gráfico)', defaultChecks: 3 },
  { stepNumber: 5, phaseNumber: 2, title: 'Logística de Viaje', defaultStaff: 'Diego Castro (Coordinador Logística)', defaultChecks: 4 },
  { stepNumber: 6, phaseNumber: 3, title: 'Viaje y Filmación Técnica', defaultStaff: 'Carlos Mendoza (Director de Cámara)', defaultChecks: 4 },
  { stepNumber: 7, phaseNumber: 3, title: 'Regla de Cobro en Campo (Límite: 7:00 PM)', defaultStaff: 'Carlos Mendoza (Cobro en Campo)', defaultChecks: 3 },
  { stepNumber: 8, phaseNumber: 3, title: 'Resguardo de Material (Ingest)', defaultStaff: 'Pedro Alva (Técnico Ingest TCT)', defaultChecks: 3 },
  { stepNumber: 9, phaseNumber: 4, title: 'Edición y Entrega en USB', defaultStaff: 'Editor Audiovisual Senior', defaultChecks: 4 },
  { stepNumber: 10, phaseNumber: 4, title: 'Publicación Garantizada', defaultStaff: 'Lucía Ramos (Community Manager)', defaultChecks: 3 },
  { stepNumber: 11, phaseNumber: 5, title: 'Entrega de Fotolibro', defaultStaff: 'Martín Vega (Especialista Fotolibro)', defaultChecks: 4 },
  { stepNumber: 12, phaseNumber: 6, title: 'Borrado de Archivos', defaultStaff: 'Michael Romero (Auditor TCT)', defaultChecks: 3 },
];

export const ProjectProgressReportModal: React.FC<ProjectProgressReportModalProps> = ({
  project,
  onClose
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Match system users and rules to get accurate advisor / company signature data
  const systemUsers = useMemo(() => getStoredUsers(), []);
  const masterRules = useMemo(() => getStoredRules(), []);
  const contractDesign = masterRules.contractDesign;

  const matchedUser = useMemo(() => {
    const createdLower = (project.createdByName || '').toLowerCase();
    const holderLower = (project.contractHolder || '').toLowerCase();
    return systemUsers.find(u => {
      const uFull = (u.fullName || '').toLowerCase();
      return (
        (createdLower && uFull && uFull.includes(createdLower)) ||
        (holderLower && uFull && uFull.includes(holderLower)) ||
        (project.createdByDni && u.dni === project.createdByDni) ||
        (project.contractHolderDni && u.dni === project.contractHolderDni)
      );
    });
  }, [systemUsers, project]);

  const advisorName = project.createdByName || matchedUser?.fullName || (project.contractHolder ? project.contractHolder.split(' - ')[0] : 'Michael Romero');
  const advisorDni = project.createdByDni || project.contractHolderDni || matchedUser?.dni || '45892314';
  const advisorRole = contractDesign?.signerAdvisorRole || 'Director de Producción / Asesor Comercial';

  // Progress metrics
  const progressInfo = useMemo(() => {
    return getProjectProgressInfo(project);
  }, [project]);

  // Extract all 12 steps from project
  const allProjectSteps = useMemo(() => {
    const map = new Map<number, StepData>();
    if (project.phases && Array.isArray(project.phases)) {
      project.phases.forEach(ph => {
        if (ph.steps && Array.isArray(ph.steps)) {
          ph.steps.forEach(st => {
            map.set(st.stepNumber, st);
          });
        }
      });
    }
    return map;
  }, [project]);

  // Financial calculations from New Project Form fields
  const totalBudget = Number(project.totalBudget ?? project.budget ?? 0);
  const depositPaid = Number(project.initialDeposit ?? project.depositPaid ?? 0);
  const fieldCollected = Number(project.fieldPayment ?? project.fieldAmountCollected ?? 0);
  const pendingBalance = Math.max(0, totalBudget - depositPaid - fieldCollected);

  // Format emission date in Spanish
  const emissionDateFormatted = useMemo(() => {
    const date = new Date();
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  }, []);

  // Format schedule
  const scheduleFormatted = useMemo(() => {
    if (project.eventSchedules && project.eventSchedules.length > 0) {
      return project.eventSchedules.map((d, i) => `Día ${i + 1} (${d.date}): ${d.startTime || '16:00'} - ${d.endTime || '02:00'}`).join(' | ');
    }
    if (project.multiDaySchedule && project.multiDaySchedule.length > 0) {
      return project.multiDaySchedule.map((d, i) => `Día ${i + 1} (${d.date}): ${d.startTime} - ${d.endTime}`).join(' | ');
    }
    const start = project.eventStartTime || '16:00';
    const end = project.eventEndTime || '02:00';
    return `Día 1 (${project.eventDate}): ${start} - ${end}`;
  }, [project]);

  // Technical Crew / Staff List (with distinct colors)
  const technicalCrewList = useMemo(() => {
    if (project.assignedStaff && project.assignedStaff.length > 0) {
      return project.assignedStaff;
    }
    
    // Default deployment if no staff array is explicitly populated
    const defaultStaff: AssignedStaff[] = [
      { id: 'st-1', name: 'Carlos Mendoza', role: 'Director de Cámara Cine 4K', phone: '+51 987 654 321', confirmed: true },
      { id: 'st-2', name: 'Alfonso Rivas', role: 'Fotógrafo Principal', phone: '+51 981 234 567', confirmed: true },
      { id: 'st-3', name: 'Diego Castro', role: project.includesDrone ? 'Piloto Operador de Dron' : 'Camarógrafo Asistente', phone: '+51 992 345 678', confirmed: true },
      { id: 'st-4', name: 'Pedro Alva', role: 'Técnico de Ingest & Audio', phone: '+51 993 456 789', confirmed: true },
      { id: 'st-5', name: 'Martín Vega', role: 'Editor Audiovisual Senior', phone: '+51 994 567 890', confirmed: true }
    ];
    return defaultStaff;
  }, [project]);

  // Role color assignment helper
  const getRoleBadgeStyle = (roleName: string, index: number) => {
    const roleLower = roleName.toLowerCase();
    if (roleLower.includes('director') || roleLower.includes('cámara')) {
      return {
        cardBg: 'bg-blue-50/90 border-blue-200 text-blue-900',
        badgeBg: 'bg-blue-600 text-white',
        icon: <Video className="w-3.5 h-3.5 text-blue-700" />
      };
    }
    if (roleLower.includes('foto')) {
      return {
        cardBg: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
        badgeBg: 'bg-emerald-600 text-white',
        icon: <Camera className="w-3.5 h-3.5 text-emerald-700" />
      };
    }
    if (roleLower.includes('dron') || roleLower.includes('piloto')) {
      return {
        cardBg: 'bg-amber-50/90 border-amber-200 text-amber-900',
        badgeBg: 'bg-amber-600 text-white',
        icon: <Radio className="w-3.5 h-3.5 text-amber-700" />
      };
    }
    if (roleLower.includes('editor') || roleLower.includes('montaje')) {
      return {
        cardBg: 'bg-purple-50/90 border-purple-200 text-purple-900',
        badgeBg: 'bg-purple-600 text-white',
        icon: <Scissors className="w-3.5 h-3.5 text-purple-700" />
      };
    }
    if (roleLower.includes('ingest') || roleLower.includes('audio') || roleLower.includes('técnico')) {
      return {
        cardBg: 'bg-cyan-50/90 border-cyan-200 text-cyan-900',
        badgeBg: 'bg-cyan-600 text-white',
        icon: <HardDrive className="w-3.5 h-3.5 text-cyan-700" />
      };
    }
    // Fallback based on index
    const colorStyles = [
      { cardBg: 'bg-indigo-50/90 border-indigo-200 text-indigo-900', badgeBg: 'bg-indigo-600 text-white', icon: <Users className="w-3.5 h-3.5 text-indigo-700" /> },
      { cardBg: 'bg-teal-50/90 border-teal-200 text-teal-900', badgeBg: 'bg-teal-600 text-white', icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" /> },
      { cardBg: 'bg-rose-50/90 border-rose-200 text-rose-900', badgeBg: 'bg-rose-600 text-white', icon: <Users className="w-3.5 h-3.5 text-rose-700" /> },
    ];
    return colorStyles[index % colorStyles.length];
  };

  // Completed steps count out of 12
  const completedStepsCount = useMemo(() => {
    let count = 0;
    OFFICIAL_STEPS_INFO.forEach(st => {
      const stepData = allProjectSteps.get(st.stepNumber);
      if (stepData && stepData.status === 'completed') {
        count++;
      }
    });
    return count;
  }, [allProjectSteps]);

  // Download PDF Handler (without watermark)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const filename = `Reporte-Avance-12-Pasos-${project.uniqueCode || project.contractNumber || 'TCT'}.pdf`;
      await exportElementToPdf('tct-progress-report-canvas', filename, `Ficha Técnica 12 Pasos - ${project.title}`);
    } catch (err) {
      console.error('Error generating report PDF:', err);
      alert('Ocurrió un error al generar el PDF del reporte. Intente nuevamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // WhatsApp Message Generator (with single % symbol)
  const handleSendWhatsApp = () => {
    const text = 
      `🇵🇪 *CORPORACIÓN TCT S.A.C. - FICHA DE AUDITORÍA (12 PASOS)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Producción:* ${project.title}\n` +
      `🏷️ *Código Único:* ${project.uniqueCode || 'TCT-2026'}\n` +
      `📄 *Contrato:* ${project.contractNumber || 'N/A'}\n` +
      `👤 *Cliente:* ${project.clientName} (DNI/RUC: ${project.clientDniRuc || project.clientDni || 'N/A'})\n` +
      `📅 *Fecha Evento:* ${project.eventDate}\n` +
      `📊 *Avance del Flujo:* ${progressInfo.formattedPercentage} (${completedStepsCount}/12 Pasos)\n` +
      `💰 *Presupuesto Total:* S/. ${totalBudget.toLocaleString('es-PE')}\n` +
      `💵 *Adelanto:* S/. ${depositPaid.toLocaleString('es-PE')}\n` +
      `💳 *Saldo Pendiente:* S/. ${pendingBalance.toLocaleString('es-PE')}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *Corporación TCT • Marcando Historia*`;
    sendToWhatsAppPeru('990010020', text);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Top Control Bar (Screen only) */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <TCTLogo size="sm" variant="icon-only" />
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Reporte de Avance Oficial (12 Pasos)</span>
                <span className="text-[10px] font-mono text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {project.uniqueCode || project.contractNumber}
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Ficha técnica oficial de auditoría secuencial y equipo de producción
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              type="button"
              className="px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Descargar Reporte en formato PDF A4 Oficial (Sin Marca de Agua)"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Download className="w-4 h-4 text-slate-950" />
              )}
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>

            {/* Send WhatsApp Peru 990010020 */}
            <button
              onClick={handleSendWhatsApp}
              type="button"
              className="px-3 py-1.5 sm:py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="Compartir reporte a WhatsApp Perú (990010020)"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Canvas Container */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-slate-100 flex-1 flex justify-center">
          
          <div 
            id="tct-progress-report-canvas" 
            className="w-full max-w-[820px] bg-white text-slate-900 p-5 sm:p-7 rounded-2xl shadow-md border border-slate-200 flex flex-col justify-between space-y-3 relative"
            style={{ minHeight: '980px' }}
          >
            {/* =========================================================
                CABECERA OFICIAL TCT & METADATOS DEL EXPEDIENTE
                ========================================================= */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2.5">
                {/* Logo & Corporate Data */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-amber-500/80 flex items-center justify-center text-amber-400 font-black text-xs shadow-xs shrink-0">
                    <TCTLogo size="sm" variant="icon-only" />
                  </div>
                  <div>
                    <h1 className="font-black text-slate-950 text-base sm:text-lg tracking-tight leading-none">
                      {contractDesign?.headerTitle || 'CORPORACIÓN TCT S.A.C.'}
                    </h1>
                    <p className="text-[9.5px] sm:text-[10px] font-black text-[#d97706] tracking-wide uppercase mt-0.5 leading-tight">
                      PRODUCCIÓN AUDIOVISUAL, EVENTOS & MONITOREO DE ENTREGABLES
                    </p>
                    <p className="text-[8.5px] sm:text-[9px] text-slate-500 font-medium leading-tight mt-0.5">
                      RUC: 20608941253 • Jr. Las Camelias 450, San Isidro, Lima • Tel: (01) 748-9200
                    </p>
                  </div>
                </div>

                {/* Right Codes Box */}
                <div className="text-right space-y-0.5 shrink-0">
                  <div className="bg-slate-950 text-amber-400 font-mono font-black text-[11px] sm:text-xs px-2.5 py-0.5 rounded-md border border-amber-500/30 inline-block shadow-2xs">
                    {project.uniqueCode || `TCT-2026-${project.eventType.toUpperCase().slice(0, 4)}-001`}
                  </div>
                  <p className="text-[9px] text-slate-600 font-medium">
                    Cotización Ref: <span className="font-mono text-slate-900 font-bold">{project.quotationCode || project.quotationNumber || 'COT-2026-110'}</span>
                  </p>
                  <p className="text-[9px] text-slate-600 font-medium">
                    Contrato: <span className="font-mono text-slate-900 font-bold">{project.contractNumber || 'CONT-TCT-2026-110'}</span>
                  </p>
                  <p className="text-[8.5px] text-slate-500">
                    Fecha Emisión: {emissionDateFormatted}
                  </p>
                </div>
              </div>

              {/* Ficha Técnica Title & Progress Banner */}
              <div className="flex items-start justify-between pt-1">
                <div>
                  <span className="text-[9.5px] font-black tracking-wider text-[#d97706] uppercase block">
                    FICHA TÉCNICA OFICIAL DEL EXPEDIENTE
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-slate-950 tracking-tight leading-tight mt-0.5">
                    {project.title}
                  </h2>
                  <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                    Tipo: <strong className="text-slate-900">{project.eventType}</strong> • Paquete: <strong className="text-slate-900">{project.selectedPackageName || project.packageName || 'Paquete Oficial TCT (Cine 4K + Dron + Fotolibro)'}</strong>
                  </p>
                </div>

                {/* Flow Progress Percentage and Counter Badge (Clean single % sign) */}
                <div className="text-right shrink-0">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">
                    AVANCE DEL FLUJO
                  </span>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                      {progressInfo.formattedPercentage}
                    </span>
                    <span className="bg-slate-950 text-amber-400 font-mono font-black text-xs px-2 py-0.5 rounded-md border border-amber-500/20">
                      {completedStepsCount}/12
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================
                3 COLUMNS SUMMARY: CLIENTE, EVENTO, ESTADO ECONÓMICO
                ========================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              
              {/* Column 1: Client Data (Jalado del formulario de producción) */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-2.5 space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  DATOS DEL CLIENTE
                </span>
                <p className="text-xs font-black text-slate-950 leading-tight">
                  {project.clientName}
                </p>
                <p className="text-[9.5px] text-slate-600 font-mono">
                  DNI/RUC: <strong className="text-slate-800">{project.clientDniRuc || project.clientDni || 'No registrado'}</strong>
                </p>
                <p className="text-[9.5px] text-slate-600">
                  Tel: <strong className="text-slate-800">{project.clientPhone || '+51 987654321'}</strong>
                </p>
                <p className="text-[9.5px] text-slate-600 truncate">
                  Dir: <span className="text-slate-700">{project.clientAddress || 'Lima, Perú'}</span>
                </p>
              </div>

              {/* Column 2: Event Details */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-2.5 space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  DETALLES DEL EVENTO
                </span>
                <p className="text-xs font-black text-slate-950 font-mono leading-tight">
                  {project.eventDate}
                </p>
                <p className="text-[9px] text-slate-600 leading-tight">
                  Horario: {scheduleFormatted}
                </p>
                <p className="text-[9.5px] text-slate-600 truncate">
                  Locación: <strong className="text-slate-800">{project.eventLocation || project.location || 'Salón de Eventos / Lima'}</strong>
                </p>
                <p className="text-[9.5px] text-slate-600 truncate">
                  Dirección: <span className="text-slate-700">{project.eventAddress || project.eventLocation || project.location || 'Lima, Perú'}</span>
                </p>
              </div>

              {/* Column 3: Financial Status (Dark Container) */}
              <div className="bg-slate-950 text-white rounded-xl p-2.5 space-y-1 flex flex-col justify-between shadow-xs border border-slate-800">
                <span className="text-[8.5px] font-black text-amber-400 uppercase tracking-wider block">
                  ESTADO ECONÓMICO (S/.)
                </span>
                <div className="space-y-0.5 text-[9.5px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Presupuesto Total:</span>
                    <span className="font-mono font-bold text-amber-400">S/. {totalBudget.toLocaleString('es-PE')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Adelanto Inicial:</span>
                    <span className="font-mono font-bold text-emerald-400">S/. {depositPaid.toLocaleString('es-PE')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Cobrado en Campo:</span>
                    <span className="font-mono font-bold text-cyan-400">S/. {fieldCollected.toLocaleString('es-PE')}</span>
                  </div>
                </div>
                <div className="border-t border-slate-800 pt-1 flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-200">Saldo Pendiente:</span>
                  <span className="font-mono font-black text-rose-400 text-xs">S/. {pendingBalance.toLocaleString('es-PE')}</span>
                </div>
              </div>

            </div>

            {/* =========================================================
                TABLA OFICIAL DE AUDITORÍA: 6 FASES / 12 PASOS SECUENCIALES
                (Columna FASE primero y con colores dedicados, sin columna de archivos)
                ========================================================= */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center space-x-1.5 text-slate-950 font-black text-xs uppercase tracking-tight">
                <FileText className="w-3.5 h-3.5 text-slate-900" />
                <span>AUDITORÍA DEL FLUJO OFICIAL (6 FASES / 12 PASOS SECUENCIALES)</span>
              </div>

              <div className="w-full border border-slate-200 rounded-lg overflow-hidden text-[9.5px]">
                {/* Table Header: 5 Columns (FASE, PASO/HITO, AVANCE, ESTADO, RESPONSABLE/VERIFICACIÓN) */}
                <div className="bg-slate-950 text-white font-black text-[8px] uppercase tracking-wider grid grid-cols-12 py-2 px-2.5 items-center gap-1.5">
                  <div className="col-span-3">FASE (1 AL 6)</div>
                  <div className="col-span-3">PASO / HITO</div>
                  <div className="col-span-2">AVANCE (% / ITEMS)</div>
                  <div className="col-span-2 text-center">ESTADO</div>
                  <div className="col-span-2">RESPONSABLE / VERIFICACIÓN</div>
                </div>

                {/* 12 Rows */}
                <div className="divide-y divide-slate-200 bg-white">
                  {OFFICIAL_STEPS_INFO.map((stepMeta) => {
                    const stepData = allProjectSteps.get(stepMeta.stepNumber);
                    const status = stepData ? stepData.status : 'pending';
                    const isCompleted = status === 'completed';
                    const isInProgress = status === 'in_progress';
                    
                    const phaseStyle = PHASES_INFO[stepMeta.phaseNumber];

                    // Count real attachments
                    const actualAttachmentsCount = (stepData?.attachments?.length || 0) + (
                      (stepMeta.stepNumber === 1 && project.proformaAttachmentUrl) ? 1 :
                      (stepMeta.stepNumber === 2 && project.depositReceiptUrl) ? 1 :
                      (stepMeta.stepNumber === 3 && project.contractExported) ? 1 :
                      (stepMeta.stepNumber === 10 && stepData?.socialLinks) ? 1 :
                      (stepMeta.stepNumber === 12 && stepData?.conformityAcceptance?.signedDocAttachmentUrl) ? 1 : 0
                    );

                    // Checklist & items math
                    const totalChecks = stepData?.checklist?.length ?? stepMeta.defaultChecks;
                    const checkedChecks = stepData?.checklist 
                      ? stepData.checklist.filter(c => c.completed).length 
                      : (isCompleted ? totalChecks : 0);
                    
                    const expectedAttachments = 1; // 1 expected deliverable/voucher per step
                    const completedAttachments = actualAttachmentsCount > 0 ? 1 : (isCompleted ? 1 : 0);
                    
                    const totalStepItems = totalChecks + expectedAttachments;
                    const completedStepItems = checkedChecks + completedAttachments;
                    
                    // Exact Step Progress calculation:
                    let stepPercentage = 0;
                    if (isCompleted) {
                      stepPercentage = 100;
                    } else if (totalStepItems > 0) {
                      stepPercentage = Number(((completedStepItems / totalStepItems) * 100).toFixed(2));
                    }
                    stepPercentage = Math.min(100, Math.max(0, stepPercentage));
                    const formattedStepPercentage = `${stepPercentage.toFixed(2)}%`;

                    // Last updated user and timestamp
                    const responsibleName = stepData?.lastUpdatedBy || stepData?.completedBy || stepData?.responsibleStaff || stepMeta.defaultStaff;
                    const timestamp = stepData?.lastUpdatedAt || stepData?.completedAt;

                    return (
                      <div 
                        key={stepMeta.stepNumber} 
                        className={`grid grid-cols-12 py-1.5 px-2.5 items-center gap-1.5 ${
                          isCompleted ? 'bg-emerald-50/20' : isInProgress ? 'bg-amber-50/20' : 'bg-white'
                        }`}
                      >
                        {/* 1. Columna FASE (Antes de Paso/Hito, Enumerada del 1 al 6 con colores consistentes) */}
                        <div className="col-span-3 flex items-center space-x-1.5 truncate">
                          <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-black border uppercase truncate ${phaseStyle.badgeBg} ${phaseStyle.badgeText} ${phaseStyle.badgeBorder}`}>
                            Fase {phaseStyle.phaseNumber}: {phaseStyle.name}
                          </span>
                        </div>

                        {/* 2. Paso / Hito with circle number */}
                        <div className="col-span-3 flex items-center space-x-1.5 truncate">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[8px] shrink-0 ${
                            isCompleted 
                              ? 'bg-emerald-600 text-white' 
                              : isInProgress 
                              ? 'bg-amber-500 text-slate-950 font-black' 
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {stepMeta.stepNumber}
                          </span>
                          <span className="font-bold text-slate-900 text-[8.5px] truncate" title={stepData?.title || stepMeta.title}>
                            {stepData?.title || stepMeta.title}
                          </span>
                        </div>

                        {/* 3. Columna de Avance (% a 2 decimales + barra de color + conteo items) */}
                        <div className="col-span-2 space-y-0.5">
                          <div className="flex items-center justify-between text-[8px] leading-none">
                            <span className="font-mono font-black text-slate-950">
                              {formattedStepPercentage}
                            </span>
                            <span className="font-mono font-semibold text-slate-500 text-[7px]">
                              {completedStepItems}/{totalStepItems}
                            </span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCompleted 
                                  ? 'bg-emerald-600' 
                                  : stepPercentage > 0 
                                  ? 'bg-amber-500' 
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${stepPercentage}%` }}
                            />
                          </div>
                          {/* Sub-label */}
                          <div className="text-[6.5px] font-mono text-slate-500 font-medium truncate">
                            {checkedChecks}/{totalChecks} chk • {completedAttachments}/{expectedAttachments} adj
                          </div>
                        </div>

                        {/* 4. Estado Badge */}
                        <div className="col-span-2 text-center">
                          {isCompleted ? (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[7.5px] rounded-md inline-flex items-center gap-0.5 border border-emerald-300">
                              ✓ OK
                            </span>
                          ) : isInProgress ? (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-black text-[7.5px] rounded-md inline-flex items-center gap-0.5 border border-amber-300">
                              ⚡ CURSO
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[7.5px] rounded-md inline-flex items-center border border-slate-200">
                              PEND.
                            </span>
                          )}
                        </div>

                        {/* 5. Responsable / Verificación (Nombre del usuario que realizó el último cambio + Fecha y Hora) */}
                        <div className="col-span-2 text-[8px] leading-tight truncate">
                          <p className="font-bold text-slate-900 truncate" title={responsibleName}>
                            {responsibleName}
                          </p>
                          {timestamp ? (
                            <p className="text-[7px] text-slate-500 font-mono flex items-center gap-0.5 truncate mt-0.5">
                              <span className={isCompleted ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                                {isCompleted ? '✓' : '⚡'}
                              </span>
                              <span className="truncate">{timestamp}</span>
                            </p>
                          ) : (
                            <p className="text-[7px] text-slate-400 italic mt-0.5">
                              {isCompleted ? 'Validado OK' : 'En espera'}
                            </p>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* =========================================================
                TÉCNICOS ASIGNADOS (EQUIPO DE PRODUCCIÓN CON COLORES)
                (Reemplaza el antiguo cuadro de Garantías & Plazos)
                ========================================================= */}
            <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 space-y-1.5 text-[9px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-slate-950 font-black uppercase text-[8.5px] tracking-wider">
                  <Users className="w-3.5 h-3.5 text-slate-900" />
                  <span>EQUIPO TÉCNICO Y PROFESIONALES ASIGNADOS A LA PRODUCCIÓN</span>
                </div>
                <span className="text-[7.5px] font-mono text-slate-500 font-medium">
                  {technicalCrewList.length} Profesionales Acreditados TCT
                </span>
              </div>

              {/* Grid of Colorful Technical Staff Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 pt-0.5">
                {technicalCrewList.slice(0, 5).map((staff, idx) => {
                  const style = getRoleBadgeStyle(staff.role, idx);
                  return (
                    <div 
                      key={staff.id || `staff-${idx}`}
                      className={`p-1.5 rounded-lg border flex flex-col justify-between shadow-2xs transition-all ${style.cardBg}`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="p-1 rounded-md bg-white/90 border border-slate-200/60 shadow-2xs shrink-0">
                          {style.icon}
                        </div>
                        <span className={`px-1 py-0.2 rounded text-[6.5px] font-black uppercase tracking-tight ${style.badgeBg}`}>
                          {staff.confirmed !== false ? 'Acreditado' : 'Asignado'}
                        </span>
                      </div>
                      
                      <div className="space-y-0.5">
                        <p className="font-black text-slate-950 text-[8.5px] leading-tight truncate" title={staff.name}>
                          {staff.name}
                        </p>
                        <p className="text-[7px] font-bold text-slate-600 uppercase tracking-tight leading-none truncate" title={staff.role}>
                          {staff.role}
                        </p>
                        {staff.phone && (
                          <p className="text-[6.5px] font-mono text-slate-500 truncate pt-0.5">
                            {staff.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {project.technicalCrewDeployment && (
                <p className="text-[7.5px] text-slate-500 italic mt-0.5 truncate">
                  * Despliegue Técnico Acreditado: <strong className="text-slate-700">{project.technicalCrewDeployment}</strong>
                </p>
              )}
            </div>

            {/* Full-Width Thick Divider */}
            <div className="h-0.5 bg-slate-950 w-full" />

            {/* =========================================================
                SECCIÓN DE FIRMAS Y CONFORMIDADES (TCT Y CLIENTE)
                (Jalados automáticamente de los datos de Nueva Producción)
                ========================================================= */}
            <div className="pt-2">
              <div className="grid grid-cols-2 gap-8 text-center">
                
                {/* TCT Sello & Firma Asesor / Director */}
                <div className="flex flex-col items-center">
                  <div className="w-48 border-t-2 border-slate-900 mb-1" />
                  <span className="text-[7.5px] text-slate-400 italic mb-0.5">Firma & Sello Corporativo</span>
                  <p className="font-black text-slate-950 text-[9.5px] uppercase tracking-tight">
                    {contractDesign?.headerTitle || 'CORPORACIÓN TCT S.A.C.'}
                  </p>
                  <p className="text-[8px] text-slate-600 font-bold uppercase">{advisorRole}</p>
                  <p className="text-[9px] text-slate-900 font-black mt-0.5">{advisorName}</p>
                  <p className="text-[8px] text-slate-500 font-mono">DNI: {advisorDni}</p>
                </div>

                {/* Cliente Firma (Jalado del cliente de Nueva Producción) */}
                <div className="flex flex-col items-center">
                  <div className="w-48 border-t-2 border-slate-900 mb-1" />
                  <span className="text-[7.5px] text-slate-400 italic mb-0.5">Firma del Contratante</span>
                  <p className="font-black text-slate-950 text-[9.5px] uppercase tracking-tight">
                    {project.clientName.toUpperCase()}
                  </p>
                  <p className="text-[8px] text-slate-600 font-bold uppercase">EL CLIENTE</p>
                  <p className="text-[8.5px] text-slate-900 font-mono font-black mt-0.5">
                    DNI / RUC: {project.clientDniRuc || project.clientDni || 'No registrado'}
                  </p>
                  <p className="text-[7.5px] text-slate-500 truncate max-w-[200px]">
                    {project.clientAddress || 'Lima, Perú'}
                  </p>
                </div>

              </div>

              {/* Micro-footer */}
              <div className="text-center pt-3 text-[7.5px] text-slate-400 font-mono">
                Documento Oficial de Auditoría y Control Técnico emitido por Corporación TCT • Lima, Perú
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
