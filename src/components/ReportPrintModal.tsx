import React, { useState } from 'react';
import { ProductionProject } from '../types';
import { TCTLogo } from './TCTLogo';
import { 
  printElement, 
  exportElementToPdf, 
  sendToWhatsAppPeru, 
  buildReportWhatsAppText,
  exportPdfAndOpenWhatsAppPeru 
} from '../utils/printHelper';
import { getStoredUsers } from '../utils/authStorage';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Clock, 
  Coins, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Sparkles,
  FileCheck,
  AlertTriangle,
  Download,
  Receipt,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  MessageCircle
} from 'lucide-react';

interface ReportPrintModalProps {
  project: ProductionProject;
  onClose: () => void;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  project,
  onClose
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const systemUsers = getStoredUsers();
  const matchedUser = systemUsers.find(u => {
    const uFull = (u.fullName || '').toLowerCase();
    const createdLower = (project.createdByName || '').toLowerCase();
    const holderLower = (project.contractHolder || '').toLowerCase();
    return (
      (createdLower && uFull && uFull.includes(createdLower)) ||
      (holderLower && uFull && uFull.includes(holderLower)) ||
      (project.createdByDni && u.dni === project.createdByDni) ||
      (project.contractHolderDni && u.dni === project.contractHolderDni)
    );
  });

  const advisorName = project.createdByName || matchedUser?.fullName || (project.contractHolder ? project.contractHolder.split(' - ')[0] : 'Michael Romero');
  const advisorDni = project.createdByDni || project.contractHolderDni || matchedUser?.dni || '45892314';

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await exportElementToPdf(
        'tct-printable-document',
        `Informe-Auditoria-${project.uniqueCode}.pdf`,
        `Informe Oficial TCT - ${project.uniqueCode}`
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    printElement('tct-printable-document', `Informe-${project.uniqueCode}`);
  };

