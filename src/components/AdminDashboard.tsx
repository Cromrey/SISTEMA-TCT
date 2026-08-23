import React, { useState, useEffect } from 'react';
import { ProductionProject, SmartAlert, DecisionInsight, EventType, StepData, StaffMember } from '../types';
import { TCTLogo } from './TCTLogo';
import { KpiMetricsDashboard } from './KpiMetricsDashboard';
import { SlaOverdueAlertsBanner } from './SlaOverdueAlertsBanner';
import { MonthlyStaffContractComparisonChart } from './MonthlyStaffContractComparisonChart';
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
  PieChart,
  QrCode,
  Download,
  CalendarDays,
  Trash2,
  Trophy
} from 'lucide-react';
import { CalendarView } from './CalendarView';
import { ExecutiveSummaryModule } from './ExecutiveSummaryModule';
import { TimelineGanttView } from './TimelineGanttView';
import { GlobalPdfExportModal, PdfReportType } from './GlobalPdfExportModal';
import { formatDateDDMMAA } from '../utils/dateFormatter';
import { getProjectProgressInfo } from '../utils/projectProgress';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ReferenceLine
} from 'recharts';

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
  onUpdateProject?: (project: ProductionProject) => void;
  onDeleteProject?: (projectId: string) => void;
  savedQuickFilter?: 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'due_this_week' | 'high_priority' | 'waiting_approval' | 'phase_specific';
  onSaveQuickFilter?: (filter: any) => void;
  allStaff?: StaffMember[];
}

