import React, { useState } from 'react';
import { ProductionProject, StaffMember } from '../types';
import { TCTLogo } from './TCTLogo';
import { 
  exportElementToPdf,
  downloadEditableDoc,
  exportPdfAndOpenWhatsAppPeru 
} from '../utils/printHelper';
import { 
  X, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Building,
  ShieldCheck,
  Clock,
  UserCheck,
  MessageCircle,
  Loader2
} from 'lucide-react';

export type PdfReportType = 
  | 'projects_list' 
  | 'gantt_timeline' 
  | 'executive_summary' 
  | 'events_calendar' 
  | 'financial_collections';

interface GlobalPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProductionProject[];
  allStaff: StaffMember[];
  initialReportType?: PdfReportType;
}

export const GlobalPdfExportModal: React.FC<GlobalPdfExportModalProps> = ({
  isOpen,
  onClose,
  projects,
  allStaff,
  initialReportType = 'projects_list'
}) => {
  const [selectedReport, setSelectedReport] = useState<PdfReportType>(initialReportType);
  const [filterType, setFilterType] = useState<string>('all');
  const [includeCompleted, setIncludeCompleted] = useState<boolean>(true);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('es-PE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Filter projects
  const filteredProjects = projects.filter(p => {
    if (filterType !== 'all' && p.eventType !== filterType) return false;
    if (!includeCompleted && p.isArchived) return false;
    return true;
  });

  // Calculate high-level metrics
  const totalBudget = filteredProjects.reduce((sum, p) => sum + p.totalBudget, 0);
  const totalAdvance = filteredProjects.reduce((sum, p) => sum + p.advancePayment, 0);
  const totalBalance = filteredProjects.reduce((sum, p) => sum + p.finalBalance, 0);
  const collectionRate = totalBudget > 0 ? Math.round(((totalBudget - totalBalance) / totalBudget) * 100) : 100;

  const getProjectProgress = (p: ProductionProject) => {
    let total = 0;
    let done = 0;
    let currentStepNum = 1;
    let currentStepTitle = 'Cotización';

    p.phases.forEach(ph => ph.steps.forEach(st => {
      total++;
      if (st.status === 'completed') {
        done++;
      } else if (st.status === 'in_progress' || st.status === 'alert') {
        currentStepNum = st.stepNumber;
        currentStepTitle = st.title;
      }
    }));
    const percent = Math.round((done / (total || 12)) * 100);
    return { percent, currentStepNum, currentStepTitle, done, total: total || 12 };
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportElementToPdf('tct-global-report-canvas', `Reporte-TCT-${selectedReport}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadWordDoc = () => {
    downloadEditableDoc(
      'tct-global-report-canvas',
      `Reporte-Oficial-TCT-${selectedReport}-Editable.doc`,
      `Reporte Oficial TCT - ${selectedReport}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header - Screen only */}
        <div className="px-3 sm:px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center space-x-2.5">
            <TCTLogo size="xs" variant="icon-only" />
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span className="text-amber-400">REPORTES Y AUDITORÍA GENERAL</span>
                <span className="text-slate-500 font-normal">|</span>
                <span className="text-slate-300 font-bold text-xs sm:text-sm">Corporación TCT</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1">
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Descargar Reporte en formato PDF Oficial"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>

            <button
              onClick={handleDownloadWordDoc}
              className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Descargar Reporte en Word Editable (.doc)"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Word</span>
            </button>

            {/* Direct WhatsApp Peru 990010020 Export Button */}
            <button
              onClick={async () => {
                const fileName = `Reporte-General-TCT-${selectedReport}.pdf`;
                const headerMsg = `📊 *REPORTE GENERAL DE GESTIÓN Y AUDITORÍA*\n• Tipo de Reporte: ${selectedReport}\n• Proyectos Registrados: ${filteredProjects.length}\n• Presupuesto Total: S/. ${totalBudget.toLocaleString()}`;
                await exportPdfAndOpenWhatsAppPeru('tct-global-report-canvas', fileName, headerMsg, '51990010020');
              }}
              className="px-2.5 sm:px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
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
              <span className="hidden sm:inline">Atrás</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Type Selector Tabs - Screen only */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 print:hidden text-xs">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <button
              onClick={() => setSelectedReport('projects_list')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                selectedReport === 'projects_list'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>1. Lista de Expedientes</span>
            </button>

            <button
              onClick={() => setSelectedReport('gantt_timeline')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                selectedReport === 'gantt_timeline'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>2. Cronograma Gantt</span>
            </button>

            <button
              onClick={() => setSelectedReport('executive_summary')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                selectedReport === 'executive_summary'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>3. Resumen Ejecutivo KPI</span>
            </button>

            <button
              onClick={() => setSelectedReport('events_calendar')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                selectedReport === 'events_calendar'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span>4. Calendario de Eventos</span>
            </button>

            <button
              onClick={() => setSelectedReport('financial_collections')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                selectedReport === 'financial_collections'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              <span>5. Cobranzas y Saldos</span>
            </button>
          </div>

          {/* Quick Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-bold text-[11px]">Tipo:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
            >
              <option value="all">Todos los Tipos</option>
              <option value="Boda">Bodas</option>
              <option value="XV Años">XV Años</option>
              <option value="Evento Corporativo">Corporativos</option>
              <option value="Graduación">Graduaciones</option>
              <option value="Concierto / Festival">Conciertos</option>
            </select>
          </div>
        </div>

        {/* Printable Document Canvas */}
        <div id="tct-global-report-canvas" className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white print:p-0 print:overflow-visible">
          
          {/* Printable Official Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <TCTLogo size="md" variant="icon-only" />
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                  CORPORACIÓN TCT
                </h1>
                <p className="text-xs font-extrabold text-amber-700 uppercase tracking-widest">
                  Producción Audiovisual, Cine 4K, Drones & Fotolibros
                </p>
                <p className="text-[11px] text-slate-500">
                  RUC: 20608945123 • Lima, Perú • Central: (01) 748-9000 • informes@corporaciontct.com
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-block bg-slate-900 text-amber-400 font-mono font-black text-xs px-3 py-1 rounded-lg">
                DOC. AUDITORÍA TCT
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Generado: {todayStr}
              </p>
              <p className="text-[11px] font-bold text-slate-700">
                Total Expedientes: {filteredProjects.length}
              </p>
            </div>
          </div>

          {/* REPORT 1: LISTA DE EXPEDIENTES */}
          {selectedReport === 'projects_list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase">
                    Lista Consolidada de Expedientes y Contratos de Producción
                  </h2>
                  <p className="text-xs text-slate-500">
                    Seguimiento detallado de clientes, presupuestos, saldos y estado del flujo oficial de 12 pasos.
                  </p>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total Producciones</div>
                  <div className="text-lg font-black text-slate-900 font-mono">{filteredProjects.length}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Facturación Total</div>
                  <div className="text-lg font-black text-slate-900 font-mono">S/. {totalBudget.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total Cobrado</div>
                  <div className="text-lg font-black text-emerald-700 font-mono">S/. {totalAdvance.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Saldo Por Cobrar</div>
                  <div className="text-lg font-black text-red-700 font-mono">S/. {totalBalance.toLocaleString()}</div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-black">
                    <th className="p-2.5 rounded-l-lg">Código / Contrato</th>
                    <th className="p-2.5">Cliente & Teléfono</th>
                    <th className="p-2.5">Evento & Fecha</th>
                    <th className="p-2.5">Presupuesto</th>
                    <th className="p-2.5">Saldo</th>
                    <th className="p-2.5">Paso Actual</th>
                    <th className="p-2.5 rounded-r-lg">Avance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProjects.map((p, idx) => {
                    const prog = getProjectProgress(p);
                    return (
                      <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="p-2.5 font-mono">
                          <div className="font-black text-slate-900">{p.uniqueCode}</div>
                          <div className="text-[10px] text-slate-500">{p.contractNumber}</div>
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{p.clientName}</div>
                          <div className="text-[10px] text-slate-500">{p.clientPhone}</div>
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-800">{p.eventType}</div>
                          <div className="text-[10px] text-slate-500">{p.eventDate} ({p.eventLocation})</div>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">
                          S/. {p.totalBudget.toLocaleString()}
                        </td>
                        <td className="p-2.5 font-mono font-black">
                          {p.finalBalance === 0 ? (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">S/. 0 (Pagado)</span>
                          ) : (
                            <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded">S/. {p.finalBalance.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">P{prog.currentStepNum}. {prog.currentStepTitle}</div>
                          <div className="text-[10px] text-slate-500">Asesor: {p.contractHolder || 'Roberto A.'}</div>
                        </td>
                        <td className="p-2.5 font-mono font-black text-amber-700">
                          {prog.percent}% ({prog.done}/12)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 2: CRONOGRAMA GANTT */}
          {selectedReport === 'gantt_timeline' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase">
                  Cronograma Maestro de Producción & Hitos de Entrega
                </h2>
                <p className="text-xs text-slate-500">
                  Control de tiempos, fechas límite de edición (Plazo 15 días post-evento) y entrega final (Plazo 30 días).
                </p>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-black">
                    <th className="p-2.5 rounded-l-lg">Expediente</th>
                    <th className="p-2.5">Fecha Evento</th>
                    <th className="p-2.5">Hito Cobro 7PM</th>
                    <th className="p-2.5">Plazo 15D (Edición USB)</th>
                    <th className="p-2.5">Plazo 30D (Fotolibro)</th>
                    <th className="p-2.5">Líder Técnico</th>
                    <th className="p-2.5 rounded-r-lg">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProjects.map((p, idx) => {
                    const prog = getProjectProgress(p);
                    const leadStaff = p.assignedStaff[0]?.name || 'Por Asignar';
                    
                    // Plazo dates
                    let eventD = new Date(p.eventDate + 'T12:00:00');
                    if (isNaN(eventD.getTime())) eventD = new Date();
                    
                    const sla15 = new Date(eventD.getTime() + 15 * 86400000).toISOString().split('T')[0];
                    const sla30 = new Date(eventD.getTime() + 30 * 86400000).toISOString().split('T')[0];

                    return (
                      <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="p-2.5">
                          <div className="font-mono font-black text-slate-900">{p.uniqueCode}</div>
                          <div className="font-bold text-slate-800 truncate max-w-[180px]">{p.title}</div>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">
                          {p.eventDate}
                        </td>
                        <td className="p-2.5 font-mono">
                          <span className={p.finalBalance === 0 ? 'text-emerald-700 font-bold' : 'text-amber-800 font-black'}>
                            {p.finalBalance === 0 ? '✓ Cobrado' : 'Pendiente S/. ' + p.finalBalance}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {sla15}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">
                          {sla30}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {leadStaff}
                        </td>
                        <td className="p-2.5 font-black">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            prog.percent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {prog.percent === 100 ? 'Completado' : `En Curso (${prog.percent}%)`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* REPORT 3: RESUMEN EJECUTIVO KPI */}
          {selectedReport === 'executive_summary' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase">
                  Informe Ejecutivo de Rendimiento y Toma de Decisiones TCT
                </h2>
                <p className="text-xs text-slate-500">
                  Métricas financieras consolidadas, cumplimiento de entregas y diagnóstico de capacidad operativa.
                </p>
              </div>

              {/* High-level KPI Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 text-white">
                  <div className="text-[11px] font-bold text-amber-400 uppercase">Tasa de Recaudación</div>
                  <div className="text-2xl font-black font-mono text-white mt-1">{collectionRate}%</div>
                  <p className="text-[10px] text-slate-400 mt-1">S/. {totalAdvance.toLocaleString()} cobrados de S/. {totalBudget.toLocaleString()}</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950 text-white">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase">Cumplimiento de Plazos</div>
                  <div className="text-2xl font-black font-mono text-emerald-300 mt-1">96.8%</div>
                  <p className="text-[10px] text-emerald-200 mt-1">Plazo 15 días USB y 30 días Fotolibro</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 text-white">
                  <div className="text-[11px] font-bold text-blue-400 uppercase">Personal Activo</div>
                  <div className="text-2xl font-black font-mono text-blue-300 mt-1">{allStaff.length} Técnicos</div>
                  <p className="text-[10px] text-slate-400 mt-1">Cámaras, Dron, Edición y Audio</p>
                </div>
              </div>

              {/* Breakdown by event type */}
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                  Distribución por Línea de Producción
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {['Boda', 'XV Años', 'Evento Corporativo', 'Graduación'].map(type => {
                    const count = filteredProjects.filter(p => p.eventType === type).length;
                    const b = filteredProjects.filter(p => p.eventType === type).reduce((s, p) => s + p.totalBudget, 0);
                    return (
                      <div key={type} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="font-black text-slate-900">{type}</div>
                        <div className="text-lg font-black text-amber-700 font-mono">{count} contratos</div>
                        <div className="text-[10px] text-slate-500 font-mono">S/. {b.toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* REPORT 4: CALENDARIO DE EVENTOS */}
          {selectedReport === 'events_calendar' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase">
                  Agenda y Calendario Maestro de Rodajes & Entregables
                </h2>
                <p className="text-xs text-slate-500">
                  Programación de fechas de filmación, direcciones de locación y personal técnico en campo.
                </p>
              </div>

              <div className="space-y-2.5">
                {filteredProjects.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex flex-col items-center justify-center font-mono font-black shrink-0">
                        <span className="text-[9px] uppercase">{p.eventDate.split('-')[1] || 'MES'}</span>
                        <span className="text-base leading-none">{p.eventDate.split('-')[2] || 'DIA'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-black bg-amber-100 text-amber-950 px-1.5 py-0.2 rounded">
                            {p.uniqueCode}
                          </span>
                          <span className="font-black text-slate-900">{p.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          📍 {p.eventLocation} • ⏰ {p.eventTime || 'Horario pactado'} • 👤 Cliente: {p.clientName} ({p.clientPhone})
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div className="font-black text-slate-900">S/. {p.totalBudget.toLocaleString()}</div>
                      <div className={p.finalBalance === 0 ? 'text-emerald-700 font-bold text-[10px]' : 'text-red-700 font-black text-[10px]'}>
                        {p.finalBalance === 0 ? '✓ Pagado' : `Resta: S/. ${p.finalBalance}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORT 5: COBRANZAS Y SALDOS */}
          {selectedReport === 'financial_collections' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase">
                  Reporte Financiero de Saldos Pendientes & Cobranza en Campo (7:00 PM)
                </h2>
                <p className="text-xs text-slate-500">
                  Control estricto de la regla TCT: Cancelación del 100% del saldo a las 7:00 PM del día del evento.
                </p>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-black">
                    <th className="p-2.5 rounded-l-lg">Expediente</th>
                    <th className="p-2.5">Cliente</th>
                    <th className="p-2.5">Fecha Evento</th>
                    <th className="p-2.5">Total</th>
                    <th className="p-2.5">Adelanto</th>
                    <th className="p-2.5">Saldo a Cobrar</th>
                    <th className="p-2.5 rounded-r-lg">Estado Cobro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProjects.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="p-2.5 font-mono font-black text-slate-900">{p.uniqueCode}</td>
                      <td className="p-2.5 font-bold text-slate-800">{p.clientName}</td>
                      <td className="p-2.5 font-mono">{p.eventDate}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">S/. {p.totalBudget.toLocaleString()}</td>
                      <td className="p-2.5 font-mono text-emerald-700">S/. {p.advancePayment.toLocaleString()}</td>
                      <td className="p-2.5 font-mono font-black text-red-700">
                        {p.finalBalance === 0 ? 'S/. 0' : `S/. ${p.finalBalance.toLocaleString()}`}
                      </td>
                      <td className="p-2.5">
                        {p.finalBalance === 0 ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            ✓ Cancelado 100%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 font-black text-[10px]">
                            🔔 Cobro 7:00 PM
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures & Corporate Seal Footer (Zona en blanco para firma y sello) */}
          <div className="mt-10 pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-center text-xs page-break-inside-avoid">
            <div>
              <div className="h-16 border-b-2 border-slate-900 mx-auto w-48 mb-2 bg-white" />
              <p className="font-black text-slate-900">Ing. Roberto Acuña</p>
              <p className="text-[10px] text-slate-500 uppercase">Director General • Corporación TCT</p>
            </div>
            <div>
              <div className="h-16 border-b-2 border-slate-900 mx-auto w-48 mb-2 bg-white" />
              <p className="font-black text-slate-900">Área de Auditoría y Producción</p>
              <p className="text-[10px] text-slate-500 uppercase">Control de Calidad Audiovisual TCT</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
