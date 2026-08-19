import React from 'react';
import { ProductionProject } from '../types';
import { TCTLogo } from './TCTLogo';
import { printElement, downloadPrintableHtml, downloadEditableDoc } from '../utils/printHelper';
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
  FileText
} from 'lucide-react';

interface ReportPrintModalProps {
  project: ProductionProject;
  onClose: () => void;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  project,
  onClose
}) => {
  const handlePrint = () => {
    printElement('tct-printable-document', `Informe-${project.uniqueCode}`);
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml(
      'tct-printable-document',
      `Informe-Auditoria-${project.uniqueCode}.html`,
      `Informe Oficial TCT - ${project.uniqueCode}`
    );
  };

  const handleDownloadWordDoc = () => {
    downloadEditableDoc(
      'tct-printable-document',
      `Informe-Auditoria-${project.uniqueCode}-Editable.doc`,
      `Informe Oficial TCT - ${project.uniqueCode}`
    );
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
        <div className="print:hidden px-4 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <TCTLogo size="xs" variant="icon-only" />
            <div>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                Corporación TCT • Auditoría & Ficha Técnica Oficial
              </span>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>{project.uniqueCode}</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-slate-300 font-bold">{project.clientName}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1">
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="Abrir cuadro de diálogo de impresión y Guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>PDF / Imprimir</span>
            </button>

            <button
              onClick={handleDownloadWordDoc}
              className="px-3 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Descargar Ficha Técnica en Word Editable (.doc)"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Word Editable (.doc)</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-2.5 sm:px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 shadow-sm flex items-center gap-1 transition-all cursor-pointer"
              title="Descargar archivo HTML imprimible"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">.HTML</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div id="tct-printable-document" className="relative p-8 sm:p-10 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 font-sans">
          
          {/* Watermark Logo Background (TCT Camera Logo Watermark as requested) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none p-12">
            <TCTLogo size="2xl" variant="watermark" className="w-full max-w-lg" />
          </div>

          {/* Letterhead Header */}
          <div className="relative flex items-center justify-between border-b-2 border-slate-900 pb-5">
            <div className="flex items-center space-x-4">
              <TCTLogo size="md" variant="icon-only" />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">
                  CORPORACIÓN TCT
                </h1>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  Producción Audiovisual, Eventos & Monitoreo de Entregables
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  RUC: 20608941253 • Jr. Las Camelias 450, San Isidro, Lima • Tel: (01) 748-9200
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-sm font-black bg-slate-900 text-amber-400 px-3 py-1.5 rounded-xl inline-block border border-slate-800 shadow-xs">
                {project.uniqueCode}
              </div>
              {project.quotationCode && (
                <p className="text-xs font-bold text-slate-700 font-mono mt-1">
                  Cotización Ref: {project.quotationCode}
                </p>
              )}
              {project.contractNumber && (
                <p className="text-xs font-bold text-slate-700 font-mono">
                  Contrato: {project.contractNumber}
                </p>
              )}
              <p className="text-[10px] text-slate-500">
                Fecha Emisión: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Project Title & Status Banner */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Ficha Técnica Oficial del Expediente</span>
              <h2 className="text-lg font-black text-slate-900">{project.title}</h2>
              <p className="text-xs text-slate-600">
                <strong>Tipo:</strong> {project.eventType} • <strong>Paquete:</strong> {project.selectedPackageName || 'Paquete Oficial TCT'}
              </p>
            </div>

            <div className="flex items-center space-x-3 text-right">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Avance del Flujo</span>
                <span className="text-xl font-black text-slate-900 font-mono">{progressPercent}%</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm">
                {completedSteps}/{totalSteps}
              </div>
            </div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Client info */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-500 uppercase text-[10px] block">Datos del Cliente</span>
              <p className="font-black text-slate-900">{project.clientName}</p>
              <p className="text-slate-600"><strong>DNI/RUC:</strong> {project.clientDniRuc || '73849201'}</p>
              <p className="text-slate-600"><strong>Tel:</strong> {project.clientPhone}</p>
              <p className="text-slate-600"><strong>Email:</strong> {project.clientEmail || 'contacto@cliente.com'}</p>
            </div>

            {/* Event info */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-500 uppercase text-[10px] block">Detalles del Evento</span>
              <p className="font-black text-slate-900">{project.eventDate}</p>
              <p className="text-slate-600"><strong>Horario:</strong> {project.eventTime}</p>
              <p className="text-slate-600"><strong>Locación:</strong> {project.eventLocation}</p>
              <p className="text-slate-600"><strong>Dirección:</strong> {project.eventAddress || project.eventLocation}</p>
            </div>

            {/* Financial Status in Soles S/. */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1 shadow-xs">
              <span className="font-bold text-amber-400 uppercase text-[10px] block">Estado Económico (S/.)</span>
              <p className="text-xs">Presupuesto Total: <strong className="text-amber-300 font-mono">S/. {project.totalBudget.toLocaleString()}</strong></p>
              <p className="text-xs text-emerald-300">Adelanto Inicial: <strong className="font-mono">S/. {project.initialDeposit.toLocaleString()}</strong></p>
              <p className="text-xs text-blue-300">Cobrado en Campo: <strong className="font-mono">S/. {project.fieldPayment.toLocaleString()}</strong></p>
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                <span>Saldo Pendiente:</span>
                <span className={`font-mono ${project.finalBalance === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  S/. {project.finalBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Official 12-Step Status Table */}
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-slate-900" />
              Auditoría del Flujo Oficial (6 Fases / 12 Pasos Secuenciales)
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white text-[10px] uppercase font-black">
                  <tr>
                    <th className="p-2.5">Paso / Hito</th>
                    <th className="p-2.5">Fase</th>
                    <th className="p-2.5">Estado</th>
                    <th className="p-2.5">Responsable / Verificación</th>
                    <th className="p-2.5 text-right">Archivos / Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {project.phases.map((phase) => (
                    phase.steps.map((step) => {
                      const isCompleted = step.status === 'completed';
                      const isInProgress = step.status === 'in_progress';
                      const isRule7 = step.stepNumber === 7;

                      return (
                        <tr key={step.stepNumber} className={isCompleted ? 'bg-emerald-50/20' : isInProgress ? 'bg-amber-50/40 font-bold' : ''}>
                          <td className="p-2.5 font-bold flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                              isCompleted ? 'bg-emerald-600 text-white' : isInProgress ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {step.stepNumber}
                            </span>
                            <span>{step.title}</span>
                          </td>
                          <td className="p-2.5 text-slate-600 text-[11px]">
                            {phase.name.split('. ')[1] || phase.name}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCompleted ? 'bg-emerald-100 text-emerald-900' : isInProgress ? 'bg-amber-200 text-amber-950 font-black' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isCompleted ? '✓ COMPLETADO' : isInProgress ? '⚡ EN CURSO' : 'PENDIENTE'}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700 text-[11px]">
                            {step.completedBy ? `${step.completedBy} (${step.completedAt || 'Auditado'})` : 'En espera'}
                          </td>
                          <td className="p-2.5 text-right text-[11px] text-slate-600 font-mono">
                            {step.attachments?.length || 0} adjuntos
                          </td>
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SLA & Delivery Guarantees */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <h4 className="font-black text-slate-900 uppercase text-xs">Garantías de Entrega & Plazos Oficiales (SLA TCT)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span><strong>Video Master & USB:</strong> 15 Días Hábiles desde el evento.</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-600" />
                <span><strong>Fotolibro Impreso:</strong> 30 Días Hábiles tras aprobación de maquetación.</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Nota: La entrega de entregables finales en estuche de madera y USB 3.0 requiere saldo S/. 0 y firma del Acta de Conformidad (Paso 12).
            </p>
          </div>

          {/* Official Signatures */}
          <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-10 text-center text-xs">
            <div className="space-y-12">
              <div className="h-12 border-b border-slate-400 w-52 mx-auto flex items-end justify-center pb-1">
                <span className="font-mono text-[10px] text-slate-400">Firma & Sello Corporativo</span>
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase">CORPORACIÓN TCT S.A.C.</p>
                <p className="text-[10px] text-slate-500">Director de Producción / Asesor Comercial</p>
                <p className="text-[9px] text-slate-400 font-mono">RUC: 20608941253</p>
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-12 border-b border-slate-400 w-52 mx-auto flex items-end justify-center pb-1">
                <span className="font-mono text-[10px] text-slate-400">Firma del Cliente</span>
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase">{project.clientName}</p>
                <p className="text-[10px] text-slate-500">DNI / RUC: {project.clientDniRuc || '73849201'}</p>
                <p className="text-[9px] text-slate-400">El Contratante</p>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 font-mono">
            Documento de Auditoría emitido formalmente por el Sistema Corporación TCT • Lima, Perú
          </div>

        </div>

      </div>
    </div>
  );
};