  const handleSendReportWhatsApp = async () => {
    setIsGeneratingPdf(true);
    try {
      const fileName = `Informe-Auditoria-${project.uniqueCode}.pdf`;
      const headerMsg = buildReportWhatsAppText(project);
      await exportPdfAndOpenWhatsAppPeru('tct-printable-document', fileName, headerMsg, '51990010020');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Compute total steps and completed
  let totalSteps = 0;
  let completedSteps = 0;
  project.phases.forEach(ph => ph.steps.forEach(st => {
    totalSteps++;
    if (st.status === 'completed') completedSteps++;
  }));
  const progressPercent = Math.round((completedSteps / (totalSteps || 12)) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="print:hidden px-3 sm:px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 flex-wrap gap-2">
          <div className="flex items-center space-x-2.5">
            <TCTLogo size="xs" variant="icon-only" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span className="text-amber-400">FICHA TÉCNICA N° {project.uniqueCode}</span>
                <span className="text-slate-500 font-normal">|</span>
                <span className="text-slate-300 font-bold text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[240px]">{project.clientName}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1">
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Abrir cuadro de diálogo de impresión"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Imprimir Ficha</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Descargar PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Direct WhatsApp Peru 990010020 Button */}
            <button
              onClick={handleSendReportWhatsApp}
              disabled={isGeneratingPdf}
              className="px-2.5 sm:px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Enviar Reporte a WhatsApp (+51 990010020)"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white text-white" />
              <span className="hidden sm:inline">WhatsApp 990010020</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            {/* Navigation Icons (Atrás, Salir) */}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Atrás"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Atrás</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container (Optimized for 1-page A4 vertical) */}
        <div id="tct-printable-document" className="relative p-5 sm:p-7 overflow-y-auto space-y-3 flex-1 bg-white text-slate-900 font-sans print:p-2 print:space-y-2">
          
          {/* Watermark Logo Background (TCT Camera Logo Watermark as requested) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none p-8">
            <TCTLogo size="2xl" variant="watermark" className="w-full max-w-sm" />
          </div>

          {/* Letterhead Header */}
          <div className="relative flex items-center justify-between border-b-2 border-slate-900 pb-2.5 page-break-inside-avoid">
            <div className="flex items-center space-x-3">
              <TCTLogo size="sm" variant="icon-only" />
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase">
                  CORPORACIÓN TCT
                </h1>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                  Producción Audiovisual, Eventos & Monitoreo de Entregables
                </p>
                <p className="text-[9px] text-slate-500 font-mono">
                  RUC: 20608941253 • Jr. Las Camelias 450, San Isidro, Lima • Tel: (01) 748-9200
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-xs font-black bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg inline-block border border-slate-800 shadow-xs">
                {project.uniqueCode}
              </div>
              {project.quotationCode && (
                <p className="text-[10px] font-bold text-slate-700 font-mono mt-0.5">
                  Cotización Ref: {project.quotationCode}
                </p>
              )}
              {project.contractNumber && (
                <p className="text-[10px] font-bold text-slate-700 font-mono">
                  Contrato: {project.contractNumber}
                </p>
              )}
              <p className="text-[9px] text-slate-500">
                Fecha Emisión: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Project Title & Status Banner */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 page-break-inside-avoid">
            <div>
              <span className="text-[9px] uppercase font-bold text-amber-700 block">Ficha Técnica Oficial del Expediente</span>
              <h2 className="text-sm font-black text-slate-900">{project.title}</h2>
              <p className="text-[10px] text-slate-600">
                <strong>Tipo:</strong> {project.eventType} • <strong>Paquete:</strong> {project.selectedPackageName || 'Paquete Oficial TCT'}
              </p>
            </div>

            <div className="flex items-center space-x-3 text-right">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Avance del Flujo</span>
                <span className="text-base font-black text-slate-900 font-mono">{progressPercent}%</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs">
                {completedSteps}/{totalSteps}
              </div>
            </div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] page-break-inside-avoid">
            {/* Client info */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
              <span className="font-bold text-slate-500 uppercase text-[9px] block">Datos del Cliente</span>
              <p className="font-black text-slate-900 text-[11px]">{project.clientName}</p>
              <p className="text-slate-600"><strong>DNI/RUC:</strong> {project.clientDniRuc || '73849201'}</p>
              <p className="text-slate-600"><strong>Tel:</strong> {project.clientPhone}</p>
              <p className="text-slate-600"><strong>Email:</strong> {project.clientEmail || 'contacto@cliente.com'}</p>
            </div>

            {/* Event info */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
              <span className="font-bold text-slate-500 uppercase text-[9px] block">Detalles del Evento</span>
              <p className="font-black text-slate-900 text-[11px]">{project.eventDate}</p>
              <p className="text-slate-600"><strong>Horario:</strong> {project.eventTime}</p>
              <p className="text-slate-600"><strong>Locación:</strong> {project.eventLocation}</p>
              <p className="text-slate-600 truncate"><strong>Dirección:</strong> {project.eventAddress || project.eventLocation}</p>
            </div>

            {/* Financial Status in Soles S/. */}
            <div className="p-2.5 bg-slate-900 text-white rounded-xl space-y-0.5 shadow-xs">
              <span className="font-bold text-amber-400 uppercase text-[9px] block">Estado Económico (S/.)</span>
              <p className="text-[10px]">Presupuesto Total: <strong className="text-amber-300 font-mono">S/. {project.totalBudget.toLocaleString()}</strong></p>
              <p className="text-[10px] text-emerald-300">Adelanto Inicial: <strong className="font-mono">S/. {project.initialDeposit.toLocaleString()}</strong></p>
              <p className="text-[10px] text-blue-300">Cobrado en Campo: <strong className="font-mono">S/. {project.fieldPayment.toLocaleString()}</strong></p>
              <div className="pt-0.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold">
                <span>Saldo Pendiente:</span>
                <span className={`font-mono font-black ${project.finalBalance === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  S/. {project.finalBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Official 12-Step Status Table */}
          <div className="space-y-1 page-break-inside-avoid">
            <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-wide flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-slate-900" />
              Auditoría del Flujo Oficial (6 Fases / 12 Pasos Secuenciales)
            </h3>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-[10px]">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white text-[9px] uppercase font-black">
                  <tr>
                    <th className="p-1.5">Paso / Hito</th>
                    <th className="p-1.5">Fase</th>
                    <th className="p-1.5">Estado</th>
                    <th className="p-1.5">Responsable / Verificación</th>
                    <th className="p-1.5 text-right">Archivos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {project.phases.map((phase) => (
                    phase.steps.map((step) => {
                      const isCompleted = step.status === 'completed';
                      const isInProgress = step.status === 'in_progress';

                      return (
                        <tr key={step.stepNumber} className={isCompleted ? 'bg-emerald-50/20' : isInProgress ? 'bg-amber-50/40 font-bold' : ''}>
                          <td className="p-1.5 font-bold flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                              isCompleted ? 'bg-emerald-600 text-white' : isInProgress ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {step.stepNumber}
                            </span>
                            <span>{step.title}</span>
                          </td>
                          <td className="p-1.5 text-slate-600 text-[9px]">
                            {phase.name.split('. ')[1] || phase.name}
                          </td>
                          <td className="p-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isCompleted ? 'bg-emerald-100 text-emerald-900' : isInProgress ? 'bg-amber-200 text-amber-950 font-black' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isCompleted ? '✓ OK' : isInProgress ? '⚡ CURSO' : 'PEND.'}
                            </span>
                          </td>
                          <td className="p-1.5 text-slate-700 text-[9px]">
                            {(() => {
                              const latestAtt = step.attachments && step.attachments.length > 0 ? step.attachments[step.attachments.length - 1] : null;
                              const respName = latestAtt?.uploadedBy || step.completedBy || (isCompleted ? (project.contractHolder ? project.contractHolder.split(' - ')[0] : 'Corporación TCT') : null);
                              const respDateTime = latestAtt?.uploadedAt || step.completedAt || (isCompleted ? project.createdAt : null);

                              if (respName) {
                                return (
                                  <div className="leading-tight">
                                    <span className="font-bold text-slate-900">{respName}</span>
                                    {respDateTime && (
                                      <span className="text-[8px] text-slate-500 block">
                                        📅 {respDateTime}
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                              return <span className="text-slate-400 italic text-[8.5px]">En espera</span>;
                            })()}
                          </td>
                          <td className="p-1.5 text-right text-[9px] text-slate-600 font-mono">
                            {step.attachments?.length || 0} adj.
                          </td>
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Technical Staff & Assigned Equipment Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[10px] page-break-inside-avoid">
            
            {/* Personal Técnico Asignado */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="font-black text-slate-900 uppercase text-[9px] flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-600" />
                  Personal Técnico Asignado ({project.assignedStaff?.length || 0})
                </span>
                <span className="text-[8.5px] text-slate-500 font-bold">Fase 2 • Paso 5</span>
              </div>

              {project.assignedStaff && project.assignedStaff.length > 0 ? (
                <div className="space-y-1">
                  {project.assignedStaff.map((staff, idx) => (
                    <div key={staff.id || idx} className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-200 text-[9.5px]">
                      <div>
                        <span className="font-bold text-slate-900">{staff.name}</span>
                        <span className="text-slate-500 block text-[8.5px]">
                          {staff.role} {staff.phone ? `• Tel: ${staff.phone}` : ''}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        staff.confirmed 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {staff.confirmed ? '✓ Confirmado' : 'Asignado'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-[9px] py-1">
                  Sin personal asignado aún (Se define en Paso 5: Plan de Rodaje).
                </p>
              )}
            </div>

            {/* Equipos & Recursos Técnicos Asignados */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="font-black text-slate-900 uppercase text-[9px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Equipos Técnicos & Logística ({project.equipmentList?.length || 0})
                </span>
                <span className="text-[8.5px] text-slate-500 font-bold">Fase 3 • Paso 6</span>
              </div>

              {project.equipmentList && project.equipmentList.length > 0 ? (
                <div className="grid grid-cols-2 gap-1 max-h-28 overflow-hidden">
                  {project.equipmentList.map((eq, idx) => (
                    <div key={eq.id || idx} className="bg-white p-1 rounded-md border border-slate-200 text-[8.5px] flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate" title={eq.name}>
                        {eq.name}
                      </span>
                      <span className="text-[7.5px] bg-slate-100 px-1 py-0.2 rounded text-slate-600 shrink-0">
                        {eq.category || 'Equipo'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic text-[9px] py-1">
                  Equipamiento estándar en reserva (Cámaras 4K, Audio Inalámbrico, Baterías, SDs V90).
                </p>
              )}

              {project.additionalEquipmentNotes && (
                <div className="bg-amber-50/80 p-1.5 rounded-lg border border-amber-200 text-[8.5px] text-amber-900 leading-tight">
                  <strong>Requerimiento Adicional:</strong> {project.additionalEquipmentNotes}
                </div>
              )}

              {project.transportDetails && (
                <div className="text-[8.5px] text-slate-600">
                  <strong>Transporte:</strong> {project.transportDetails}
                </div>
              )}
            </div>

          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] space-y-1 page-break-inside-avoid">
            <h4 className="font-black text-slate-900 uppercase text-[10px]">Garantías de Entrega & Plazos Oficiales (TCT)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span><strong>Video Master & USB:</strong> 15 Días Hábiles desde el evento.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-pink-600" />
                <span><strong>Fotolibro Impreso:</strong> 30 Días Hábiles tras aprobación de maquetación.</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 italic">
              * Nota: La entrega de entregables finales en estuche de madera y USB 3.0 requiere saldo S/. 0 y firma del Acta de Conformidad (Paso 12).
            </p>
          </div>

          {/* Official Signatures (Zona en blanco para firma y sello) */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-center text-[10px] page-break-inside-avoid">
            <div className="space-y-2">
              <div className="h-16 border-b-2 border-slate-900 w-48 mx-auto bg-white rounded-t-md" />
              <div className="space-y-0.5">
                <p className="font-black text-slate-900 uppercase text-[10px]">CORPORACIÓN TCT S.A.C.</p>
                <p className="text-[9px] text-slate-600 font-medium">Director de Producción / Asesor Comercial</p>
                <p className="text-[10px] text-slate-900 font-black">{advisorName}</p>
                <p className="text-[9.5px] text-slate-900 font-black font-mono">DNI: {advisorDni}</p>
                <p className="text-[8px] text-slate-400 font-mono">RUC: 20608941253</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-16 border-b-2 border-slate-900 w-48 mx-auto bg-white rounded-t-md" />
              <div className="space-y-0.5">
                <p className="font-black text-slate-900 uppercase text-[10px]">{project.clientName}</p>
                <p className="text-[9.5px] text-slate-900 font-black font-mono">DNI / RUC: {project.clientDniRuc || '73849201'}</p>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider">El Contratante</p>
              </div>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 pt-1.5 border-t border-slate-100 font-mono page-break-inside-avoid">
            Documento de Auditoría emitido formalmente por el Sistema Corporación TCT • Lima, Perú
          </div>

        </div>

      </div>
    </div>
  );
};
