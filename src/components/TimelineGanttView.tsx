import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProductionProject, EventType, StepData, PhaseData } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Filter, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  Layers, 
  Film, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  Flame, 
  CalendarDays, 
  Maximize2, 
  ArrowRight,
  Printer,
  ChevronLeft,
  Zap,
  Tag,
  Download,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { formatDateDDMMAA } from '../utils/dateFormatter';

interface TimelineGanttViewProps {
  projects: ProductionProject[];
  onOpenProject: (project: ProductionProject) => void;
  onOpenReport?: (project: ProductionProject) => void;
  onOpenStepDetail?: (project: ProductionProject, stepNumber: number) => void;
}

type TimeScale = 'days' | 'weeks' | 'months';

interface GanttTaskItem {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  clientName: string;
  eventType: EventType;
  stepNumber: number;
  stepTitle: string;
  phaseNumber: number;
  phaseName: string;
  phaseColor: string;
  startDate: Date;
  endDate: Date;
  status: 'completed' | 'in_progress' | 'pending' | 'alert';
  progress: number;
  isMilestone?: boolean;
  slaDays?: number;
  assignedStaffNames?: string;
}

export const TimelineGanttView: React.FC<TimelineGanttViewProps> = ({
  projects,
  onOpenProject,
  onOpenReport,
  onOpenStepDetail
}) => {
  const [timeScale, setTimeScale] = useState<TimeScale>('days');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'overdue' | 'completed'>('all');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [hoveredTask, setHoveredTask] = useState<GanttTaskItem | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScale, setExportScale] = useState<'days' | 'months'>('days');
  const [exportExpanded, setExportExpanded] = useState<boolean>(true);
  const [exportStatusFilter, setExportStatusFilter] = useState<string>('all');

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Toggle collapse for project
  const toggleProjectCollapse = (projectId: string) => {
    setCollapsedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Expand / Collapse all
  const expandAll = () => setCollapsedProjects({});
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    projects.forEach(p => { allCollapsed[p.id] = true; });
    setCollapsedProjects(allCollapsed);
  };

  // Convert project phases and steps into scheduled Gantt tasks
  const projectTasks = useMemo(() => {
    const list: { project: ProductionProject; tasks: GanttTaskItem[] }[] = [];

    projects.forEach(project => {
      // Calculate realistic date boundaries based on eventDate and SLAs
      const eventDateObj = new Date(project.eventDate + 'T00:00:00');
      if (isNaN(eventDateObj.getTime())) return;

      const tasks: GanttTaskItem[] = [];

      // Phase 1: Pre-producción (14 to 3 days before event)
      const p1Start = new Date(eventDateObj);
      p1Start.setDate(p1Start.getDate() - 14);
      const p1Step1End = new Date(eventDateObj);
      p1Step1End.setDate(p1Step1End.getDate() - 7);
      const p1Step2End = new Date(eventDateObj);
      p1Step2End.setDate(p1Step2End.getDate() - 3);

      // Phase 2: Logística y Almacén (3 to 0 days before event)
      const p2Step3Start = new Date(eventDateObj);
      p2Step3Start.setDate(p2Step3Start.getDate() - 3);
      const p2Step3End = new Date(eventDateObj);
      p2Step3End.setDate(p2Step3End.getDate() - 1);
      const p2Step4Start = new Date(eventDateObj);
      p2Step4Start.setDate(p2Step4Start.getDate() - 1);
      const p2Step4End = new Date(eventDateObj);

      // Phase 3: Rodaje & Cobro (Day 0 of event)
      const p3EventStart = new Date(eventDateObj);
      const p3EventEnd = new Date(eventDateObj);
      p3EventEnd.setDate(p3EventEnd.getDate() + 1);

      // Phase 4: Ingest, Backup Dual & Edición Master (Day +1 to +15)
      const p4IngestStart = new Date(eventDateObj);
      p4IngestStart.setDate(p4IngestStart.getDate() + 1);
      const p4IngestEnd = new Date(eventDateObj);
      p4IngestEnd.setDate(p4IngestEnd.getDate() + 2);

      const p4EditStart = new Date(eventDateObj);
      p4EditStart.setDate(p4EditStart.getDate() + 2);
      const p4EditEnd = new Date(eventDateObj);
      p4EditEnd.setDate(p4EditEnd.getDate() + 15); // 15 Days SLA

      // Phase 5: Redes & Fotolibro (Day +15 to +30)
      const p5SocialStart = new Date(eventDateObj);
      p5SocialStart.setDate(p5SocialStart.getDate() + 15);
      const p5SocialEnd = new Date(eventDateObj);
      p5SocialEnd.setDate(p5SocialEnd.getDate() + 18);

      const p5BookStart = new Date(eventDateObj);
      p5BookStart.setDate(p5BookStart.getDate() + 15);
      const p5BookEnd = new Date(eventDateObj);
      p5BookEnd.setDate(p5BookEnd.getDate() + (project.includesPhotobook ? 30 : 20)); // 30 Days SLA

      // Phase 6: Entrega Final & Purga (Day +30 to +45)
      const p6DeliveryStart = new Date(p5BookEnd);
      const p6DeliveryEnd = new Date(p6DeliveryStart);
      p6DeliveryEnd.setDate(p6DeliveryEnd.getDate() + 5);

      const p6PurgeStart = new Date(p6DeliveryEnd);
      const p6PurgeEnd = new Date(p6PurgeStart);
      p6PurgeEnd.setDate(p6PurgeEnd.getDate() + 7);

      // Map step definitions to actual dates
      const stepDateMap: Record<number, { start: Date; end: Date; milestone?: boolean; sla?: number }> = {
        1: { start: p1Start, end: p1Step1End },
        2: { start: p1Step1End, end: p1Step2End },
        3: { start: p2Step3Start, end: p2Step3End },
        4: { start: p2Step4Start, end: p2Step4End },
        5: { start: p3EventStart, end: p3EventStart },
        6: { start: p3EventStart, end: p3EventEnd, milestone: true },
        7: { start: p3EventStart, end: p3EventEnd, milestone: true },
        8: { start: p4IngestStart, end: p4IngestEnd },
        9: { start: p4EditStart, end: p4EditEnd, milestone: true, sla: 15 },
        10: { start: p5SocialStart, end: p5SocialEnd },
        11: { start: p5BookStart, end: p5BookEnd, milestone: true, sla: 30 },
        12: { start: p6DeliveryStart, end: p6PurgeEnd, milestone: true }
      };

      project.phases.forEach(phase => {
        phase.steps.forEach(step => {
          const mapping = stepDateMap[step.stepNumber] || { start: eventDateObj, end: eventDateObj };
          
          // Compute step progress
          let taskProgress = 0;
          if (step.status === 'completed') {
            taskProgress = 100;
          } else if (step.status === 'in_progress') {
            const totalChecks = step.checklist?.length || 1;
            const doneChecks = step.checklist?.filter(c => c.completed).length || 0;
            taskProgress = Math.max(25, Math.round((doneChecks / totalChecks) * 100));
          }

          // Check if task is overdue
          let currentStatus: 'completed' | 'in_progress' | 'pending' | 'alert' = step.status;
          if (step.status !== 'completed' && today > mapping.end) {
            currentStatus = 'alert';
          }

          tasks.push({
            id: `${project.id}-step-${step.stepNumber}`,
            projectId: project.id,
            projectCode: project.uniqueCode,
            projectTitle: project.title,
            clientName: project.clientName,
            eventType: project.eventType,
            stepNumber: step.stepNumber,
            stepTitle: step.title,
            phaseNumber: phase.phaseNumber,
            phaseName: phase.name,
            phaseColor: phase.color,
            startDate: mapping.start,
            endDate: mapping.end,
            status: currentStatus,
            progress: taskProgress,
            isMilestone: mapping.milestone,
            slaDays: mapping.sla,
            assignedStaffNames: project.assignedStaff.map(s => s.name).join(', ')
          });
        });
      });

      list.push({ project, tasks });
    });

    return list;
  }, [projects, today]);

  // Overall date boundaries for the chart
  const { minDate, maxDate, totalDays } = useMemo(() => {
    let min = new Date(today);
    min.setDate(min.getDate() - 30);
    let max = new Date(today);
    max.setDate(max.getDate() + 60);

    projectTasks.forEach(({ tasks }) => {
      tasks.forEach(t => {
        if (t.startDate < min) min = new Date(t.startDate);
        if (t.endDate > max) max = new Date(t.endDate);
      });
    });

    // Pad margins
    min = new Date(min);
    min.setDate(min.getDate() - 5);
    max = new Date(max);
    max.setDate(max.getDate() + 10);

    const diffTime = Math.abs(max.getTime() - min.getTime());
    const total = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 90;

    return { minDate: min, maxDate: max, totalDays: total };
  }, [projectTasks, today]);

  // Generate timeline date columns based on scale
  const timeColumns = useMemo(() => {
    const cols: { date: Date; label: string; subLabel: string; isToday: boolean; isWeekend: boolean }[] = [];
    const curr = new Date(minDate);

    while (curr <= maxDate) {
      const dateCopy = new Date(curr);
      const isTodayDate = dateCopy.toISOString().split('T')[0] === todayStr;
      const isWeekendDay = dateCopy.getDay() === 0 || dateCopy.getDay() === 6;

      let label = '';
      let subLabel = '';

      if (timeScale === 'days') {
        label = dateCopy.toLocaleDateString('es-PE', { day: '2-digit' });
        subLabel = dateCopy.toLocaleDateString('es-PE', { weekday: 'narrow' }).toUpperCase();
      } else if (timeScale === 'weeks') {
        label = `Sem ${Math.ceil(dateCopy.getDate() / 7)}`;
        subLabel = dateCopy.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
      } else {
        label = dateCopy.toLocaleDateString('es-PE', { month: 'short' }).toUpperCase();
        subLabel = dateCopy.getFullYear().toString();
      }

      cols.push({
        date: dateCopy,
        label,
        subLabel,
        isToday: isTodayDate,
        isWeekend: isWeekendDay
      });

      curr.setDate(curr.getDate() + (timeScale === 'days' ? 1 : timeScale === 'weeks' ? 7 : 30));
    }

    return cols;
  }, [minDate, maxDate, timeScale, todayStr]);

  // Column width based on scale
  const colWidth = timeScale === 'days' ? 42 : timeScale === 'weeks' ? 84 : 120;
  const totalChartWidth = Math.max(1200, timeColumns.length * colWidth);

  // Position calculation helper
  const getXPosition = (date: Date): number => {
    const diffDays = (date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const dayRatio = diffDays / totalDays;
    return Math.max(0, dayRatio * totalChartWidth);
  };

  const todayX = getXPosition(today);

  // Filtered projects
  const filteredProjectTasks = useMemo(() => {
    return projectTasks.filter(({ project, tasks }) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        project.title.toLowerCase().includes(q) ||
        project.uniqueCode.toLowerCase().includes(q) ||
        project.clientName.toLowerCase().includes(q);

      const matchesType = selectedEventType === 'all' || project.eventType === selectedEventType;

      let matchesStatus = true;
      const isCompleted = tasks.every(t => t.status === 'completed');
      const hasAlert = tasks.some(t => t.status === 'alert');
      const isInProgress = tasks.some(t => t.status === 'in_progress');

      if (statusFilter === 'completed') matchesStatus = isCompleted;
      else if (statusFilter === 'overdue') matchesStatus = hasAlert;
      else if (statusFilter === 'in_progress') matchesStatus = isInProgress && !isCompleted;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [projectTasks, searchQuery, selectedEventType, statusFilter]);

  // Summary Metrics
  const summaryStats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;
    let upcomingShootsThisMonth = 0;

    projectTasks.forEach(({ project, tasks }) => {
      const eventDate = new Date(project.eventDate);
      if (eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear()) {
        upcomingShootsThisMonth++;
      }
      tasks.forEach(t => {
        totalTasks++;
        if (t.status === 'completed') completedTasks++;
        if (t.status === 'in_progress') inProgressTasks++;
        if (t.status === 'alert') overdueTasks++;
      });
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects: projectTasks.length,
      upcomingShootsThisMonth,
      inProgressTasks,
      overdueTasks,
      completionRate
    };
  }, [projectTasks, today]);

  // Auto-scroll to today marker on initial render
  useEffect(() => {
    if (timelineContainerRef.current) {
      const scrollPos = Math.max(0, todayX - 350);
      timelineContainerRef.current.scrollLeft = scrollPos;
    }
  }, [timeScale, todayX]);

  const scrollToToday = () => {
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollTo({
        left: Math.max(0, todayX - 350),
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Producciones</div>
            <div className="text-xl font-black text-white font-mono">{summaryStats.totalProjects}</div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rodajes Este Mes</div>
            <div className="text-xl font-black text-blue-300 font-mono">{summaryStats.upcomingShootsThisMonth}</div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pasos en Curso</div>
            <div className="text-xl font-black text-amber-400 font-mono">{summaryStats.inProgressTasks}</div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alertas SLA / Vencidos</div>
            <div className="text-xl font-black text-red-400 font-mono">{summaryStats.overdueTasks}</div>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar (Scale, Filters, Search & Navigation) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        
        {/* Left: Search & Filter dropdowns */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, evento o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">Todos los Eventos</option>
            <option value="Boda">Boda</option>
            <option value="XV Años">XV Años</option>
            <option value="Evento Corporativo">Evento Corporativo</option>
            <option value="Graduación">Graduación</option>
            <option value="Concierto / Festival">Concierto / Festival</option>
            <option value="Bautizo / Primera Comunión">Bautizo / Comunión</option>
            <option value="Spot Publicitario">Spot Publicitario</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="in_progress">En Curso</option>
            <option value="overdue">Con Alertas SLA</option>
            <option value="completed">Completados</option>
          </select>
        </div>

        {/* Right: Scale switchers, collapse and center today */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1.5">
          {/* Zoom scale */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTimeScale('days')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                timeScale === 'days' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Días
            </button>
            <button
              onClick={() => setTimeScale('weeks')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                timeScale === 'weeks' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semanas
            </button>
            <button
              onClick={() => setTimeScale('months')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                timeScale === 'months' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Meses
            </button>
          </div>

          <button
            onClick={scrollToToday}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all"
            title="Centrar en el día de hoy"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Ir a Hoy</span>
          </button>

          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            title="Expandir todas las tareas"
          >
            Expandir
          </button>

          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Colapsar todo a nivel proyecto"
          >
            Colapsar
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            title="Exportar Diagrama Gantt con filtros de día, mes, expandido o colapsado"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Gantt</span>
          </button>
        </div>

      </div>

      {/* 3. Gantt Chart Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        
        {/* Main Gantt Body: Left Sidebar + Right Horizontal Scrollable Canvas */}
        <div className="flex divide-x divide-slate-200 overflow-hidden min-h-[580px]">
          
          {/* Left Column: Fixed Project & Tasks Tree List */}
          <div className="w-80 sm:w-96 shrink-0 bg-slate-50/70 flex flex-col">
            
            {/* Tree header */}
            <div className="h-14 px-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-black">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Expedientes & Flujo 12 Pasos</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full border border-slate-700">
                {filteredProjectTasks.length} proyectos
              </span>
            </div>

            {/* Tree items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80 max-h-[700px]">
              {filteredProjectTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No hay proyectos que coincidan con la búsqueda.
                </div>
              ) : (
                filteredProjectTasks.map(({ project, tasks }) => {
                  const isCollapsed = Boolean(collapsedProjects[project.id]);
                  const completedSteps = tasks.filter(t => t.status === 'completed').length;
                  const percent = Math.round((completedSteps / 12) * 100);

                  return (
                    <div key={project.id} className="bg-white">
                      
                      {/* Project Header Row */}
                      <div 
                        className="p-3 bg-slate-100/90 hover:bg-slate-200/70 cursor-pointer flex items-center justify-between gap-2 border-b border-slate-200 transition-colors"
                        onClick={() => toggleProjectCollapse(project.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button className="p-0.5 text-slate-500 hover:text-slate-900">
                            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-extrabold bg-slate-900 text-amber-400 px-1.5 py-0.2 rounded">
                                {project.uniqueCode}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 truncate">
                                {project.eventType}
                              </span>
                            </div>
                            <h5 className="text-xs font-black text-slate-900 truncate leading-tight mt-0.5" title={project.title}>
                              {project.title}
                            </h5>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black font-mono text-amber-600">
                            {percent}%
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenProject(project);
                            }}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs transition-colors"
                            title="Abrir expediente completo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Child Steps List (When not collapsed) */}
                      {!isCollapsed && (
                        <div className="divide-y divide-slate-100 bg-white">
                          {tasks.map(task => {
                            const isOverdue = task.status === 'alert';
                            const isInProgress = task.status === 'in_progress';
                            const isCompleted = task.status === 'completed';

                            return (
                              <div
                                key={task.id}
                                onClick={() => onOpenStepDetail ? onOpenStepDetail(project, task.stepNumber) : onOpenProject(project)}
                                onMouseEnter={() => setHoveredTask(task)}
                                onMouseLeave={() => setHoveredTask(null)}
                                className={`px-4 py-2 text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                  hoveredTask?.id === task.id ? 'bg-amber-50' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                    isCompleted 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                      : isInProgress 
                                      ? 'bg-amber-100 text-amber-900 border border-amber-400 animate-pulse' 
                                      : isOverdue 
                                      ? 'bg-red-100 text-red-800 border border-red-300' 
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {task.stepNumber}
                                  </span>

                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-800 truncate" title={task.stepTitle}>
                                      {task.stepTitle}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {task.startDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })} - {task.endDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                  </div>
                                </div>

                                {task.slaDays && (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-mono shrink-0">
                                    SLA {task.slaDays}D
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column: Interactive Gantt Chart Canvas */}
          <div 
            ref={timelineContainerRef}
            className="flex-1 overflow-x-auto overflow-y-auto relative max-h-[754px] select-none bg-slate-50/40"
          >
            <div style={{ width: totalChartWidth }} className="relative min-h-full">
              
              {/* 1. Header Row of Dates */}
              <div className="sticky top-0 z-30 h-14 bg-slate-900 border-b border-slate-800 flex shadow-sm">
                {timeColumns.map((col, idx) => (
                  <div
                    key={idx}
                    style={{ width: colWidth }}
                    className={`h-full border-r border-slate-800 flex flex-col items-center justify-center text-center shrink-0 ${
                      col.isToday ? 'bg-amber-500/20 text-amber-300 font-black' : col.isWeekend ? 'bg-slate-950/40 text-slate-400' : 'text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-black">{col.label}</span>
                    <span className="text-[9px] font-mono text-slate-400">{col.subLabel}</span>
                  </div>
                ))}
              </div>

              {/* 2. Today Marker Line spanning vertically */}
              <div
                style={{ left: todayX }}
                className="absolute top-0 bottom-0 z-20 w-0.5 bg-gradient-to-b from-red-500 via-red-500 to-transparent pointer-events-none"
              >
                <div className="sticky top-1.5 -left-8 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md whitespace-nowrap transform -translate-x-1/2">
                  📍 HOY ({todayStr})
                </div>
              </div>

              {/* 3. Gantt Rows mapping to each project & step */}
              <div className="divide-y divide-slate-200/80">
                {filteredProjectTasks.map(({ project, tasks }) => {
                  const isCollapsed = Boolean(collapsedProjects[project.id]);

                  // Project overall span
                  const projStart = tasks[0]?.startDate || minDate;
                  const projEnd = tasks[tasks.length - 1]?.endDate || maxDate;
                  const projLeft = getXPosition(projStart);
                  const projWidth = Math.max(80, getXPosition(projEnd) - projLeft);

                  return (
                    <div key={project.id} className="relative">
                      
                      {/* Project Summary Bar Row */}
                      <div className="h-14 flex items-center relative bg-slate-100/50 border-b border-slate-200">
                        
                        {/* Summary project bar */}
                        <div
                          style={{ left: projLeft, width: projWidth }}
                          onClick={() => onOpenProject(project)}
                          className="absolute h-7 rounded-xl bg-slate-900 text-amber-300 px-3 flex items-center justify-between text-xs font-black shadow-md cursor-pointer hover:bg-slate-800 transition-all border border-slate-700"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                            <span className="truncate">{project.title}</span>
                          </div>
                          <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-white ml-2">
                            {project.eventDate}
                          </span>
                        </div>

                      </div>

                      {/* Step Task Bars (When expanded) */}
                      {!isCollapsed && (
                        <div className="divide-y divide-slate-100">
                          {tasks.map(task => {
                            const taskLeft = getXPosition(task.startDate);
                            const taskEndPos = getXPosition(task.endDate);
                            const taskWidth = Math.max(34, taskEndPos - taskLeft);

                            const isCompleted = task.status === 'completed';
                            const isInProgress = task.status === 'in_progress';
                            const isOverdue = task.status === 'alert';

                            return (
                              <div
                                key={task.id}
                                className={`h-10 flex items-center relative transition-colors ${
                                  hoveredTask?.id === task.id ? 'bg-amber-50/50' : 'hover:bg-slate-50/60'
                                }`}
                                onMouseEnter={() => setHoveredTask(task)}
                                onMouseLeave={() => setHoveredTask(null)}
                              >
                                
                                {/* Background grid guides */}
                                {timeColumns.map((col, cIdx) => (
                                  <div
                                    key={cIdx}
                                    style={{ left: cIdx * colWidth, width: colWidth }}
                                    className={`absolute top-0 bottom-0 border-r border-slate-100 pointer-events-none ${
                                      col.isWeekend ? 'bg-slate-100/30' : ''
                                    }`}
                                  />
                                ))}

                                {/* Task Gantt Bar */}
                                <div
                                  style={{ left: taskLeft, width: taskWidth }}
                                  onClick={() => onOpenStepDetail ? onOpenStepDetail(project, task.stepNumber) : onOpenProject(project)}
                                  className={`absolute h-6 rounded-lg px-2 flex items-center justify-between text-[11px] font-black cursor-pointer shadow-xs transition-all border ${
                                    isCompleted
                                      ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                      : isInProgress
                                      ? 'bg-amber-500 text-slate-950 border-amber-600 animate-pulse hover:bg-amber-600 font-extrabold shadow-sm'
                                      : isOverdue
                                      ? 'bg-red-600 text-white border-red-700 animate-bounce shadow-md'
                                      : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                                  }`}
                                  title={`${task.stepTitle} (${task.startDate.toLocaleDateString('es-PE')} - ${task.endDate.toLocaleDateString('es-PE')})`}
                                >
                                  <span className="truncate pr-1">
                                    {task.stepNumber}. {task.stepTitle}
                                  </span>

                                  {task.isMilestone && (
                                    <span className="text-[10px] shrink-0" title="Hito Crítico">
                                      🚩
                                    </span>
                                  )}
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Legend Footer */}
        <div className="p-3.5 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-4 flex-wrap gap-y-2">
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Leyenda:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span>Completado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block animate-pulse" />
              <span>En Progreso (Activo)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-600 inline-block" />
              <span>Alerta SLA / Vencido</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-300 inline-block" />
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🚩</span>
              <span className="text-amber-300 font-bold">Hito Crítico (Cobro 7PM / SLA 15D / SLA 30D)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Haz clic en cualquier barra para abrir el hito o detalle de producción.
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL DE EXPORTACIÓN DE DIAGRAMA GANTT CON FILTROS */}
      {/* ========================================================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    Exportar Diagrama Gantt de Producción
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configura filtros, escala temporal y vista para el reporte oficial
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Options & Filters */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              
              {/* Option 1: Escala Temporal */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  1. Escala Temporal del Cronograma:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportScale('days')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      exportScale === 'days'
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-emerald-600" />
                      <span>Vista Diaria (Detallada)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Desglose paso a paso con fechas en formato {formatDateDDMMAA(new Date())}.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportScale('months')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      exportScale === 'months'
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-blue-600" />
                      <span>Vista Mensual (Ejecutiva)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Panorama general de meses de producción y eventos principales.
                    </p>
                  </button>
                </div>
              </div>

              {/* Option 2: Nivel de Detalle */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  2. Nivel de Detalle de los Expedientes:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportExpanded(true)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      exportExpanded
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span>Expandido (12 Pasos por Proyecto)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Incluye todos los hitos, responsables, SLAs y fechas por fase.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportExpanded(false)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      !exportExpanded
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-slate-700" />
                      <span>Colapsado (Solo Proyectos / Barra General)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Resumen compacto con fechas de evento y progreso global.
                    </p>
                  </button>
                </div>
              </div>

              {/* Option 3: Filtro Rápido de Estado */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                  3. Filtro de Estado de Producción:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: 'Todos', count: filteredProjectTasks.length },
                    { id: 'in_progress', label: 'En Curso', count: filteredProjectTasks.filter(p => p.tasks.some(t => t.status === 'in_progress')).length },
                    { id: 'overdue', label: 'Alertas SLA', count: filteredProjectTasks.filter(p => p.tasks.some(t => t.status === 'alert')).length },
                    { id: 'completed', label: 'Completados', count: filteredProjectTasks.filter(p => p.tasks.every(t => t.status === 'completed')).length }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setExportStatusFilter(f.id)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        exportStatusFilter === f.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>{f.label}</div>
                      <span className="text-[10px] font-mono opacity-70">({f.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-black text-slate-900 text-xs">
                    Resumen de Exportación:
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {filteredProjectTasks.length} proyectos seleccionados • Escala: {exportScale === 'days' ? 'Días' : 'Meses'} • Vista: {exportExpanded ? '12 Pasos Detallado' : 'Colapsado'}
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  {formatDateDDMMAA(new Date())}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setIsExportModalOpen(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
