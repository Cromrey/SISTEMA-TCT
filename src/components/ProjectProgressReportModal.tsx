import React, { useState, useMemo } from 'react';
import { ProductionProject, StepData } from '../types';
import { TCTLogo } from './TCTLogo';
import { exportElementToPdf, sendToWhatsAppPeru } from '../utils/printHelper';
import { getProjectProgressInfo } from '../utils/projectProgress';
import { 
  Download, 
  X, 
  MessageCircle, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';

interface ProjectProgressReportModalProps {
  project: ProductionProject;
  onClose: () => void;
}

// 12 Sequential Official Steps with phases and default names
const OFFICIAL_STEPS_INFO = [
  { stepNumber: 1, title: 'Cotización Oficial TCT', phase: 'Negociación y Contratación' },
  { stepNumber: 2, title: 'Adelanto en Efectivo', phase: 'Negociación y Contratación' },
  { stepNumber: 3, title: 'Firma de Contrato', phase: 'Negociación y Contratación' },
  { stepNumber: 4, title: 'Diseño del Flyer', phase: 'Planificación y Preparativos' },
  { stepNumber: 5, title: 'Logística de Viaje', phase: 'Planificación y Preparativos' },
  { stepNumber: 6, title: 'Viaje y Filmación Técnica', phase: 'Día del Evento y Cláusula de Pago' },
  { stepNumber: 7, title: 'Regla de Cobro en Campo (Límite: 7:00 PM)', phase: 'Día del Evento y Cláusula de Pago' },
  { stepNumber: 8, title: 'Resguardo de Material (Ingest)', phase: 'Día del Evento y Cláusula de Pago' },
  { stepNumber: 9, title: 'Edición y Entrega en USB', phase: 'Post-Producción y Montaje' },
  { stepNumber: 10, title: 'Publicación Garantizada', phase: 'Post-Producción y Montaje' },
  { stepNumber: 11, title: 'Entrega de Fotolibro', phase: 'Fotolibro Impreso' },
  { stepNumber: 12, title: 'Borrado de Archivos', phase: 'Depuración y Cierre' },
];

export const ProjectProgressReportModal: React.FC<ProjectProgressReportModalProps> = ({
  project,
  onClose
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  // Financial calculations
  const totalBudget = Number(project.budget) || 0;
  const depositPaid = Number(project.depositPaid) || 0;
  const fieldCollected = Number(project.fieldAmountCollected) || 0;
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
    if (project.multiDaySchedule && project.multiDaySchedule.length > 0) {
      return project.multiDaySchedule.map((d, i) => `Día ${i + 1} (${d.date}): ${d.startTime} - ${d.endTime}`).join(' | ');
    }
    const start = project.eventStartTime || '16:00';
    const end = project.eventEndTime || '02:00';
    return `Día 1 (${project.eventDate}): ${start} - ${end}`;
  }, [project]);

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

  // WhatsApp Message Generator
  const handleSendWhatsApp = () => {
    const text = 
      `🇵🇪 *CORPORACIÓN TCT S.A.C. - FICHA DE AUDITORÍA (12 PASOS)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 *Producción:* ${project.title}\n` +
      `🏷️ *Código Único:* ${project.uniqueCode || 'TCT-2026'}\n` +
      `📄 *Contrato:* ${project.contractNumber || 'N/A'}\n` +
      `👤 *Cliente:* ${project.clientName} (DNI/RUC: ${project.clientDni || 'N/A'})\n` +
      `📅 *Fecha Evento:* ${project.eventDate}\n` +
      `📊 *Avance del Flujo:* ${progressInfo.formattedPercentage}% (${completedStepsCount}/12 Pasos)\n` +
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
                Ficha técnica oficial de auditoría secuencial y estado económico
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

        {/* Document Canvas Container (Formatted exactly like the reference image) */}
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
                      CORPORACIÓN TCT
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
                    Cotización Ref: <span className="font-mono text-slate-900 font-bold">{project.quotationNumber || 'COT-2026-110'}</span>
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
                    Tipo: <strong className="text-slate-900">{project.eventType}</strong> • Paquete: <strong className="text-slate-900">{project.packageName || 'Paquete Oficial TCT (Cine 4K + Dron + Fotolibro)'}</strong>
                  </p>
                </div>

                {/* Flow Progress Percentage and Counter Badge */}
                <div className="text-right shrink-0">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">
                    AVANCE DEL FLUJO
                  </span>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                      {progressInfo.formattedPercentage}%
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
              
              {/* Column 1: Client Data */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-2.5 space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  DATOS DEL CLIENTE
                </span>
                <p className="text-xs font-black text-slate-950 leading-tight">
                  {project.clientName}
                </p>
                <p className="text-[9.5px] text-slate-600 font-mono">
                  DNI/RUC: <strong className="text-slate-800">{project.clientDni || 'No registrado'}</strong>
                </p>
                <p className="text-[9.5px] text-slate-600">
                  Tel: <strong className="text-slate-800">{project.clientPhone || '+51 987654321'}</strong>
                </p>
                <p className="text-[9.5px] text-slate-600 truncate">
                  Email: <span className="text-slate-700">{project.clientEmail || 'contacto@cliente.com'}</span>
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
                  Locación: <strong className="text-slate-800">{project.location || 'Salón de Eventos / Lima'}</strong>
                </p>
                <p className="text-[9.5px] text-slate-600 truncate">
                  Dirección: <span className="text-slate-700">{project.eventAddress || project.location || 'Lima, Perú'}</span>
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
                ========================================================= */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center space-x-1.5 text-slate-950 font-black text-xs uppercase tracking-tight">
                <FileText className="w-3.5 h-3.5 text-slate-900" />
                <span>AUDITORÍA DEL FLUJO OFICIAL (6 FASES / 12 PASOS SECUENCIALES)</span>
              </div>

              <div className="w-full border border-slate-200 rounded-lg overflow-hidden text-[9.5px]">
                {/* Table Header */}
                <div className="bg-slate-950 text-white font-black text-[8.5px] uppercase tracking-wider grid grid-cols-12 py-2 px-2.5 items-center">
                  <div className="col-span-4 sm:col-span-4">PASO / HITO</div>
                  <div className="col-span-3 sm:col-span-3">FASE</div>
                  <div className="col-span-2 sm:col-span-2 text-center">ESTADO</div>
                  <div className="col-span-2 sm:col-span-2">RESPONSABLE / VERIFICACIÓN</div>
                  <div className="col-span-1 sm:col-span-1 text-right">ARCHIVOS</div>
                </div>

                {/* 12 Rows */}
                <div className="divide-y divide-slate-200 bg-white">
                  {OFFICIAL_STEPS_INFO.map((stepMeta) => {
                    const stepData = allProjectSteps.get(stepMeta.stepNumber);
                    const status = stepData ? stepData.status : 'pending';
                    const isCompleted = status === 'completed';
                    const isInProgress = status === 'in_progress';
                    const attachmentsCount = stepData?.attachments?.length || (
                      stepMeta.stepNumber === 1 && project.proformaAttachmentUrl ? 1 :
                      stepMeta.stepNumber === 2 && project.depositReceiptUrl ? 1 : 0
                    );

                    return (
                      <div 
                        key={stepMeta.stepNumber} 
                        className={`grid grid-cols-12 py-1.5 px-2.5 items-center ${
                          isCompleted ? 'bg-emerald-50/20' : isInProgress ? 'bg-amber-50/20' : 'bg-white'
                        }`}
                      >
                        {/* Paso / Hito with circle number */}
                        <div className="col-span-4 sm:col-span-4 flex items-center space-x-1.5">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[8px] shrink-0 ${
                            isCompleted 
                              ? 'bg-emerald-600 text-white' 
                              : isInProgress 
                              ? 'bg-amber-500 text-slate-950 font-black' 
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {stepMeta.stepNumber}
                          </span>
                          <span className="font-bold text-slate-900 truncate">
                            {stepData?.title || stepMeta.title}
                          </span>
                        </div>

                        {/* Fase */}
                        <div className="col-span-3 sm:col-span-3 text-slate-600 text-[9px] truncate">
                          {stepMeta.phase}
                        </div>

                        {/* Estado Badge */}
                        <div className="col-span-2 sm:col-span-2 text-center">
                          {isCompleted ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[8px] rounded-md inline-flex items-center gap-0.5 border border-emerald-300">
                              ✓ OK
                            </span>
                          ) : isInProgress ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-black text-[8px] rounded-md inline-flex items-center gap-0.5 border border-amber-300">
                              ⚡ CURSO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[8px] rounded-md inline-flex items-center border border-slate-200">
                              PEND.
                            </span>
                          )}
                        </div>

                        {/* Responsable / Verificación */}
                        <div className="col-span-2 sm:col-span-2 text-slate-600 text-[9px] truncate">
                          {stepData?.responsibleStaff ? (
                            <span className="font-medium text-slate-800">{stepData.responsibleStaff}</span>
                          ) : isCompleted ? (
                            <span className="text-emerald-700 font-medium">Validado OK</span>
                          ) : (
                            <span className="text-slate-400 italic">En espera</span>
                          )}
                        </div>

                        {/* Archivos Adjuntos */}
                        <div className="col-span-1 sm:col-span-1 text-right text-slate-500 font-mono text-[9px]">
                          {attachmentsCount} adj.
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* =========================================================
                GARANTÍAS DE ENTREGA & PLAZOS OFICIALES (TCT)
                ========================================================= */}
            <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 space-y-1 text-[9px]">
              <span className="font-black text-slate-950 uppercase text-[8.5px] tracking-wider block">
                GARANTÍAS DE ENTREGA & PLAZOS OFICIALES (TCT)
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-700">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  <span><strong>Video Master & USB:</strong> 15 Días Hábiles desde el evento.</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span><strong>Fotolibro Impreso:</strong> 30 Días Hábiles tras aprobación de maquetación.</span>
                </div>
              </div>
              <p className="text-[8px] text-slate-500 italic mt-0.5">
                * Nota: La entrega de entregables finales en estuche de madera y USB 3.0 requiere saldo S/. 0 y firma del Acta de Conformidad (Paso 12).
              </p>
            </div>

            {/* Full-Width Thick Divider */}
            <div className="h-0.5 bg-slate-950 w-full" />

            {/* =========================================================
                SECCIÓN DE FIRMAS Y CONFORMIDADES (TCT Y CLIENTE)
                ========================================================= */}
            <div className="pt-2">
              <div className="grid grid-cols-2 gap-8 text-center">
                
                {/* TCT Sello & Firma */}
                <div className="flex flex-col items-center">
                  <div className="w-44 border-t border-slate-400 mb-1" />
                  <span className="text-[8px] text-slate-400 italic mb-0.5">Firma & Sello Corporativo</span>
                  <p className="font-black text-slate-950 text-[9.5px] uppercase tracking-tight">
                    CORPORACIÓN TCT S.A.C.
                  </p>
                  <p className="text-[8.5px] text-slate-600">Director de Producción / Asesor Comercial</p>
                  <p className="text-[8px] text-slate-400 font-mono">RUC: 20608941253</p>
                </div>

                {/* Cliente Firma */}
                <div className="flex flex-col items-center">
                  <div className="w-44 border-t border-slate-400 mb-1" />
                  <span className="text-[8px] text-slate-400 italic mb-0.5">Firma del Cliente</span>
                  <p className="font-black text-slate-950 text-[9.5px] uppercase tracking-tight">
                    {project.clientName.toUpperCase()}
                  </p>
                  <p className="text-[8.5px] text-slate-600 font-mono">
                    DNI / RUC: {project.clientDni || 'No registrado'}
                  </p>
                  <p className="text-[8px] text-slate-400">El Contratante</p>
                </div>

              </div>

              {/* Micro-footer */}
              <div className="text-center pt-3 text-[7.5px] text-slate-400 font-mono">
                Documento de Auditoría emitido formalmente por el Sistema Corporación TCT • Lima, Perú
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
