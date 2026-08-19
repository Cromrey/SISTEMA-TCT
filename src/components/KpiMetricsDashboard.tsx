import React, { useState } from 'react';
import { ProductionProject, EventType } from '../types';
import { 
  Film, 
  Banknote, 
  Receipt, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  PieChart as PieIcon, 
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';

interface KpiMetricsDashboardProps {
  projects: ProductionProject[];
  onSelectQuickFilter?: (filter: 'all' | 'pending' | 'overdue' | 'completed') => void;
  activeFilter?: string;
  onOpenProject?: (project: ProductionProject) => void;
}

export const KpiMetricsDashboard: React.FC<KpiMetricsDashboardProps> = ({
  projects,
  onSelectQuickFilter,
  activeFilter = 'all',
  onOpenProject
}) => {
  const [isChartsExpanded, setIsChartsExpanded] = useState(true);
  const [selectedChartTab, setSelectedChartTab] = useState<'income' | 'status' | 'closing_time'>('income');

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date(todayStr).getTime();

  // Helper for progress
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

  // Check if project is overdue
  const isProjectOverdue = (p: ProductionProject) => {
    const { percent } = getProjectProgress(p);
    if (percent === 100) return false;
    
    const eventTime = new Date(p.eventDate).getTime();
    const diffDays = Math.round((nowTime - eventTime) / 86400000);
    
    // Field payment 7pm check
    const step7Done = p.phases[2]?.steps[1]?.status === 'completed';
    if (eventTime < nowTime && !step7Done && p.finalBalance > 0) return true;

    // Video USB 15-day check
    if (diffDays > 15 && p.phases[3]?.steps[0]?.status !== 'completed') return true;

    // Photobook 30-day check
    if (p.includesPhotobook && diffDays > 30 && p.phases[4]?.steps[0]?.status !== 'completed') return true;

    return false;
  };

  // 1. Calculations: Total Productions
  const totalProjectsCount = projects.length;
  const inProgressProjects = projects.filter(p => {
    const { percent } = getProjectProgress(p);
    return percent < 100 && !p.isArchived && !isProjectOverdue(p);
  });
  const completedProjects = projects.filter(p => {
    const { percent } = getProjectProgress(p);
    return percent === 100 || p.isArchived;
  });
  const overdueProjects = projects.filter(p => isProjectOverdue(p));

  // 2. Calculations: Projected & Collected Income in Soles (S/.)
  const totalProjectedIncome = projects.reduce((acc, p) => acc + p.totalBudget, 0);
  const totalCollectedIncome = projects.reduce((acc, p) => acc + p.initialDeposit + p.fieldPayment, 0);
  const totalPendingIncome = Math.max(0, totalProjectedIncome - totalCollectedIncome);
  const collectionRate = Math.round((totalCollectedIncome / (totalProjectedIncome || 1)) * 100);

  // 3. Calculations: Average Completion / Closing Time (Tiempo promedio de cierre)
  // For completed projects: difference between event date and step 12 completedAt (or created to updated)
  // For in-progress: average days elapsed
  const closingTimes = projects.map(p => {
    const eventDate = new Date(p.eventDate);
    const step12 = p.phases[5]?.steps[1];
    const { percent } = getProjectProgress(p);

    if (percent === 100 && step12?.completedAt) {
      const finishDate = new Date(step12.completedAt);
      const days = Math.max(1, Math.round((finishDate.getTime() - eventDate.getTime()) / (1000 * 3600 * 24)));
      return { days: isNaN(days) ? 14 : days, isCompleted: true, eventType: p.eventType };
    } else {
      // Estimated / In-progress cycle
      const days = Math.max(1, Math.round((nowTime - eventDate.getTime()) / (1000 * 3600 * 24)));
      return { days: isNaN(days) ? 10 : days, isCompleted: false, eventType: p.eventType };
    }
  });

  const completedClosingTimes = closingTimes.filter(c => c.isCompleted);
  const avgCompletedDays = completedClosingTimes.length > 0
    ? (completedClosingTimes.reduce((acc, c) => acc + c.days, 0) / completedClosingTimes.length).toFixed(1)
    : '12.5';

  const overallAvgCycleDays = (closingTimes.reduce((acc, c) => acc + c.days, 0) / (closingTimes.length || 1)).toFixed(1);

  // SLA Compliance Rate
  const totalProjectsWithSLA = projects.filter(p => {
    const diff = Math.round((nowTime - new Date(p.eventDate).getTime()) / 86400000);
    return diff > 0;
  });
  const onTimeProjects = totalProjectsWithSLA.filter(p => !isProjectOverdue(p));
  const slaComplianceRate = Math.round((onTimeProjects.length / (totalProjectsWithSLA.length || 1)) * 100);

  // --- DATA FOR CHARTS ---

  // Chart 1: Projected vs Collected by Event Type
  const eventTypesMap: Record<string, { type: string; projected: number; collected: number; pending: number; count: number }> = {};
  projects.forEach(p => {
    const key = p.eventType || 'Otro';
    if (!eventTypesMap[key]) {
      eventTypesMap[key] = { type: key, projected: 0, collected: 0, pending: 0, count: 0 };
    }
    const collected = p.initialDeposit + p.fieldPayment;
    eventTypesMap[key].projected += p.totalBudget;
    eventTypesMap[key].collected += collected;
    eventTypesMap[key].pending += Math.max(0, p.totalBudget - collected);
    eventTypesMap[key].count += 1;
  });

  const incomeByTypeChartData = Object.values(eventTypesMap).sort((a, b) => b.projected - a.projected);

  // Chart 2: Status Distribution (Pie / Donut)
  const statusPieData = [
    { name: 'Completadas', value: completedProjects.length, color: '#059669' }, // Emerald
    { name: 'En Proceso', value: inProgressProjects.length, color: '#f59e0b' },   // Amber
    { name: 'Por Vencer / Alerta', value: overdueProjects.length, color: '#dc2626' } // Red
  ].filter(d => d.value > 0);

  // Chart 3: Average Closing Time by Event Type
  const timeByTypeMap: Record<string, { type: string; totalDays: number; count: number }> = {};
  closingTimes.forEach(c => {
    if (!timeByTypeMap[c.eventType]) {
      timeByTypeMap[c.eventType] = { type: c.eventType, totalDays: 0, count: 0 };
    }
    timeByTypeMap[c.eventType].totalDays += c.days;
    timeByTypeMap[c.eventType].count += 1;
  });

  const timeByTypeChartData = Object.values(timeByTypeMap).map(item => ({
    type: item.type,
    avgDays: Math.round(item.totalDays / (item.count || 1)),
    targetSla: item.type.includes('Boda') || item.type.includes('XV') ? 15 : 12,
    count: item.count
  }));

  const customTooltipFormatter = (value: any, name: string) => {
    if (typeof value === 'number') {
      if (name.includes('Ingreso') || name.includes('Recaudado') || name.includes('Pendiente') || name.includes('S/.') || name.includes('Proyectado')) {
        return [`S/. ${value.toLocaleString()}`, name];
      }
      if (name.includes('Días') || name.includes('Tiempo')) {
        return [`${value} días`, name];
      }
    }
    return [value, name];
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-400/30">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-white flex items-center gap-2">
              Panel de Control & Indicadores Clave de Rendimiento (KPIs)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
              EN TIEMPO REAL
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Monitoreo ejecutivo de producción, ingresos proyectados en Soles (S/.) y métricas de tiempo de entrega oficial TCT
          </p>
        </div>

        {/* Toggle Charts & Quick Filters */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsChartsExpanded(!isChartsExpanded)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            {isChartsExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Ocultar Gráficos</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Gráficos Visuales</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50">
        
        {/* KPI Card 1: Total Producciones */}
        <div 
          onClick={() => onSelectQuickFilter && onSelectQuickFilter('all')}
          className={`p-4 sm:p-5 transition-all cursor-pointer hover:bg-amber-50/40 ${
            activeFilter === 'all' ? 'bg-amber-50/70 border-b-2 border-amber-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Producciones</span>
            <div className="p-2 bg-amber-100 rounded-xl text-amber-900">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalProjectsCount}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
              {inProgressProjects.length} activas
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>✓ {completedProjects.length} cerradas</span>
            <span className={overdueProjects.length > 0 ? 'text-red-600 font-bold' : ''}>
              ⚠️ {overdueProjects.length} por vencer
            </span>
          </div>
        </div>

        {/* KPI Card 2: Ingresos Proyectados vs Recaudados */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Ingresos Proyectados</span>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-900">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              S/. {totalProjectedIncome.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-bold">
              Cobrado: S/. {totalCollectedIncome.toLocaleString()} ({collectionRate}%)
            </span>
            <span className="text-red-600 font-bold">
              Por cobrar: S/. {totalPendingIncome.toLocaleString()}
            </span>
          </div>
        </div>

        {/* KPI Card 3: Tiempo Promedio de Cierre */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tiempo Promedio Cierre</span>
            <div className="p-2 bg-blue-100 rounded-xl text-blue-900">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-800">{avgCompletedDays}</span>
            <span className="text-xs font-extrabold text-blue-950">días promedio</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>SLA Objetivo: 15 días USB</span>
            <span className="text-blue-700 font-bold">Ciclo global: {overallAvgCycleDays}d</span>
          </div>
        </div>

        {/* KPI Card 4: Cumplimiento de SLA */}
        <div 
          onClick={() => onSelectQuickFilter && onSelectQuickFilter('overdue')}
          className={`p-4 sm:p-5 transition-all cursor-pointer hover:bg-red-50/40 ${
            activeFilter === 'overdue' ? 'bg-red-50/70 border-b-2 border-red-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Cumplimiento de SLA</span>
            <div className="p-2 bg-purple-100 rounded-xl text-purple-900">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl sm:text-3xl font-black ${slaComplianceRate >= 80 ? 'text-purple-700' : 'text-red-600'}`}>
              {slaComplianceRate}%
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
              15d Video / 30d Libro
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{onTimeProjects.length} entregas a tiempo</span>
            <span className={overdueProjects.length > 0 ? 'text-red-600 font-black animate-pulse' : 'text-emerald-600 font-bold'}>
              {overdueProjects.length > 0 ? `${overdueProjects.length} con alerta` : '0 retrasos'}
            </span>
          </div>
        </div>

      </div>

      {/* Expandable Visual Charts Section (Bar & Pie Charts) */}
      {isChartsExpanded && (
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-white space-y-6">
          
          {/* Chart Tabs Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setSelectedChartTab('income')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  selectedChartTab === 'income' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Ingresos por Tipo (Barras)</span>
              </button>

              <button
                onClick={() => setSelectedChartTab('status')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  selectedChartTab === 'status' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Estado de Proyectos (Pastel)</span>
              </button>

              <button
                onClick={() => setSelectedChartTab('closing_time')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  selectedChartTab === 'closing_time' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Tiempos de Cierre (Días)</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Actualizado automáticamente con datos en Soles (S/.)</span>
            </div>
          </div>

          {/* Chart View 1: Bar Chart of Income Projected vs Collected */}
          {selectedChartTab === 'income' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Ingresos Proyectados vs. Recaudados por Tipo de Evento (S/.)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Comparativa de presupuesto pactado y cobranza efectiva por categoría de producción
                  </p>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeByTypeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="type" 
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => `S/.${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip 
                      formatter={customTooltipFormatter}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                    <Bar dataKey="projected" name="Ingreso Proyectado (S/.)" fill="#0f172a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="collected" name="Recaudado Efectivo (S/.)" fill="#059669" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="pending" name="Saldo Pendiente (S/.)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart View 2: Pie / Donut Chart of Status Distribution */}
          {selectedChartTab === 'status' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val, name) => [`${val} expedientes`, name]}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Desglose de Salud Operativa
                </h4>
                
                <div className="space-y-2.5 text-xs">
                  <div 
                    onClick={() => onSelectQuickFilter && onSelectQuickFilter('completed')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-600" />
                      <span className="font-bold text-emerald-950">Completadas & Conformidad Firmada</span>
                    </div>
                    <span className="font-black text-emerald-800">{completedProjects.length} proyectos</span>
                  </div>

                  <div 
                    onClick={() => onSelectQuickFilter && onSelectQuickFilter('pending')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="font-bold text-amber-950">En Proceso / Pendientes Regulares</span>
                    </div>
                    <span className="font-black text-amber-800">{inProgressProjects.length} proyectos</span>
                  </div>

                  <div 
                    onClick={() => onSelectQuickFilter && onSelectQuickFilter('overdue')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                      <span className="font-bold text-red-950">Por Vencer / Superan Plazo SLA</span>
                    </div>
                    <span className="font-black text-red-800">{overdueProjects.length} proyectos</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 pt-1">
                  * Haz clic en cualquier categoría para segmentar instantáneamente la lista de expedientes.
                </p>
              </div>
            </div>
          )}

          {/* Chart View 3: Closing Time / SLA Bar Chart */}
          {selectedChartTab === 'closing_time' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Tiempo Promedio de Cierre vs. Meta SLA por Tipo de Evento (Días)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Días transcurridos desde el rodaje hasta la entrega final y acta de conformidad
                  </p>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeByTypeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="type" 
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => `${val}d`}
                    />
                    <Tooltip 
                      formatter={customTooltipFormatter}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="avgDays" name="Tiempo Promedio Real (Días)" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="targetSla" name="Meta SLA Máxima (Días)" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