type MainGrouping = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'due_this_week' | 'high_priority' | 'waiting_approval' | 'phase_specific';
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
  onUpdateProject,
  onDeleteProject,
  savedQuickFilter = 'all',
  onSaveQuickFilter,
  allStaff = []
}) => {
  const [currentView, setCurrentView] = useState<'list' | 'timeline' | 'calendar' | 'executive' | 'ranking'>('list');
  const [groupFilter, setGroupFilterState] = useState<MainGrouping>(savedQuickFilter as MainGrouping);
  const [specificPhaseFilter, setSpecificPhaseFilter] = useState<SpecificPhaseFilter>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<EventType | 'all'>('all');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfReportType, setPdfReportType] = useState<PdfReportType>('projects_list');
  const [showTimelineChart, setShowTimelineChart] = useState(false);

  // Listen to external calendar view triggers from header
  useEffect(() => {
    const handleSwitchTab = (e: CustomEvent<{ view: string }>) => {
      if (e.detail?.view === 'calendar') {
        setCurrentView('calendar');
      } else if (e.detail?.view === 'list') {
        setCurrentView('list');
      }
    };
    window.addEventListener('tct_switch_tab' as any, handleSwitchTab);
    return () => {
      window.removeEventListener('tct_switch_tab' as any, handleSwitchTab);
    };
  }, []);

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
        return 'Revisión y emisión de cotización membretada TCT y aprobación de propuesta';
      case 2:
        return project && project.initialDeposit > 0 ? 'Voucher de adelanto recibido y validado en tesorería' : 'Recepción y validación de voucher de adelanto inicial (50%)';
      case 3:
        return 'Firma formal del contrato de prestación de servicios y acuerdo legal';
      case 4:
        return 'Diseño del arte gráfico del flyer publicitario y aprobación del cliente';
      case 5:
        return 'Asignación de personal técnico (cámaras, dron, audio) y transporte';
      case 6:
        return 'Llegada a locación, calibración técnica, audio y cobertura audiovisual';
      case 7:
        return project && project.finalBalance > 0 ? '⚠️ Cobro obligatorio de saldo en campo antes de las 7:00 PM' : 'Validación de saldo cancelado S/. 0.00 en campo';
      case 8:
        return 'Ingesta RAW y backup dual en NAS con checksum MD5';
      case 9:
        return 'Edición Video Master 4K y USB personalizado (Plazo 15 Días)';
      case 10:
        return 'Publicación de enlaces oficiales en YouTube, TikTok y redes';
      case 11:
        return 'Diagramación e impresión de Fotolibro Premium (Plazo 30 Días)';
      case 12:
        return 'Entrega final, liquidación a S/. 0 y Acta de Conformidad';
      default:
        return 'Completar evidencias del paso en curso';
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

  // Helper functions for extended Quick Filters
  const isDueThisWeek = (p: ProductionProject) => {
    if (!p.eventDate) return false;
    const evDate = new Date(p.eventDate + 'T00:00:00');
    const now = new Date();
    const diffTime = evDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= -1 && diffDays <= 7;
  };

  const isHighPriority = (p: ProductionProject) => {
    return isProjectOverdue(p) || p.finalBalance >= 1500 || isDueThisWeek(p);
  };

  const isWaitingApproval = (p: ProductionProject) => {
    const milestone = getCurrentMilestone(p);
    return milestone.stepNumber <= 3 && !p.isArchived;
  };

  // Counts for Grouping Tabs & Quick Filter Chips
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
  const countDueThisWeek = projects.filter(p => isDueThisWeek(p) && !p.isArchived).length;
  const countHighPriority = projects.filter(p => isHighPriority(p) && !p.isArchived).length;
  const countWaitingApproval = projects.filter(p => isWaitingApproval(p)).length;

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
    } else if (groupFilter === 'due_this_week') {
      matchesGroup = isDueThisWeek(p) && !p.isArchived;
    } else if (groupFilter === 'high_priority') {
      matchesGroup = isHighPriority(p) && !p.isArchived;
    } else if (groupFilter === 'waiting_approval') {
      matchesGroup = isWaitingApproval(p);
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

  const handleQuickFilterSelect = (filter: MainGrouping) => {
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
              onClick={() => setCurrentView('timeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                currentView === 'timeline' 
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Cronograma Gantt</span>
              <span className="text-[10px] bg-slate-950/15 text-slate-900 px-1.5 py-0.2 rounded-full font-mono font-bold">
                12 Pasos
              </span>
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
              onClick={() => setCurrentView('ranking')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                currentView === 'ranking' 
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Comparativa Mensual</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-900 px-1.5 py-0.2 rounded-full font-mono font-bold">
                Asesores
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
          <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1.5">
            {/* Botón de Exportación PDF Oficial TCT */}
            <button
              onClick={() => {
                setPdfReportType('projects_list');
                setIsPdfModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all border border-slate-700 cursor-pointer"
              title="Exportar a PDF Oficial TCT (Expedientes, Cronograma Gantt, KPI, Calendario, Cobranzas)"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Exportar a PDF</span>
            </button>

            <button
              onClick={onOpenAnalytics}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Toma de Decisiones</span>
            </button>

            {/* Ver Calendario Button beside Nueva Producción */}
            <button
              onClick={() => setCurrentView('calendar')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all border cursor-pointer ${
                currentView === 'calendar'
                  ? 'bg-slate-950 text-amber-400 border-amber-400 ring-2 ring-amber-400/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400'
              }`}
              title="Ver Calendario de Fechas de Evento"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Ver Calendario</span>
            </button>

            <button
              onClick={onOpenNewProject}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nueva Producción</span>
            </button>
          </div>

        </div>

        {/* Agrupador Principal & Filtros Rápidos de Producciones */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5 text-xs font-bold">
              <span className="text-slate-500 font-extrabold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-amber-600" /> Filtros Rápidos:
              </span>

              {/* Tab 1: Todas */}
              <button
                onClick={() => setGroupFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  groupFilter === 'overdue'
                    ? 'bg-red-600 text-white shadow-xs font-black'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>Por Vencer / Alertas SLA</span>
                {countOverdue > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-800 text-white animate-pulse font-black">
                    {countOverdue}
                  </span>
                )}
              </button>

              {/* Tab 3: Esta Semana (Due This Week) */}
              <button
                onClick={() => setGroupFilter('due_this_week')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  groupFilter === 'due_this_week'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
                <span>Esta Semana</span>
                {countDueThisWeek > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-800 text-white font-black">
                    {countDueThisWeek}
                  </span>
                )}
              </button>

              {/* Tab 4: Alta Prioridad (High Priority) */}
              <button
                onClick={() => setGroupFilter('high_priority')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  groupFilter === 'high_priority'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Alta Prioridad</span>
                {countHighPriority > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-600 text-white font-black">
                    {countHighPriority}
                  </span>
                )}
              </button>

              {/* Tab 5: Por Aprobar / Contratos */}
              <button
                onClick={() => setGroupFilter('waiting_approval')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  groupFilter === 'waiting_approval'
                    ? 'bg-purple-600 text-white shadow-xs font-black'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-purple-500" />
                <span>Por Aprobar</span>
                {countWaitingApproval > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-800 text-white font-black">
                    {countWaitingApproval}
                  </span>
                )}
              </button>

              {/* Tab 6: Pendientes / En Proceso */}
              <button
                onClick={() => setGroupFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  groupFilter === 'pending' || groupFilter === 'in_progress'
                    ? 'bg-slate-800 text-amber-400 shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>En Curso</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-amber-300 font-black">
                  {countInProgress}
                </span>
              </button>

              {/* Tab 7: Completadas */}
              <button
                onClick={() => setGroupFilter('completed')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  groupFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Completadas</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-700 text-white">
                  {countCompleted}
                </span>
              </button>

              {/* Tab 8: Por Fase */}
              <button
                onClick={() => setGroupFilter('phase_specific')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  groupFilter === 'phase_specific'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-500" />
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

      {/* Main View: List of Projects vs Executive Summary vs Calendar vs Timeline Gantt vs Ranking */}
      {currentView === 'timeline' ? (
        <TimelineGanttView
          projects={projects}
          onOpenProject={onOpenProject}
          onOpenReport={onOpenReportPrint}
        />
      ) : currentView === 'executive' ? (
        <ExecutiveSummaryModule
          projects={projects}
          onOpenProject={onOpenProject}
          onOpenReportPrint={onOpenReportPrint}
        />
      ) : currentView === 'ranking' ? (
        <div className="space-y-6">
          <MonthlyStaffContractComparisonChart
            projects={projects}
            allStaff={allStaff}
            onOpenProject={onOpenProject}
          />
        </div>
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
              <button
                type="button"
                onClick={() => setShowTimelineChart(!showTimelineChart)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                  showTimelineChart
                    ? 'bg-slate-900 text-amber-400 border-slate-800 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Mostrar u ocultar gráfico Recharts de superposición de cronogramas"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                <span>{showTimelineChart ? 'Ocultar Gráfico' : 'Ver Cronología Visual'}</span>
              </button>

              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-black">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                Flujo Oficial TCT Activo
              </span>
            </div>
          </div>

          {/* Recharts Overlap & Production Schedule Bar Chart */}
          {showTimelineChart && filteredProjects.length > 0 && (
            <div className="bg-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">
                      Cronología Visual y Superposición de Producciones (Recharts)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Muestra el avance de hitos (%) y presupuesto por producción ordenado por fecha de evento (formato dd/mm/aa)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTimelineChart(false)}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  ✕ Cerrar
                </button>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredProjects.map((p) => {
                      const { percent } = getProjectProgress(p);
                      return {
                        codigo: p.uniqueCode,
                        titulo: p.title.length > 20 ? p.title.substring(0, 18) + '...' : p.title,
                        fecha: formatDateDDMMAA(p.eventDate),
                        avance: percent,
                        presupuesto: p.totalBudget,
                        saldo: p.finalBalance,
                        tipo: p.eventType
                      };
                    })}
                    margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis
                      dataKey="codigo"
                      stroke="#94a3b8"
                      tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#cbd5e1', fontSize: 11 }}
                      domain={[0, 100]}
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-white">
                              <div className="font-black text-amber-400">{data.codigo} - {data.titulo}</div>
                              <div className="text-slate-300">📅 Evento: <span className="text-white font-bold">{data.fecha}</span></div>
                              <div className="text-slate-300">⚡ Avance: <span className="text-emerald-400 font-bold">{data.avance}%</span></div>
                              <div className="text-slate-300">💰 Presupuesto: <span className="text-white font-bold">S/. {data.presupuesto.toLocaleString()}</span></div>
                              <div className="text-slate-300">Saldo Pendiente: <span className={data.saldo === 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>S/. {data.saldo.toLocaleString()}</span></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avance" name="Avance de Pasos (%)" radius={[6, 6, 0, 0]}>
                      {filteredProjects.map((p, index) => {
                        const { percent } = getProjectProgress(p);
                        const isOverdue = isProjectOverdue(p);
                        let fillColor = '#f59e0b';
                        if (isOverdue) fillColor = '#ef4444';
                        else if (percent === 100) fillColor = '#10b981';
                        else if (percent >= 50) fillColor = '#06b6d4';
                        return <Cell key={`cell-${index}`} fill={fillColor} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
                No hay producciones que coincidan con los filtros seleccionados.
              </div>
            ) : (
              filteredProjects.map((project, pIdx) => {
                const { total, done } = getProjectProgress(project);
                const progressInfo = getProjectProgressInfo(project);
                const isToday = project.eventDate === todayStr;
                const isZeroBalance = project.finalBalance === 0;
                const milestone = getCurrentMilestone(project);
                const isOverdue = isProjectOverdue(project);
                const missingActionAlert = getStepMissingActionAlert(milestone.stepNumber, milestone.step, project);
                const isActivelyWorking = !project.isArchived && progressInfo.percentage < 100;

                return (
                  <div 
                    key={project.id || `proj-${project.uniqueCode || pIdx}`}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                      isOverdue
                        ? 'bg-gradient-to-r from-red-100/90 via-slate-100 to-red-100/80 border-red-300'
                        : isActivelyWorking 
                        ? 'bg-gradient-to-r from-slate-200/95 via-slate-100 to-slate-200/95 border-slate-300' 
                        : 'bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 border-slate-300'
                    }`}
                  >
                    
                    {/* Left Column: Codes, Title, Client, Location, Tags */}
                    <div className="flex-1 space-y-2.5 min-w-0">
                      
                      {/* Linked Codes Badge Group */}
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        
                        {/* Quotation linked with Contract */}
                        <div className="flex items-center bg-slate-900 text-white rounded-xl p-0.5 border border-slate-700 shadow-xs">
                          {project.quotationCode && (
                            <span className="font-mono text-xs font-black px-2.5 py-0.5 text-amber-300 border-r border-slate-700 flex items-center gap-1" title="Código de Cotización">
                              <Receipt className="w-3 h-3 text-amber-400" />
                              {project.quotationCode}
                            </span>
                          )}
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 text-slate-100 flex items-center gap-1" title="Código de Contrato Oficial">
                            <FileCheck className="w-3 h-3 text-emerald-400" />
                            {project.contractNumber}
                          </span>
                        </div>

                        <span className="font-mono text-xs font-black bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-lg border border-amber-300">
                          {project.uniqueCode}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
                          {project.eventType}
                        </span>

                        {isToday && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white animate-pulse shadow-xs">
                            🔴 EVENTO HOY (Cobro 7:00 PM)
                          </span>
                        )}

                        {isOverdue && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white shadow-xs flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> VENCIDO DE PLAZO
                          </span>
                        )}
                      </div>

                      {/* Project Title */}
                      <h4 
                        onClick={() => onOpenProject(project)}
                        className="text-base sm:text-lg font-black text-slate-950 hover:text-amber-700 cursor-pointer transition-colors leading-snug tracking-tight"
                      >
                        {project.title}
                      </h4>

                      {/* Contract Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate"><strong>Asesor / Contrato:</strong> {project.contractHolder || 'Ing. Roberto Acuña'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate"><strong>Cliente:</strong> {project.clientName} ({project.clientPhone})</span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span><strong>Fecha:</strong> {formatDateDDMMAA(project.eventDate)} ({project.eventTime || 'Horario pactado'})</span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate"><strong>Locación:</strong> {project.eventLocation}</span>
                        </div>
                      </div>

                      {/* Package and extra info pills */}
                      <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1 pt-0.5">
                        {project.selectedPackageName && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-bold border border-amber-200">
                            📦 {project.selectedPackageName}
                          </span>
                        )}
                        {project.discountAmount && project.discountAmount > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-black border border-emerald-300 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-emerald-700" />
                            Desc. S/. {project.discountAmount} {project.discountReason ? `(${project.discountReason})` : ''}
                          </span>
                        ) : null}
                        {project.extraHoursCount && project.extraHoursCount > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-900 font-bold border border-purple-300">
                            ⏱ +{project.extraHoursCount} hrs extra
                          </span>
                        ) : null}
                      </div>

                    </div>

                    {/* Compact, Highly Intuitive Dark Card: (Porcentaje, Hito Actual Parpadeante Fuerte, Alerta de lo que Falta) */}
                    <div className="w-full xl:w-92 bg-slate-950 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-2.5 shadow-xl shrink-0">
                      
                      {/* Top row of card: Milestone Badge & Big % */}
                      <div className="flex items-center justify-between gap-2">
                        
                        {/* Hito Actual: STRONGLY PULSING & HIGHLIGHTED */}
                        <div className="min-w-0 flex-1">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black shadow-md ${
                            progressInfo.isStep3Blinking 
                              ? 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white animate-pulse border border-amber-300' 
                              : 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950'
                          }`}>
                            <Zap className="w-3.5 h-3.5 text-slate-950" />
                            <span>⚡ Paso {progressInfo.isStep3Blinking ? 3 : milestone.stepNumber} /12</span>
                          </div>
                          <div className="text-xs font-black text-white truncate block mt-1" title={progressInfo.isStep3Blinking ? 'Firma de Contrato (Adjuntos requeridos)' : milestone.title}>
                            {progressInfo.isStep3Blinking ? 'Firma de Contrato (Adjuntos requeridos)' : milestone.title}
                          </div>
                        </div>

                        {/* Big font percentage with 2 decimals nn.nn% and strikethrough if isStrikethrough / !isValidated */}
                        <div className="text-right shrink-0">
                          {progressInfo.isStrikethrough ? (
                            <div className="text-xl sm:text-2xl font-black text-slate-400 font-mono leading-none flex items-center justify-end gap-1.5" title="Avance al 25.00% en revisión: se deben adjuntar los sustentos en los pasos 1, 2 y 3">
                              <span className="text-[9px] bg-red-950 text-red-300 px-1 py-0.5 rounded border border-red-800 font-sans">⚠️ En revisión</span>
                              <span className="line-through decoration-red-500 decoration-2">{progressInfo.formattedPercentage}</span>
                            </div>
                          ) : progressInfo.isValidated ? (
                            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono leading-none">
                              {progressInfo.formattedPercentage}
                            </div>
                          ) : (
                            <div className="text-lg sm:text-xl font-black text-red-400 font-mono leading-none flex items-center justify-end gap-1" title="Avance bloqueado: faltan adjuntos técnicos">
                              <span className="text-[9px] bg-red-950 text-red-300 px-1 py-0.5 rounded border border-red-800 font-sans">❌ Bloqueado</span>
                              <span className="line-through opacity-75">{progressInfo.formattedPercentage}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded font-mono border border-slate-700 block mt-1">
                            {done} /12 pasos
                          </span>
                        </div>

                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden p-0.2 border border-slate-700">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            progressInfo.isValidated
                              ? 'bg-gradient-to-r from-amber-400 via-teal-400 to-emerald-400'
                              : 'bg-gradient-to-r from-red-500 to-amber-500 opacity-60'
                          }`}
                          style={{ width: `${progressInfo.percentage}%` }}
                        />
                      </div>

                      {/* ALERTA DE LO QUE FALTA PARA EL SIGUIENTE PASO */}
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-[11px] flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-amber-200 leading-tight font-medium">
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

                    {/* Right Column: Actions (Contrato, Informe, Ver 12 Pasos, Borrar) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex xl:flex-col items-stretch justify-end gap-1.5 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-300">
                      
                      {/* Export Contract Button */}
                      <button
                        onClick={() => onOpenContractExport(project)}
                        className="min-h-[44px] xl:min-h-0 xl:flex-initial px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 transition-all text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        title="Ver y Exportar Contrato Oficial con datos rellenados"
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span>Contrato</span>
                      </button>

                      {/* PDF Report */}
                      <button
                        onClick={() => onOpenReportPrint(project)}
                        className="min-h-[44px] xl:min-h-0 xl:flex-initial px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 active:scale-95 text-slate-900 transition-colors text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-300 shadow-xs cursor-pointer"
                        title="Exportar Reporte de Auditoría TCT"
                      >
                        <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Informe</span>
                      </button>

                      {/* Open 12 Steps Modal */}
                      <button
                        onClick={() => onOpenProject(project)}
                        className="min-h-[44px] xl:min-h-0 xl:flex-initial px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-400 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-amber-500/30"
                      >
                        <Eye className="w-4 h-4 shrink-0" />
                        <span>12 Pasos</span>
                      </button>

                      {/* Delete individual project button */}
                      {onDeleteProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(project.id);
                          }}
                          className="col-span-2 sm:col-span-3 xl:col-span-1 min-h-[40px] xl:min-h-0 xl:flex-initial px-2.5 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/25 active:scale-95 text-red-700 hover:text-red-800 transition-all text-[11px] font-bold flex items-center justify-center gap-1 border border-red-200 cursor-pointer"
                          title="Eliminar este contrato/expediente de la base de datos"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>Eliminar Expediente</span>
                        </button>
                      )}
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
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
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

      {/* Global Official PDF Report Modal for Corporacion TCT */}
      {isPdfModalOpen && (
        <GlobalPdfExportModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          projects={projects}
          staffList={allStaff}
          reportType={pdfReportType}
        />
      )}

    </div>
  );
};
