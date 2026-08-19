import React, { useState } from 'react';
import { ProductionProject, ProjectAuditLog } from '../types';
import { formatAuditTimestamp, formatTimeAgo, createAuditEntry, appendAuditLog } from '../utils/auditLogger';
import { 
  ShieldCheck, 
  Clock, 
  User, 
  Search, 
  Filter, 
  PlusCircle, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Banknote, 
  HardDrive, 
  Paperclip, 
  Share2, 
  Edit3, 
  AlertCircle,
  MessageSquare,
  Sparkles,
  ArrowUpDown,
  History,
  X
} from 'lucide-react';

interface ProjectAuditLogViewProps {
  project: ProductionProject;
  onUpdateProject: (updated: ProductionProject) => void;
  currentUser?: { name: string; role: string };
}

type ActionFilter = 'all' | 'steps' | 'financial' | 'ingest_files' | 'commercial' | 'manual';

export const ProjectAuditLogView: React.FC<ProjectAuditLogViewProps> = ({
  project,
  onUpdateProject,
  currentUser = { name: 'Ing. Roberto Acuña (Admin)', role: 'admin' }
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [manualNoteTitle, setManualNoteTitle] = useState('');
  const [manualNoteDescription, setManualNoteDescription] = useState('');
  const [manualNoteAuthor, setManualNoteAuthor] = useState(currentUser.name);

  const logs = project.auditLogs || [];

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // Action category match
    if (actionFilter === 'steps') {
      if (!['step_completed', 'step_updated', 'checklist_checked', 'conformity_signed'].includes(log.action)) {
        return false;
      }
    } else if (actionFilter === 'financial') {
      if (!['field_payment_registered', 'commercial_edited'].includes(log.action) && !log.title.toLowerCase().includes('pago') && !log.title.toLowerCase().includes('cobro')) {
        return false;
      }
    } else if (actionFilter === 'ingest_files') {
      if (!['ingest_logged', 'attachment_uploaded', 'social_link_published'].includes(log.action)) {
        return false;
      }
    } else if (actionFilter === 'commercial') {
      if (!['commercial_edited', 'project_created', 'staff_assigned', 'equipment_assigned'].includes(log.action)) {
        return false;
      }
    } else if (actionFilter === 'manual') {
      if (log.action !== 'manual_note_added') {
        return false;
      }
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = log.title?.toLowerCase().includes(q);
      const matchDesc = log.description?.toLowerCase().includes(q);
      const matchUser = log.userName?.toLowerCase().includes(q);
      const matchDate = log.formattedDate?.toLowerCase().includes(q);
      const matchStep = log.stepNumber ? `paso ${log.stepNumber}`.includes(q) : false;
      if (!matchTitle && !matchDesc && !matchUser && !matchDate && !matchStep) {
        return false;
      }
    }

    return true;
  });

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const handleAddManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNoteTitle.trim() || !manualNoteDescription.trim()) return;

    const newLog = createAuditEntry({
      userName: manualNoteAuthor.trim() || currentUser.name,
      userRole: currentUser.role,
      action: 'manual_note_added',
      title: manualNoteTitle.trim(),
      description: manualNoteDescription.trim()
    });

    const updated = appendAuditLog(project, newLog);
    onUpdateProject(updated);

    // Reset
    setManualNoteTitle('');
    setManualNoteDescription('');
    setIsAddNoteOpen(false);
  };

  const getActionIcon = (action: ProjectAuditLog['action']) => {
    switch (action) {
      case 'step_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'field_payment_registered':
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      case 'ingest_logged':
        return <HardDrive className="w-4 h-4 text-blue-600" />;
      case 'attachment_uploaded':
        return <Paperclip className="w-4 h-4 text-amber-600" />;
      case 'social_link_published':
        return <Share2 className="w-4 h-4 text-purple-600" />;
      case 'conformity_signed':
        return <ShieldCheck className="w-4 h-4 text-emerald-700" />;
      case 'commercial_edited':
        return <Edit3 className="w-4 h-4 text-amber-600" />;
      case 'manual_note_added':
        return <MessageSquare className="w-4 h-4 text-sky-600" />;
      case 'project_created':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <History className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActionBadge = (action: ProjectAuditLog['action']) => {
    switch (action) {
      case 'step_completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">Hito Completado</span>;
      case 'field_payment_registered':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">Cobro Registrado</span>;
      case 'ingest_logged':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">Ingest NAS Dual</span>;
      case 'attachment_uploaded':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">Evidencia Técnica</span>;
      case 'social_link_published':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300">Redes Publicadas</span>;
      case 'conformity_signed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-950 border border-emerald-400">Acta de Conformidad</span>;
      case 'commercial_edited':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-900 border border-yellow-300">Edición Comercial</span>;
      case 'manual_note_added':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-900 border border-sky-300">Nota de Auditoría</span>;
      case 'project_created':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400">Creación Expediente</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">Actualización</span>;
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'TC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      
      {/* Header Bar with Summary Metrics & Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Top title and add button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Registro de Auditoría y Trazabilidad (Audit Logs)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  {logs.length} {logs.length === 1 ? 'evento registrado' : 'eventos registrados'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Historial inmutable de usuarios, cambios de estado, pagos y fechas de ejecución de <strong className="text-slate-800">{project.uniqueCode}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsAddNoteOpen(true)}
              className="w-full sm:w-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Nueva Nota de Auditoría</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats row for audit */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Total Eventos</span>
            <span className="text-lg font-black text-slate-900">{logs.length}</span>
            <span className="text-[10px] text-slate-500 block">trazabilidad 100%</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 block uppercase">Hitos y Pasos</span>
            <span className="text-lg font-black text-emerald-800">
              {logs.filter(l => l.action === 'step_completed' || l.action === 'checklist_checked').length}
            </span>
            <span className="text-[10px] text-emerald-700 block">validaciones técnicas</span>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block uppercase">Finanzas & Contrato</span>
            <span className="text-lg font-black text-amber-900">
              {logs.filter(l => l.action === 'field_payment_registered' || l.action === 'commercial_edited').length}
            </span>
            <span className="text-[10px] text-amber-800 block">movimientos de caja</span>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block uppercase">Última Modificación</span>
            <span className="text-xs font-black text-blue-900 truncate block mt-1">
              {logs[0] ? formatTimeAgo(logs[0].timestamp) : 'Sin cambios'}
            </span>
            <span className="text-[10px] text-blue-700 block truncate">
              {logs[0] ? logs[0].userName.split(' ')[0] : '---'}
            </span>
          </div>
        </div>

        {/* Filter bar & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          
          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 md:pb-0 text-xs font-bold scrollbar-thin">
            <span className="text-slate-400 text-[11px] flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filtrar:
            </span>

            <button
              type="button"
              onClick={() => setActionFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                actionFilter === 'all'
                  ? 'bg-slate-900 text-white font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos ({logs.length})
            </button>

            <button
              type="button"
              onClick={() => setActionFilter('steps')}
              className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                actionFilter === 'steps'
                  ? 'bg-emerald-600 text-white font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hitos y Pasos
            </button>

            <button
              type="button"
              onClick={() => setActionFilter('financial')}
              className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                actionFilter === 'financial'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pagos y Comercial
            </button>

            <button
              type="button"
              onClick={() => setActionFilter('ingest_files')}
              className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                actionFilter === 'ingest_files'
                  ? 'bg-blue-600 text-white font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Ingest & Archivos
            </button>

            <button
              type="button"
              onClick={() => setActionFilter('manual')}
              className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                actionFilter === 'manual'
                  ? 'bg-sky-600 text-white font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Notas Manuales
            </button>
          </div>

          {/* Search box & sort order */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por usuario, acción o fecha..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 shrink-0"
              title="Cambiar orden cronológico"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Más recientes' : 'Más antiguos'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        
        {sortedLogs.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              No se encontraron registros de auditoría
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm || actionFilter !== 'all' 
                ? 'Prueba a restablecer los filtros de búsqueda para ver todo el historial.'
                : 'Las acciones realizadas por el equipo y administradores se registrarán automáticamente en este panel.'}
            </p>
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-6 space-y-6 before:content-[''] before:absolute before:left-5 sm:before:left-7 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {sortedLogs.map((log) => {
              const initials = getUserInitials(log.userName);
              const isAdmin = log.userName.toLowerCase().includes('admin') || log.userRole === 'admin';

              return (
                <div key={log.id} className="relative flex items-start space-x-3 sm:space-x-4 group">
                  
                  {/* Timeline Avatar Node */}
                  <div className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-xs shrink-0 transition-transform group-hover:scale-110 ${
                    isAdmin 
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-white' 
                      : 'bg-slate-800 text-white ring-4 ring-white'
                  }`}>
                    {initials}
                  </div>

                  {/* Event Card */}
                  <div className="flex-1 bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-3.5 sm:p-4 border border-slate-200 transition-all space-y-2">
                    
                    {/* Top Row: User name, role badge, category badge and exact date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {log.userName}
                        </span>

                        {isAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-200 text-amber-950">
                            ADMIN
                          </span>
                        )}

                        {getActionBadge(log.action)}

                        {log.stepNumber && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                            Paso {log.stepNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
                        <span className="font-bold text-amber-700">{formatTimeAgo(log.timestamp)}</span>
                        <span>•</span>
                        <span className="font-mono">{log.formattedDate || formatAuditTimestamp(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        {getActionIcon(log.action)}
                        <span>{log.title}</span>
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {log.description}
                      </p>
                    </div>

                    {/* Metadata tags if present */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="pt-2 mt-2 border-t border-slate-200/80 flex items-center gap-2 flex-wrap text-[11px]">
                        {Object.entries(log.metadata).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-[10px]">
                            <strong className="text-slate-900">{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Manual Note Modal / Drawer */}
      {isAddNoteOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Registrar Nota de Auditoría</h3>
                  <p className="text-[11px] text-slate-500">Quedará grabada con firma de usuario y fecha inmutable</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddNoteOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualNote} className="space-y-3.5 text-xs">
              
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Usuario Responsable / Auditor:
                </label>
                <input
                  type="text"
                  value={manualNoteAuthor}
                  onChange={e => setManualNoteAuthor(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Título / Asunto de la Observación:
                </label>
                <input
                  type="text"
                  value={manualNoteTitle}
                  onChange={e => setManualNoteTitle(e.target.value)}
                  placeholder="e.g. Conformidad verbal con el cliente sobre cambio de horario"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Detalle Extenso de la Auditoría:
                </label>
                <textarea
                  rows={4}
                  value={manualNoteDescription}
                  onChange={e => setManualNoteDescription(e.target.value)}
                  placeholder="Detallar lo acordado, justificación técnica o validación realizada..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-slate-900 bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddNoteOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black transition-colors shadow-xs"
                >
                  Guardar en Registro Oficial
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
