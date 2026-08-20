import React, { useState, useMemo } from 'react';
import { ProductionProject, EventType } from '../types';
import { MonthlyStaffContractComparisonChart } from './MonthlyStaffContractComparisonChart';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  DollarSign, 
  Film, 
  Sparkles, 
  Camera, 
  Calendar, 
  ArrowUpRight, 
  Layers, 
  HardDrive,
  UserCheck,
  ChevronRight,
  Filter,
  Download,
  Percent
} from 'lucide-react';

interface ExecutiveSummaryModuleProps {
  projects: ProductionProject[];
  onOpenProject: (project: ProductionProject) => void;
  onOpenReportPrint?: (project: ProductionProject) => void;
}

const STATE_COLORS = {
  completed: '#10B981', // Emerald 500
  in_progress: '#3B82F6', // Blue 500
  planning: '#8B5CF6', // Purple 500
  overdue: '#EF4444', // Red 500
};

const EVENT_COLORS = ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#64748B'];

export const ExecutiveSummaryModule: React.FC<ExecutiveSummaryModuleProps> = ({
  projects,
  onOpenProject,
  onOpenReportPrint
}) => {
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'all'>('all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');

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

  // Helper to check overdue/SLA
  const isProjectOverdue = (p: ProductionProject) => {
    const { percent } = getProjectProgress(p);
    if (percent === 100) return false;
    
    const eventTime = new Date(p.eventDate).getTime();
    const nowTime = new Date(todayStr).getTime();
    
    const step7Done = p.phases[2]?.steps[1]?.status === 'completed';
    if (eventTime < nowTime && !step7Done && p.finalBalance > 0) return true;
    
    const diffDays = Math.round((nowTime - eventTime) / 86400000);
    if (diffDays > 15 && p.phases[3]?.steps[0]?.status !== 'completed') return true;
    if (p.includesPhotobook && diffDays > 30 && p.phases[4]?.steps[0]?.status !== 'completed') return true;
    
    return false;
  };

  // Filtered dataset
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (selectedEventType !== 'all' && p.eventType !== selectedEventType) return false;
      if (selectedStaffFilter !== 'all') {
        const hasStaff = p.assignedStaff.some(s => s.name === selectedStaffFilter || s.id === selectedStaffFilter);
        if (!hasStaff) return false;
      }
      return true;
    });
  }, [projects, selectedEventType, selectedStaffFilter]);

  // Overall Global KPI Metrics
  const totalProjects = filteredProjects.length;
  
  const completedProjects = filteredProjects.filter(p => {
    const { percent } = getProjectProgress(p);
    return percent === 100 || p.isArchived;
  });

  const overdueProjects = filteredProjects.filter(p => isProjectOverdue(p));
  
  const inProgressProjects = filteredProjects.filter(p => {
    const { percent } = getProjectProgress(p);
    return percent > 0 && percent < 100 && !isProjectOverdue(p) && !p.isArchived;
  });

  const planningProjects = filteredProjects.filter(p => {
    const { percent } = getProjectProgress(p);
    return percent === 0 && !isProjectOverdue(p);
  });

  // Calculate percentages
  const completedPercent = totalProjects > 0 ? Math.round((completedProjects.length / totalProjects) * 100) : 0;
  const inProgressPercent = totalProjects > 0 ? Math.round((inProgressProjects.length / totalProjects) * 100) : 0;
  const overduePercent = totalProjects > 0 ? Math.round((overdueProjects.length / totalProjects) * 100) : 0;
  const planningPercent = totalProjects > 0 ? Math.max(0, 100 - completedPercent - inProgressPercent - overduePercent) : 0;

  // Financial Metrics
  const totalBudgetSum = filteredProjects.reduce((sum, p) => sum + p.totalBudget, 0);
  const totalCollectedSum = filteredProjects.reduce((sum, p) => sum + p.initialDeposit + p.fieldPayment, 0);
  const pendingBalanceSum = Math.max(0, totalBudgetSum - totalCollectedSum);
  const collectionRate = totalBudgetSum > 0 ? Math.round((totalCollectedSum / totalBudgetSum) * 100) : 0;

  // Chart 1 Data: Project Status Distribution (Pie / Donut)
  const statusDistributionData = [
    { 
      name: 'Completados', 
      value: completedProjects.length, 
      percentage: completedPercent, 
      color: STATE_COLORS.completed 
    },
    { 
      name: 'En Progreso / En Tiempo', 
      value: inProgressProjects.length, 
      percentage: inProgressPercent, 
      color: STATE_COLORS.in_progress 
    },
    { 
      name: 'En Planificación Inicial', 
      value: planningProjects.length, 
      percentage: planningPercent, 
      color: STATE_COLORS.planning 
    },
    { 
      name: 'Con Alerta / SLA Vencido', 
      value: overdueProjects.length, 
      percentage: overduePercent, 
      color: STATE_COLORS.overdue 
    }
  ].filter(item => item.value > 0);

  // Chart 2 Data: Employee Workload Analysis
  const employeeWorkloadMap: Record<string, {
    name: string;
    role: string;
    total: number;
    active: number;
    completed: number;
    overdue: number;
    phone: string;
  }> = {};

  projects.forEach(p => {
    const isCompleted = getProjectProgress(p).percent === 100 || p.isArchived;
    const isOverdue = isProjectOverdue(p);

    p.assignedStaff.forEach(staff => {
      if (!employeeWorkloadMap[staff.name]) {
        employeeWorkloadMap[staff.name] = {
          name: staff.name,
          role: staff.role || 'Técnico de Producción',
          total: 0,
          active: 0,
          completed: 0,
          overdue: 0,
          phone: staff.phone
        };
      }
      employeeWorkloadMap[staff.name].total += 1;
      if (isCompleted) {
        employeeWorkloadMap[staff.name].completed += 1;
      } else if (isOverdue) {
        employeeWorkloadMap[staff.name].overdue += 1;
      } else {
        employeeWorkloadMap[staff.name].active += 1;
      }
    });
  });

  const employeeWorkloadList = Object.values(employeeWorkloadMap).sort((a, b) => b.total - a.total);

  // Format data for Recharts Bar Chart
  const workloadChartData = employeeWorkloadList.map(emp => ({
    name: emp.name.split(' ')[0], // First name for neat labels
    fullName: emp.name,
    role: emp.role,
    'Activos en Curso': emp.active,
    'Completados': emp.completed,
    'Con Retraso': emp.overdue,
    total: emp.total
  }));

  // Chart 3 Data: Revenue & Volume by Event Type
  const eventTypeMap: Record<string, { count: number; budget: number; collected: number }> = {};
  filteredProjects.forEach(p => {
    if (!eventTypeMap[p.eventType]) {
      eventTypeMap[p.eventType] = { count: 0, budget: 0, collected: 0 };
    }
    eventTypeMap[p.eventType].count += 1;
    eventTypeMap[p.eventType].budget += p.totalBudget;
    eventTypeMap[p.eventType].collected += (p.initialDeposit + p.fieldPayment);
  });

  const eventTypeChartData = Object.keys(eventTypeMap).map(type => ({
    name: type,
    Proyectos: eventTypeMap[type].count,
    Presupuestado: eventTypeMap[type].budget,
    Recaudado: eventTypeMap[type].collected
  }));

  // Distribution by Phase of 12-step workflow
  const phaseDistributionData = [
    { phase: 'F1: Negociación', count: 0, color: '#10B981' },
    { phase: 'F2: Planificación', count: 0, color: '#3B82F6' },
    { phase: 'F3: Rodaje / Campo', count: 0, color: '#F59E0B' },
    { phase: 'F4: Edición USB (15d)', count: 0, color: '#8B5CF6' },
    { phase: 'F5: Fotolibro (30d)', count: 0, color: '#EC4899' },
    { phase: 'F6: Cierre & Archivo', count: 0, color: '#64748B' }
  ];

  filteredProjects.forEach(p => {
    let highestActivePhase = 1;
    p.phases.forEach(ph => {
      if (ph.steps.some(s => s.status === 'in_progress' || s.status === 'completed')) {
        highestActivePhase = ph.phaseNumber;
      }
    });
    if (phaseDistributionData[highestActivePhase - 1]) {
      phaseDistributionData[highestActivePhase - 1].count += 1;
    }
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden md:block">
          <BarChart3 className="w-48 h-48 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Módulo Analítico Corporación TCT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Resumen Ejecutivo de Operaciones</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Análisis visual en tiempo real de la distribución de estados de los proyectos, efectividad de entregas y asignación de carga de trabajo por empleado.
            </p>
          </div>

          {/* Filter Pill Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 gap-2">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value as any)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">Todos los Eventos</option>
                <option value="Boda" className="bg-slate-900 text-white">Bodas</option>
                <option value="XV Años" className="bg-slate-900 text-white">XV Años</option>
                <option value="Evento Corporativo" className="bg-slate-900 text-white">Corporativos</option>
                <option value="Graduación" className="bg-slate-900 text-white">Graduaciones</option>
                <option value="Concierto / Festival" className="bg-slate-900 text-white">Conciertos</option>
              </select>
            </div>

            {selectedStaffFilter !== 'all' && (
              <button
                onClick={() => setSelectedStaffFilter('all')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black transition-all hover:bg-amber-400"
              >
                Limpiar filtro de empleado ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Executive Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total & Completion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tasa de Finalización
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{completedPercent}%</span>
              <span className="text-xs font-bold text-emerald-600">({completedProjects.length}/{totalProjects} culminados)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${completedPercent}%` }} 
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Proyectos con acta de entrega final firmada.
          </p>
        </div>

        {/* Card 2: Active / In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Proyectos en Curso
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{inProgressProjects.length}</span>
              <span className="text-xs font-bold text-blue-600">({inProgressPercent}% del total)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${inProgressPercent}%` }} 
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            En rodaje, edición de video USB o fotolibro.
          </p>
        </div>

        {/* Card 3: Overdue / Critical SLA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              En Riesgo / SLA Vencido
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              overdueProjects.length > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black ${overdueProjects.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {overdueProjects.length}
              </span>
              <span className="text-xs font-bold text-red-600">({overduePercent}% del total)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-red-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${overduePercent}%` }} 
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Exceden 15 días (Edición) o falta cobro 7PM.
          </p>
        </div>

        {/* Card 4: Financial Recovery */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cobranza Realizada
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">S/. {totalCollectedSum.toLocaleString('es-PE')}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mt-1">
              <span>Tasa: {collectionRate}%</span>
              <span className="text-amber-600 font-semibold">Pend: S/. {pendingBalanceSum.toLocaleString('es-PE')}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${collectionRate}%` }} 
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Adelantos bancarios y pagos en campo recibidos.
          </p>
        </div>

      </div>

      {/* Recharts Bar Chart: Monthly Staff Contract Comparison Dashboard */}
      <MonthlyStaffContractComparisonChart 
        projects={projects}
        onOpenProject={onOpenProject}
      />

      {/* Main Charts Row 1: State Distribution & Employee Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* CHART 1: DISTRIBUCIÓN DE ESTADOS DE PROYECTOS (DONUT & PERCENTAGES) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Distribución de Estados de Proyectos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Porcentaje de avance global (Completados vs Pendientes)
                  </p>
                </div>
              </div>
            </div>

            {/* Recharts Donut Visual */}
            <div className="h-64 sm:h-72 w-full mt-4 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip 
                    formatter={(val: any, name: any, item: any) => [
                      `${val} proyectos (${item.payload.percentage}%)`, 
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '16px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                    }}
                  />
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Central Donut Badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {totalProjects}
                </span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Expedientes
                </span>
              </div>
            </div>

            {/* Breakdown List with Exact Percentages */}
            <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-100">
              {statusDistributionData.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="text-xs font-bold text-slate-700 truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 block">
                      {item.value} ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>✓ {completedPercent}% de tasa de efectividad en entregas</span>
            <span className="font-bold text-slate-700">TCT Live Metrics</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CHART 2: CARGA DE TRABAJO POR EMPLEADO / TÉCNICO (RECHARTS BAR CHART) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Carga de Trabajo por Empleado / Técnico
                  </h3>
                  <p className="text-xs text-slate-500">
                    Asignaciones activas vs proyectos concluidos por colaborador
                  </p>
                </div>
              </div>

              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200/60 self-start sm:self-auto">
                {employeeWorkloadList.length} Colaboradores Activos
              </span>
            </div>

            {/* Recharts Bar Visual */}
            <div className="h-64 sm:h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workloadChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    interval={0}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                  />
                  <RechartsTooltip 
                    formatter={(val: any, name: any, item: any) => [
                      `${val} proyectos`, 
                      name
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return `${payload[0].payload.fullName} (${payload[0].payload.role})`;
                      }
                      return label;
                    }}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '16px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                  />
                  <Bar 
                    dataKey="Activos en Curso" 
                    fill="#3B82F6" 
                    radius={[6, 6, 0, 0]} 
                    stackId="a"
                  />
                  <Bar 
                    dataKey="Completados" 
                    fill="#10B981" 
                    radius={[6, 6, 0, 0]} 
                    stackId="a"
                  />
                  <Bar 
                    dataKey="Con Retraso" 
                    fill="#EF4444" 
                    radius={[6, 6, 0, 0]} 
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick interactive staff filters list */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Filtrar:</span>
              <button
                onClick={() => setSelectedStaffFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  selectedStaffFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({projects.length})
              </button>
              {employeeWorkloadList.map((emp, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedStaffFilter(selectedStaffFilter === emp.name ? 'all' : emp.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                    selectedStaffFilter === emp.name
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{emp.name.split(' ')[0]}</span>
                  <span className="bg-black/15 px-1 rounded text-[10px] font-mono">{emp.total}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Balance operativo: Distribución equilibrada entre rodaje y post-producción</span>
            <span className="text-blue-600 font-bold">Carga Óptima</span>
          </div>
        </div>

      </div>

      {/* Row 2: Secondary Visual Insights (Phase Breakdown & Revenue by Event Type) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sub-Chart 1: Flujo de Fases de los 12 Pasos */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Flujo de 12 Pasos por Fases Activas
                </h3>
                <p className="text-xs text-slate-500">
                  Concentración de producciones en cada etapa del proceso
                </p>
              </div>
            </div>
          </div>

          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={phaseDistributionData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis 
                  dataKey="phase" 
                  type="category" 
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                  width={110}
                />
                <RechartsTooltip 
                  formatter={(val: any) => [`${val} proyectos en esta fase`, 'Volumen']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '14px',
                    color: '#FFFFFF',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 6, 6, 0]}>
                  {phaseDistributionData.map((entry, index) => (
                    <Cell key={`cell-phase-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sub-Chart 2: Ingresos y Volumen por Tipo de Evento */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Volumen y Recaudación por Categoría
                </h3>
                <p className="text-xs text-slate-500">
                  Presupuesto vs Cobrado en Soles Peruanos (S/.)
                </p>
              </div>
            </div>
          </div>

          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={eventTypeChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
                <YAxis 
                  tickFormatter={(val) => `S/. ${(val/1000).toFixed(0)}k`} 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                />
                <RechartsTooltip 
                  formatter={(val: any, name: any) => [
                    `S/. ${Number(val).toLocaleString('es-PE')}`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '14px',
                    color: '#FFFFFF',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="Presupuestado" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recaudado" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Collaborator Matrix & Contact Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Matriz de Disponibilidad y Rendimiento Técnico
              </h3>
              <p className="text-xs text-slate-500">
                Detalle individual de roles asignados, carga de proyectos y estado de capacidad
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Colaborador / Técnico</th>
                <th className="py-3 px-4">Especialidad Principal</th>
                <th className="py-3 px-4 text-center">Proyectos Asignados</th>
                <th className="py-3 px-4 text-center">En Curso</th>
                <th className="py-3 px-4 text-center">Culminados</th>
                <th className="py-3 px-4 text-center">Nivel de Carga</th>
                <th className="py-3 px-4 text-right">Contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeWorkloadList.map((emp, i) => {
                // Capacity status
                let capacityBadge = (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Disponible
                  </span>
                );
                if (emp.active >= 3) {
                  capacityBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                      ⚡ Alta Carga
                    </span>
                  );
                } else if (emp.active >= 1) {
                  capacityBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                      ● Activo Normal
                    </span>
                  );
                }

                return (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center">
                          {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{emp.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">TCT Staff</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {emp.role}
                    </td>

                    <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                      {emp.total}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-bold font-mono">
                        {emp.active}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold font-mono">
                        {emp.completed}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {capacityBadge}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <a 
                        href={`https://wa.me/${emp.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors border border-emerald-200"
                        title="Contactar vía WhatsApp"
                      >
                        <img src="/assets/whatsapp-3d.png" alt="WA" referrerPolicy="no-referrer" className="w-3.5 h-3.5 object-contain" />
                        <span>{emp.phone}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
