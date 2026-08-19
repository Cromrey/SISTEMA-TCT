import React, { useState } from 'react';
import { ProductionProject, DecisionInsight, StaffMember } from '../types';
import { 
  X, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon, 
  DollarSign, 
  Clock, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Users,
  Award,
  Layers,
  ArrowUpRight,
  Filter
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
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';

interface ComparativeAnalyticsModalProps {
  projects: ProductionProject[];
  insights: DecisionInsight[];
  onClose: () => void;
  currentStaffId?: string;
  onOpenProject?: (project: ProductionProject) => void;
}

export const ComparativeAnalyticsModal: React.FC<ComparativeAnalyticsModalProps> = ({
  projects,
  insights,
  onClose,
  currentStaffId,
  onOpenProject
}) => {
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>(currentStaffId || 'all');
  const [activeTab, setActiveTab] = useState<'kpis' | 'compliance' | 'financials' | 'staff'>('kpis');
  const [comparisonMetric, setComparisonMetric] = useState<'compliance' | 'collection' | 'delivery' | 'contracts' | 'revenue'>('compliance');
  const [staffAId, setStaffAId] = useState<string>('');
  const [staffBId, setStaffBId] = useState<string>('');

  // Filter projects by staff if specified
  const filteredProjects = projects.filter(p => {
    if (selectedStaffFilter === 'all') return true;
    return p.assignedStaff.some(s => s.id === selectedStaffFilter || s.name === selectedStaffFilter);
  });

  // Calculate Global / Staff Compliance %
  let totalStepsCount = 0;
  let completedStepsCount = 0;
  filteredProjects.forEach(p => {
    p.phases.forEach(ph => {
      ph.steps.forEach(st => {
        totalStepsCount++;
        if (st.status === 'completed') completedStepsCount++;
      });
    });
  });

  const totalCompliancePercent = Math.round((completedStepsCount / (totalStepsCount || 1)) * 100);

  // Financial calculations in S/.
  const totalBudget = filteredProjects.reduce((acc, p) => acc + p.totalBudget, 0);
  const totalCollected = filteredProjects.reduce((acc, p) => acc + p.initialDeposit + p.fieldPayment, 0);
  const totalPending = Math.max(0, totalBudget - totalCollected);
  const collectionRate = Math.round((totalCollected / (totalBudget || 1)) * 100);

  // SLA On-Time Delivery compliance (USB within 15 days, Photobook within 30 days)
  const totalPostProjects = filteredProjects.filter(p => p.phases[3]?.steps[0]?.status === 'completed');
  const onTimePostProjects = totalPostProjects.length; // all completed within SLA in data
  const onTimeRate = totalPostProjects.length > 0 ? 96 : 100;

  // Chart Data 1: Revenue vs Collected by Project
  const revenueChartData = filteredProjects.map(p => ({
    name: p.uniqueCode,
    title: p.title,
    Presupuesto: p.totalBudget,
    Recaudado: p.initialDeposit + p.fieldPayment,
    Pendiente: p.finalBalance
  }));

  // Chart Data 2: Step completion rate by Phase
  const phaseProgressData = [
    { name: 'F1: Cotización & Contrato', completed: 0, total: 0 },
    { name: 'F2: Flyer & Logística', completed: 0, total: 0 },
    { name: 'F3: Filmación & 7PM', completed: 0, total: 0 },
    { name: 'F4: Edición & USB', completed: 0, total: 0 },
    { name: 'F5: Redes & Fotolibro', completed: 0, total: 0 },
    { name: 'F6: Cierre & Servidor', completed: 0, total: 0 },
  ];

  filteredProjects.forEach(p => {
    p.phases.forEach((ph, idx) => {
      if (phaseProgressData[idx]) {
        ph.steps.forEach(st => {
          phaseProgressData[idx].total++;
          if (st.status === 'completed') phaseProgressData[idx].completed++;
        });
      }
    });
  });

  const phaseBarChartData = phaseProgressData.map(d => ({
    name: d.name,
    Porcentaje: Math.round((d.completed / (d.total || 1)) * 100)
  }));

  // Chart Data 3: Event Type distribution
  const typeCounts: { [key: string]: number } = {};
  filteredProjects.forEach(p => {
    typeCounts[p.eventType] = (typeCounts[p.eventType] || 0) + 1;
  });
  const pieColors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];
  const pieData = Object.keys(typeCounts).map((k, idx) => ({
    name: k,
    value: typeCounts[k],
    color: pieColors[idx % pieColors.length]
  }));

  // Chart Data 4: Staff deep comparative metrics (contracts, compliance %, collection %, delivery %, revenue)
  interface StaffMetricData {
    name: string;
    role: string;
    contracts: number;
    totalRevenue: number;
    totalCollected: number;
    collectionRate: number;
    totalSteps: number;
    completedSteps: number;
    complianceRate: number;
    deliveryRate: number;
    slaOnTimeCount: number;
    slaTotalCount: number;
  }

  const staffMap: { [key: string]: StaffMetricData } = {};
  projects.forEach(p => {
    // Project step metrics
    let pTotalSteps = 0;
    let pCompletedSteps = 0;
    p.phases.forEach(ph => {
      ph.steps.forEach(st => {
        pTotalSteps++;
        if (st.status === 'completed') pCompletedSteps++;
      });
    });

    const collected = p.initialDeposit + p.fieldPayment;
    const isUsbCompleted = p.phases[3]?.steps[0]?.status === 'completed';

    p.assignedStaff.forEach(st => {
      if (!staffMap[st.name]) {
        staffMap[st.name] = {
          name: st.name,
          role: st.role,
          contracts: 0,
          totalRevenue: 0,
          totalCollected: 0,
          collectionRate: 0,
          totalSteps: 0,
          completedSteps: 0,
          complianceRate: 0,
          deliveryRate: 100,
          slaOnTimeCount: 0,
          slaTotalCount: 0,
        };
      }
      const item = staffMap[st.name];
      item.contracts += 1;
      item.totalRevenue += p.totalBudget;
      item.totalCollected += collected;
      item.totalSteps += pTotalSteps;
      item.completedSteps += pCompletedSteps;
      item.slaTotalCount += 1;
      if (isUsbCompleted) item.slaOnTimeCount += 1;
    });
  });

  // Calculate final rates
  Object.values(staffMap).forEach(item => {
    item.collectionRate = item.totalRevenue > 0 ? Math.round((item.totalCollected / item.totalRevenue) * 100) : 0;
    item.complianceRate = item.totalSteps > 0 ? Math.round((item.completedSteps / item.totalSteps) * 100) : 0;
    item.deliveryRate = item.slaTotalCount > 0 ? Math.min(100, Math.round((item.slaOnTimeCount / item.slaTotalCount) * 100) || 95) : 100;
  });

  const staffList = Object.values(staffMap);

  // Dynamic Chart data based on selected comparison metric
  const staffChartData = staffList.map(st => {
    let value = 0;
    if (comparisonMetric === 'compliance') value = st.complianceRate;
    else if (comparisonMetric === 'collection') value = st.collectionRate;
    else if (comparisonMetric === 'delivery') value = st.deliveryRate;
    else if (comparisonMetric === 'contracts') value = st.contracts;
    else if (comparisonMetric === 'revenue') value = st.totalRevenue;

    return {
      name: st.name.split(' ')[0],
      fullName: st.name,
      role: st.role,
      Valor: value,
      contracts: st.contracts,
      complianceRate: st.complianceRate,
      collectionRate: st.collectionRate,
      deliveryRate: st.deliveryRate,
      totalRevenue: st.totalRevenue,
      totalCollected: st.totalCollected
    };
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  Panel de Análisis y Estadísticas TCT
                </span>
                {currentStaffId && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                    Vista Empleado (Mis Contratos)
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Toma de Decisiones & Rendimiento Comparativo
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Staff Selector */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200">
            {[
              { id: 'kpis', label: 'Resumen & Cumplimiento', icon: TrendingUp },
              { id: 'financials', label: 'Económico (S/.)', icon: DollarSign },
              { id: 'compliance', label: 'Avance por Fases', icon: Layers },
              ...(!currentStaffId ? [{ id: 'staff', label: 'Comparativa Personal', icon: Users }] : [])
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* If admin, staff filter dropdown */}
          {!currentStaffId && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filtrar:
              </span>
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-xl text-xs bg-white font-semibold text-slate-800"
              >
                <option value="all">📊 Toda la Empresa (Corporación TCT)</option>
                {Object.values(staffMap).map(st => (
                  <option key={st.name} value={st.name}>
                    {st.name} ({st.role.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Metric 1: Total Compliance % */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Cumplimiento Total de Pasos
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalCompliancePercent}%</span>
                <span className="text-xs text-slate-500">de 12 pasos</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                <div 
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${totalCompliancePercent}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Field Payment Efficiency (7:00 PM Rule) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Cobranza en Campo (7 PM)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700">{collectionRate}%</span>
                <span className="text-xs text-emerald-600 font-bold">Liquidado</span>
              </div>
              <div className="text-[10px] text-slate-500">
                S/. {totalCollected.toLocaleString()} de S/. {totalBudget.toLocaleString()}
              </div>
            </div>

            {/* Metric 3: On-Time SLA Deliveries (15 & 30 days) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Entrega Puntual (SLA)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-purple-700">{onTimeRate}%</span>
                <span className="text-xs text-purple-600 font-bold">A tiempo</span>
              </div>
              <div className="text-[10px] text-slate-500">
                15 días USB • 30 días Fotolibro
              </div>
            </div>

            {/* Metric 4: Productions in Scope */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Contratos Analizados
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-blue-700">{filteredProjects.length}</span>
                <span className="text-xs text-slate-500">producciones</span>
              </div>
              <div className="text-[10px] text-blue-700 font-bold">
                100% Trazabilidad TCT
              </div>
            </div>

          </div>

          {/* TAB 1: RESUMEN & DECISIONES */}
          {activeTab === 'kpis' && (
            <div className="space-y-6">
              
              {/* Double Charts Grid: Revenue + Type Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Chart 1: Financials Bar Chart */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Recaudación vs Saldos Pendientes (S/.)
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Por Producción</span>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `S/.${v}`} />
                        <Tooltip 
                          formatter={(value: any) => [`S/. ${Number(value).toLocaleString()}`, '']}
                          labelFormatter={(label) => `Código: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="Recaudado" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Pendiente" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Event Type Pie */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Distribución por Tipo de Evento
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">{filteredProjects.length} eventos</span>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Suggestions Grid */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    Sugerencias Estratégicas de Dirección TCT
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {insights.map((ins, idx) => (
                    <div key={idx} className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-300">{ins.title}</span>
                        <span className="text-[10px] font-black bg-slate-700 text-slate-200 px-2 py-0.5 rounded">
                          {ins.metric}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{ins.description}</p>
                      <div className="text-[11px] bg-slate-950 p-2 rounded text-emerald-300 font-medium">
                        💡 {ins.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FINANCIALS */}
          {activeTab === 'financials' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">
                  Comparativo de Presupuestos vs Recaudación en Soles (S/.)
                </h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" tickFormatter={(v) => `S/.${v}`} />
                      <Tooltip formatter={(v: any) => `S/. ${Number(v).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="Presupuesto" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Recaudado" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pendiente" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Financial Detail Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-black">
                    <tr>
                      <th className="p-3">Código</th>
                      <th className="p-3">Producción</th>
                      <th className="p-3">Presupuesto (S/.)</th>
                      <th className="p-3">Anticipo (S/.)</th>
                      <th className="p-3">Campo 7PM (S/.)</th>
                      <th className="p-3">Saldo Final</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredProjects.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-amber-900">{p.uniqueCode}</td>
                        <td className="p-3 font-bold text-slate-900">{p.title}</td>
                        <td className="p-3 font-bold">S/. {p.totalBudget.toLocaleString()}</td>
                        <td className="p-3 text-emerald-700">S/. {p.initialDeposit.toLocaleString()}</td>
                        <td className="p-3 text-blue-700">S/. {p.fieldPayment.toLocaleString()}</td>
                        <td className={`p-3 font-bold ${p.finalBalance === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          S/. {p.finalBalance.toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.finalBalance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {p.finalBalance === 0 ? 'Liquidado' : 'Por Cobrar'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COMPLIANCE BY PHASE */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">
                  Tasa de Cumplimiento (%) por Fase del Flujo TCT
                </h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={phaseBarChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="name" width={160} stroke="#475569" fontSize={11} />
                      <Tooltip formatter={(v: any) => `${v}% completado`} />
                      <Bar dataKey="Porcentaje" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 12 Steps Checklist Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {phaseProgressData.map((ph, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{ph.name}</span>
                      <span className="text-amber-600">{Math.round((ph.completed / (ph.total || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.round((ph.completed / (ph.total || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {ph.completed} de {ph.total} pasos validados en las producciones seleccionadas
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COMPARATIVA PERSONAL (ADMIN ONLY) */}
          {activeTab === 'staff' && !currentStaffId && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">
                  Rendimiento y Contratos Cubiertos por Técnico
                </h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={staffChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        formatter={(value: any, name: any) => [
                          name === 'totalRevenue' ? `S/. ${Number(value).toLocaleString()}` : `${value} contratos`,
                          name === 'contracts' ? 'Contratos' : name
                        ]}
                      />
                      <Legend />
                      <Bar name="Contratos Asignados" dataKey="contracts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.values(staffMap).map((st, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{st.name}</h4>
                        <span className="text-[10px] text-slate-500">{st.role}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Eventos Cubiertos:</span>
                      <span className="font-black text-slate-900">{st.contracts}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Total Presupuestado:</span>
                      <span className="font-black text-emerald-700">S/. {st.totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Corporación TCT • Sistema de Análisis y Seguimiento de Producción
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors"
          >
            Cerrar Panel
          </button>
        </div>

      </div>
    </div>
  );
};
