import React, { useState } from 'react';
import { ProductionProject, SmartAlert, DecisionInsight, EventType, StepData } from '../types';
import { TCTLogo } from './TCTLogo';
import { KpiMetricsDashboard } from './KpiMetricsDashboard';
import { SlaOverdueAlertsBanner } from './SlaOverdueAlertsBanner';
import { 
  Film, 
  Banknote,
  Receipt,
  HardDrive, 
  Clock, 
  Calendar,
  Layers,
  Flame,
  Zap,
  Tag,
  UserCheck,
  FileCheck,
  Printer,
  Eye,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  Sparkles,
  ChevronRight,
  Filter,
  AlertCircle,
  FileText,
  Lock,
  ArrowDown,
  BarChart3,
  PieChart
} from 'lucide-react';
import { CalendarView } from './CalendarView';
import { ExecutiveSummaryModule } from './ExecutiveSummaryModule';

interface AdminDashboardProps {
  projects: ProductionProject[];
  alerts: SmartAlert[];
  insights: DecisionInsight[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenProject: (project: ProductionProject) => void;
  onOpenNewProject: () => void;
  onOpenReportPrint: (project: ProductionProject) => void;
  onOpenContractExport: (project: ProductionProject) => void;
  onOpenAnalytics: () => void;
  savedQuickFilter?: 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'phase_specific';
  onSaveQuickFilter?: (filter: 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'phase_specific') => void;
}

type MainGrouping = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'phase_specific';
type SpecificPhaseFilter = 'all' | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  projects,
  alerts,
  insights,
  searchQuery,
  onSearchChange,
  onOpenProject,
  onOpenNewProject,
  onOpenReportPrint,
  onOpenContractExport,
  onOpenAnalytics,
  savedQuickFilter = 'all',
  onSaveQuickFilter
}) => {
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'executive'>('list');
  const [groupFilter, setGroupFilterState] = useState<MainGrouping>(savedQuickFilter);
  const [specificPhaseFilter, setSpecificPhaseFilter] = useState<SpecificPhaseFilter>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<EventType | 'all'>('all');

  const setGroupFilter = (filter: MainGrouping) => {
    setGroupFilterState(filter);
    if (onSaveQuickFilter) {
      onSaveQuickFilter(filter);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to compute progress and active step for a project
  const getProjectProgress = (p: ProductionProject) => {
    let total = 0;
    let done = 0;
    p.phases.forEach(ph => ph.steps.forEach(st => {
      total++;
      if (st.status === 'completed') done++;
    }));
    const percent = Math.round((done / (total || 12)) * 100);
    return { total, done, percent };
  };

  // Helper to find current active step milestone
  const getCurrentMilestone = (project: ProductionProject) => {
    for (const ph of project.phases) {
      for (const st of ph.steps) {
        if (st.status === 'in_progress') {
          return { stepNumber: st.stepNumber, title: st.title, phaseName: ph.name, step: st };
        }
      }
    }
    // Check first pending step
    for (const ph of project.phases) {
      for (const st of ph.steps) {
        if (st.status !== 'completed') {
          return { stepNumber: st.stepNumber, title: st.title, phaseName: ph.name, step: st };
        }
      }
    }
    return { 
      stepNumber: 12, 
      title: 'Acta de Conformidad & Purga', 
      phaseName: 'Fase 6: Archivo Final', 
      step: project.phases[5]?.steps[1] 
    };
  };

  // Missing action alert helper
  const getStepMissingActionAlert = (stepNumber: number, step?: StepData, project?: ProductionProject) => {
    if (!step) return 'Revisar checklist y evidencias del paso';
    if (step.status === 'completed') return '✓ Paso completado';
    
    switch (stepNumber) {
      case 1:
        return 'Falta: Ficha técnica y proforma oficial de cliente';
      case 2:
        return project && project.initialDeposit > 0 ? 'Falta: Voucher de adelanto y firma de contrato' : 'Falta: Confirmar adelanto';
      case 3:
        return 'Falta: Asignar director técnico y reserva de equipos';
      case 4:
        return 'Falta: Salida de almacén (baterías y SDs formateadas)';
      case 5:
        return 'Falta: Hoja de ruta y transporte a locación';
      case 6:
        return 'Falta: Bitácora de rodaje en locación';
      case 7:
        return project && project.finalBalance > 0 ? '⚠️ URGENTE: Cobro en campo antes de 7:00 PM' : 'Falta: Registrar medio de pago';
      case 8:
        return 'Falta: Ingest RAW y backup dual en NAS RAID';
      case 9:
        return 'Falta: Video Master 4K ProRes (SLA 15 Días)';
      case 10:
        return 'Falta: Publicar enlaces de redes (TikTok / YouTube)';
      case 11:
        return 'Falta: Maquetación de Fotolibro (SLA 30 Días)';
      case 12:
        return 'Falta: Entrega USB, Saldo S/. 0 y Acta de Conformidad';
      default:
        return 'Falta: Completar evidencias del paso';
    }
  };

  // Check if project is overdue
  const isProjectOverdue = (p: ProductionProject) => {
    const { percent } = getProjectProgress(p);
    if (percent === 100) return false;
    
    const eventTime = new Date(p.eventDate).getTime();
    const nowTime = new Date(todayStr).getTime();
    
    // If event was in the past and step 7 (cobro 7pm) is not completed
    const step7Done = p.phases[2]?.steps[1]?.status === 'completed';
    if (eventTime < nowTime && !step7Done && p.finalBalance > 0) return true;
    
    // Check SLA for 15 days or 30 days
    const diffDays = Math.round((nowTime - eventTime) / 86400000);
    if (diffDays > 15 && p.phases[3]?.steps[0]?.status !== 'completed') return true;
    if (p.includesPhotobook && diffDays > 30 && p.phases[4]?.steps[0]?.status !== 'completed') return true;
    
    return false;
  };

  // KPI Calculations in Soles (S/.)
  const activeProjects = projects.filter(p => !p.isArchived);
  const totalBudgetSum = projects.reduce((acc, p) => acc + p.totalBudget, 0);
  const totalCollectedSum = projects.reduce((acc, p) => acc + p.initialDeposit + p.fieldPayment, 0);
  const pendingCollectionSum = Math.max(0, totalBudgetSum - totalCollectedSum);

  const totalIngestGB = projects.reduce((acc, p) => {
    const ingest = p.phases[2]?.steps[2]?.ingestData;
    return acc + (ingest?.totalGigabytes || 0);
  }, 0);

  const projectsInEdit15Days = projects.filter(p => p.phases[3]?.steps[0]?.status === 'in_progress').length;
  const projectsInPhotobook30Days = projects.filter(p => p.phases[4]?.steps[0]?.status === 'in_progress').length;

  // Counts for Grouping Tabs
  const countAll = projects.length;
  const countInProgress = projects.filter(p => {
    const { percent } = getProjectProgress(p);
    return percent < 100 && !p.isArchived;
  }).length;
  const countCompleted = projects.filter(p => {
    const { percent } = getProjectProgress(p);
    return percent === 100 || p.isArchived;
  }).length;
  const countOverdue = projects.filter(p => isProjectOverdue(p)).length;

  // Filter projects by Grouping, Specific Phase, Search, and EventType
  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      p.title.toLowerCase().includes(q) ||
      p.uniqueCode.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.contractNumber.toLowerCase().includes(q) ||
      (p.quotationCode && p.quotationCode.toLowerCase().includes(q)) ||
      (p.contractHolder && p.contractHolder.toLowerCase().includes(q));

    const matchesType = selectedTypeFilter === 'all' || p.eventType === selectedTypeFilter;

    // Grouping Tab Filter
    const { percent } = getProjectProgress(p);
    let matchesGroup = true;
    if (groupFilter === 'pending' || groupFilter === 'in_progress') {
      matchesGroup = percent < 100 && !p.isArchived && !isProjectOverdue(p);
    } else if (groupFilter === 'completed') {
      matchesGroup = percent === 100 || Boolean(p.isArchived);
    } else if (groupFilter === 'overdue') {
      matchesGroup = isProjectOverdue(p);
    } else if (groupFilter === 'phase_specific') {
      if (specificPhaseFilter === 'f1') {
        matchesGroup = p.phases[0]?.steps.some(s => s.status === 'in_progress' || s.status === 'pending');
      } else if (specificPhaseFilter === 'f2') {
        matchesGroup = p.phases[1]?.steps.some(s => s.status === 'in_progress' || s.status === 'pending');
      } else if (specificPhaseFilter === 'f3') {
        matchesGroup = p.phases[2]?.steps.some(s => s.status === 'in_progress' || s.status === 'pending') || p.eventDate === todayStr;
      } else if (specificPhaseFilter === 'f4') {
        matchesGroup = p.phases[3]?.steps.some(s => s.status === 'in_progress' || s.status === 'pending');
      } else if (specificPhaseFilter === 'f5') {
        matchesGroup = p.phases[4]?.steps.some(s => s.status === 'in_progress' || s.status === 'pending');
      } else if (specificPhaseFilter === 'f6') {
        matchesGroup = p.phases[5]?.steps.some(s => s.status === 'in_progress' || s.status === 'pending');
      }
    }

    return matchesSearch && matchesType && matchesGroup;
  });

  const handleQuickFilterSelect = (filter: 'all' | 'pending' | 'overdue' | 'completed') => {
    setGroupFilter(filter);
    // Smooth scroll down to projects section if needed
    const projectsListEl = document.getElementById('tct-projects-list-section');
    if (projectsListEl) {
      projectsListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Interactive KPI Dashboard Panel with Charts (Total Producciones, Ingresos Proyectados, Tiempo Promedio de Cierre) */}
      <KpiMetricsDashboard 
        projects={projects}
        onSelectQuickFilter={handleQuickFilterSelect}
        activeFilter={groupFilter}
        onOpenProject={onOpenProject}
      />

      {/* 2. Visual Alerts Component for Projects Exceeding Established Deadlines / SLA */}
      <SlaOverdueAlertsBanner 
        projects={projects}
        onOpenProject={onOpenProject}
        onFilterByOverdue={() => handleQuickFilterSelect('overdue')}
        onOpenContract={onOpenContractExport}
      />

      {/* 3. Main Grouping Tabs & Actions Bar (Filtros Rápidos: Por Vencer, Completados, Pendientes, Todas) */}
      <div id="tct-projects-list-section" className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Top row: View Switcher & Action Buttons */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* View switcher */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl flex-wrap gap-y-1">
            <button
              onClick={() => setCurrentView('list')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                currentView === 'list' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Expedientes ({filteredProjects.length})</span>
            </button>
            
            <button
              onClick={() => setCurrentView('executive')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                currentView === 'executive' 
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-950" />
              <span>Resumen Ejecutivo</span>
              <span className="text-[10px] bg-slate-950/15 text-slate-900 px-1.5 py-0.2 rounded-full font-mono font-bold">
                Gráficos
              </span>
            </button>

            <button
              onClick={() => setCurrentView('calendar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                currentView === 'calendar' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendario de Eventos</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onOpenAnalytics}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Toma de Decisiones</span>
            </button>

            <button
              onClick={onOpenNewProject}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nueva Producción / Contrato</span>
            </button>
          </div>

        </div>

        {/* Agrupador Principal & Filtros Rápidos de Producciones */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1.5 text-xs font-bold">
              <span className="text-slate-500 font-extrabold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-amber-600" /> Filtro Rápido:
              </span>

              {/* Tab 1: Todas */}
              <button
                onClick={() => setGroupFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  groupFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Todas</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-white">
                  {countAll}
                </span>
              </button>

              {/* Tab 2: Por Vencer (Alertas SLA) */}
              <button
                onClick={() => setGroupFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  groupFilter === 'overdue'
                    ? 'bg-red-600 text-white shadow-xs font-black'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>Por Vencer / Alertas</span>
                {countOverdue > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-800 text-white animate-pulse font-black">
                    {countOverdue}
                  </span>
                )}
              </button>

              {/* Tab 3: Pendientes / En Proceso */}
              <button
                onClick={() => setGroupFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  groupFilter === 'pending' || groupFilter === 'in_progress'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Pendientes / En Curso</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 font-black">
                  {countInProgress}
                </span>
              </button>

              {/* Tab 4: Completadas */}
              <button
                onClick={() => setGroupFilter('completed')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  groupFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Completadas</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-700 text-white">
                  {countCompleted}
                </span>
              </button>

              {/* Tab 5: Por Fase / Proceso Específico */}
              <button
                onClick={() => setGroupFilter('phase_specific')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  groupFilter === 'phase_specific'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Por Fase</span>
              </button>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center space-x-1.5 text-xs font-bold">
              <span className="text-slate-500 text-[11px]">Tipo de Evento:</span>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as EventType | 'all')}
                className="bg-slate-100 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1 border border-slate-300 focus:outline-none"
              >
                <option value="all">Todos los Tipos</option>
                <option value="Boda">Bodas</option>
                <option value="XV Años">XV Años</option>
                <option value="Evento Corporativo">Corporativos</option>
                <option value="Graduación">Graduaciones</option>
                <option value="Concierto / Festival">Conciertos</option>
                <option value="Bautizo / Primera Comunión">Bautizos</option>
                <option value="Spot Publicitario">Spots</option>
              </select>
            </div>
          </div>

          {/* Sub-selector if Phase Specific is active */}
          {groupFilter === 'phase_specific' && (
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <span className="font-extrabold text-blue-700 text-[11px]">Seleccionar Fase:</span>
              {[
                { id: 'all', label: 'Todas las Fases' },
                { id: 'f1', label: 'Fase 1: Pre-Producción (P1-P2)' },
                { id: 'f2', label: 'Fase 2: Planificación (P3-P4)' },
                { id: 'f3', label: 'Fase 3: Rodaje & Cobro 7PM (P5-P7)' },
                { id: 'f4', label: 'Fase 4: Postprod Video 15d (P8-P9)' },
                { id: 'f5', label: 'Fase 5: Fotolibro 30d (P10-P11)' },
                { id: 'f6', label: 'Fase 6: Conformidad & Cierre (P12)' }
              ].map(ph => (
                <button
                  key={ph.id}
                  onClick={() => setSpecificPhaseFilter(ph.id as SpecificPhaseFilter)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    specificPhaseFilter === ph.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
                  }`}
                >
                  {ph.label}
                </button>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Main View: List of Projects vs Executive Summary vs Calendar */}
      {currentView === 'executive' ? (
        <ExecutiveSummaryModule
          projects={projects}
          onOpenProject={onOpenProject}
          onOpenReportPrint={onOpenReportPrint}
        />
      ) : currentView === 'calendar' ? (
        <CalendarView
          projects={projects}
          onOpenProject={onOpenProject}
        />
      ) : (
        /* Projects Interactive Cards Container */
        <div className="space-y-3.5">
          
          <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <TCTLogo size="xs" variant="icon-only" />
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
                  Expedientes & Contratos Oficiales de Producción ({filteredProjects.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Control de avance con hito activo parpadeante, alerta de acción inmediata y exportación de contrato
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-black">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                Flujo Oficial TCT Activo
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
                No hay producciones que coincidan con los filtros seleccionados.
              </div>
            ) : (
              filteredProjects.map((project) => {
                const { total, done, percent } = getProjectProgress(project);
                const isToday = project.eventDate === todayStr;
                const isZeroBalance = project.finalBalance === 0;
                const milestone = getCurrentMilestone(project);
                const isOverdue = isProjectOverdue(project);
                const missingActionAlert = getStepMissingActionAlert(milestone.stepNumber, milestone.step, project);
                const isActivelyWorking = !project.isArchived && percent < 100;

                return (
                  <div 
                    key={project.id}
                    className={`p-4 sm:p-4.5 rounded-2xl border transition-all duration-300 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shadow-xs ${
                      isOverdue
                        ? 'bg-gradient-to-br from-red-50/50 via-white to-red-50/20 border-red-300 hover:shadow-md'
                        : isActivelyWorking 
                        ? 'animate-subtle-pulse bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border-amber-400/90 hover:shadow-md' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    
                    {/* Left Column: Codes, Title, Client, Location, Tags */}
                    <div className="flex-1 space-y-2 min-w-0">
                      
                      {/* Linked Codes Badge Group */}
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        
                        {/* Quotation linked with Contract */}
                        <div className="flex items-center bg-slate-900 text-white rounded-xl p-0.5 border border-slate-700 shadow-xs">
                          {project.quotationCode && (
                            <span className="font-mono text-[11px] font-extrabold px-2.5 py-0.5 text-amber-300 border-r border-slate-700 flex items-center gap-1" title="Código de Cotización">
                              <Receipt className="w-3 h-3 text-amber-400" />
                              {project.quotationCode}
                            </span>
                          )}
                          <span className="font-mono text-[11px] font-black px-2.5 py-0.5 text-slate-100 flex items-center gap-1" title="Código de Contrato Oficial">
                            <FileCheck className="w-3 h-3 text-emerald-400" />
                            {project.contractNumber}
                          </span>
                        </div>

                        <span className="font-mono text-[11px] font-black bg-amber-100 text-amber-950 px-2 py-0.5 rounded-lg border border-amber-300">
                          {project.uniqueCode}
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
                          {project.eventType}
                        </span>

                        {isToday && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse shadow-xs">
                            🔴 EVENTO HOY (Cobro 7:00 PM)
                          </span>
                        )}

                        {isOverdue && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white shadow-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> VENCIDO DE PLAZO
                          </span>
                        )}
                      </div>

                      {/* Project Title */}
                      <h4 
                        onClick={() => onOpenProject(project)}
                        className="text-base font-black text-slate-900 hover:text-amber-600 cursor-pointer transition-colors leading-tight"
                      >
                        {project.title}
                      </h4>

                      {/* Contract Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate"><strong>Asesor / Contrato:</strong> {project.contractHolder || 'Ing. Roberto Acuña'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate"><strong>Cliente:</strong> {project.clientName} ({project.clientPhone})</span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span><strong>Fecha:</strong> {project.eventDate} ({project.eventTime || 'Horario pactado'})</span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate"><strong>Locación:</strong> {project.eventLocation}</span>
                        </div>
                      </div>

                      {/* Package and extra info pills */}
                      <div className="flex items-center space-x-2 text-[11px] flex-wrap gap-y-1 pt-0.5">
                        {project.selectedPackageName && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                            📦 {project.selectedPackageName}
                          </span>
                        )}
                        {project.discountAmount && project.discountAmount > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-black border border-emerald-300 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-emerald-600" />
                            Desc. S/. {project.discountAmount} {project.discountReason ? `(${project.discountReason})` : ''}
                          </span>
                        ) : null}
                        {project.extraHoursCount && project.extraHoursCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 font-bold border border-purple-200">
                            ⏱ +{project.extraHoursCount} hrs extra
                          </span>
                        ) : null}
                      </div>

                    </div>

                    {/* Compact, Highly Intuitive Dark Card: (Porcentaje, Hito Actual Parpadeante Fuerte, Alerta de lo que Falta) */}
                    <div className="w-full xl:w-84 bg-slate-950 text-white p-3.5 rounded-2xl border border-slate-800 space-y-2.5 shadow-lg shrink-0">
                      
                      {/* Top row of card: Milestone Badge & Big % */}
                      <div className="flex items-center justify-between gap-2">
                        
                        {/* Hito Actual: STRONGLY PULSING & HIGHLIGHTED AS REQUESTED */}
                        <div className="min-w-0 flex-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/30 to-amber-600/40 text-amber-300 border-2 border-amber-400 text-xs font-black shadow-md animate-pulse">
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>⚡ Paso {milestone.stepNumber}/12</span>
                          </div>
                          <div className="text-xs font-black text-white truncate block mt-1" title={milestone.title}>
                            {milestone.title}
                          </div>
                        </div>

                        {/* Big font percentage */}
                        <div className="text-right shrink-0">
                          <div className="text-3xl font-black text-amber-400 font-mono leading-none">
                            {percent}<span className="text-base font-bold text-amber-300">%</span>
                          </div>
                          <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-1.5 py-0.2 rounded font-mono border border-slate-700 block mt-1">
                            {done}/12 pasos
                          </span>
                        </div>

                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden p-0.5 border border-slate-700">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 rounded-full transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* ALERTA DE LO QUE FALTA PARA EL SIGUIENTE PASO */}
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-[11px] flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-slate-200 leading-tight font-medium">
                          {missingActionAlert}
                        </span>
                      </div>

                      {/* Compact Financials */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                        <span className="text-slate-300 text-[11px]">
                          Total: <strong className="text-white font-mono">S/. {project.totalBudget.toLocaleString()}</strong>
                        </span>
                        <span className={`font-black px-2 py-0.5 rounded text-[10px] font-mono ${
                          isZeroBalance 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}>
                          {isZeroBalance ? '✓ Saldo S/. 0' : `Resta: S/. ${project.finalBalance.toLocaleString()}`}
                        </span>
                      </div>

                    </div>

                    {/* Right Column: Actions (Contract Export, PDF TCT, Ver 12 Pasos) */}
                    <div className="flex flex-row xl:flex-col items-center justify-end space-x-2 xl:space-x-0 xl:space-y-1.5 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                      
                      {/* Export Contract Button (Pulls all registered data) */}
                      <button
                        onClick={() => onOpenContractExport(project)}
                        className="flex-1 xl:flex-initial px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
                        title="Ver y Exportar Contrato Oficial con datos rellenados"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Contrato</span>
                      </button>

                      {/* PDF Report */}
                      <button
                        onClick={() => onOpenReportPrint(project)}
                        className="flex-1 xl:flex-initial px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-bold flex items-center justify-center gap-1.5"
                        title="Exportar Reporte de Auditoría TCT"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reporte</span>
                      </button>

                      {/* Open 12 Steps Modal */}
                      <button
                        onClick={() => onOpenProject(project)}
                        className="flex-1 xl:flex-initial px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver 12 Pasos</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* Decision Making & Smart Suggestions Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-700 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Motor de Decisiones & Sugerencias Inteligentes TCT
              </h3>
              <p className="text-xs text-slate-400">
                Análisis de tiempos de entrega, liquidación en campo 7:00 PM y optimización de flujos
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAnalytics}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1"
          >
            <span>Ver Gráficos Comparativos</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {insights.map((ins, i) => (
            <div key={i} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-amber-300">
                  {ins.title}
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                  {ins.metric}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {ins.description}
              </p>
              <div className="text-[11px] bg-slate-900/90 p-2 rounded-lg border border-slate-700 text-emerald-300 font-medium">
                💡 <strong>Sugerencia TCT:</strong> {ins.suggestion}
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
