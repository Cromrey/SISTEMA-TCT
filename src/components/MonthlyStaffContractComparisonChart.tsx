import React, { useState, useMemo } from 'react';
import { ProductionProject, StaffMember } from '../types';
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
import {
  Trophy,
  TrendingUp,
  Award,
  Users,
  Calendar,
  DollarSign,
  FileCheck,
  Zap,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  PieChart as PieIcon,
  Percent
} from 'lucide-react';

interface MonthlyStaffContractComparisonChartProps {
  projects: ProductionProject[];
  allStaff?: StaffMember[];
  onOpenProject?: (project: ProductionProject) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const BAR_COLORS = [
  '#F59E0B', // Amber 500
  '#3B82F6', // Blue 500
  '#10B981', // Emerald 500
  '#8B5CF6', // Purple 500
  '#EC4899', // Pink 500
  '#06B6D4', // Cyan 500
  '#F97316', // Orange 500
  '#6366F1'  // Indigo 500
];

export const MonthlyStaffContractComparisonChart: React.FC<MonthlyStaffContractComparisonChartProps> = ({
  projects,
  allStaff = [],
  onOpenProject
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [chartMetric, setChartMetric] = useState<'contracts' | 'amount' | 'both'>('both');

  // Filter projects created or contracted in the selected month
  const monthlyProjects = useMemo(() => {
    return projects.filter(p => {
      if (p.isArchived) return false;
      // Check either createdAt, eventDate, or contract timestamp
      const dateStr = p.createdAt || p.eventDate;
      if (!dateStr) return false;
      const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [projects, selectedMonth, selectedYear]);

  // Aggregate contracts per staff / contract holder
  const staffStats = useMemo(() => {
    const map: Record<string, {
      name: string;
      contractsCount: number;
      totalAmount: number;
      collectedAmount: number;
      pendingAmount: number;
      projectIds: string[];
      lastContractDate: string;
    }> = {};

    monthlyProjects.forEach(p => {
      // Determine the employee / advisor name
      const holderName = p.contractHolder
        ? p.contractHolder.replace(/ - Asesor Comercial| - Administrador| - Técnico/gi, '').trim()
        : (p.assignedStaff && p.assignedStaff[0]?.name) || 'Sin Asignar';

      if (!map[holderName]) {
        map[holderName] = {
          name: holderName,
          contractsCount: 0,
          totalAmount: 0,
          collectedAmount: 0,
          pendingAmount: 0,
          projectIds: [],
          lastContractDate: ''
        };
      }

      map[holderName].contractsCount += 1;
      map[holderName].totalAmount += (p.totalBudget || 0);
      map[holderName].collectedAmount += ((p.initialDeposit || 0) + (p.fieldPayment || 0));
      map[holderName].pendingAmount += Math.max(0, (p.totalBudget || 0) - ((p.initialDeposit || 0) + (p.fieldPayment || 0)));
      map[holderName].projectIds.push(p.id);
      if (p.createdAt > map[holderName].lastContractDate) {
        map[holderName].lastContractDate = p.createdAt;
      }
    });

    // Also ensure all staff are represented if they have 0 contracts
    allStaff.forEach(st => {
      const cleanName = st.name.trim();
      if (!map[cleanName]) {
        map[cleanName] = {
          name: cleanName,
          contractsCount: 0,
          totalAmount: 0,
          collectedAmount: 0,
          pendingAmount: 0,
          projectIds: [],
          lastContractDate: '-'
        };
      }
    });

    return Object.values(map).sort((a, b) => {
      if (b.contractsCount !== a.contractsCount) {
        return b.contractsCount - a.contractsCount;
      }
      return b.totalAmount - a.totalAmount;
    });
  }, [monthlyProjects, allStaff]);

  // Chart data format for Recharts
  const chartData = useMemo(() => {
    return staffStats.map(s => ({
      name: s.name.split(' ')[0] + ' ' + (s.name.split(' ')[1] ? s.name.split(' ')[1].charAt(0) + '.' : ''),
      fullName: s.name,
      'Contratos Realizados': s.contractsCount,
      'Monto Contratado (S/.)': s.totalAmount,
      'Monto Recaudado (S/.)': s.collectedAmount,
      ticketPromedio: s.contractsCount > 0 ? Math.round(s.totalAmount / s.contractsCount) : 0
    }));
  }, [staffStats]);

  const totalMonthlyContracts = monthlyProjects.length;
  const totalMonthlyAmount = monthlyProjects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);
  const totalMonthlyCollected = monthlyProjects.reduce((acc, p) => acc + ((p.initialDeposit || 0) + (p.fieldPayment || 0)), 0);
  const averageTicket = totalMonthlyContracts > 0 ? Math.round(totalMonthlyAmount / totalMonthlyContracts) : 0;

  const topPerformer = staffStats[0];

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-6">
      
      {/* Header with Title and Month Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wide flex items-center gap-1">
              <Trophy className="w-3 h-3 text-slate-950" />
              DESEMPEÑO COMERCIAL
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Corporación TCT • Ranking Mensual
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <span>Volumen de Contratos por Empleado</span>
            <span className="text-amber-400 font-bold text-sm sm:text-base">
              ({MONTH_NAMES[selectedMonth]} {selectedYear})
            </span>
          </h3>
          <p className="text-xs text-slate-300">
            Comparativa de contratos cerrados, facturación en Soles (S/.) y efectividad comercial del mes en curso.
          </p>
        </div>

        {/* Controls: Month Select & Metric Switch */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Month Selector */}
          <div className="flex items-center bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-400 mr-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer pr-1"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx} className="bg-slate-900 text-white">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-mono font-bold text-amber-300 focus:outline-none cursor-pointer pl-1 border-l border-slate-700"
            >
              <option value={2026} className="bg-slate-900 text-white">2026</option>
              <option value={2025} className="bg-slate-900 text-white">2025</option>
            </select>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartMetric('both')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                chartMetric === 'both' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Completo
            </button>
            <button
              onClick={() => setChartMetric('contracts')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                chartMetric === 'contracts' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              N° Contratos
            </button>
            <button
              onClick={() => setChartMetric('amount')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                chartMetric === 'amount' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monto (S/.)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Contratos Mes</span>
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-1 text-2xl font-black text-white font-mono">
            {totalMonthlyContracts} <span className="text-xs font-normal text-slate-400">eventos</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            En {MONTH_NAMES[selectedMonth]} {selectedYear}
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Facturación Total (S/.)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-400 font-mono">
            S/. {totalMonthlyAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-300/80 mt-1">
            Recaudado: S/. {totalMonthlyCollected.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ticket Promedio</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 text-2xl font-black text-purple-300 font-mono">
            S/. {averageTicket.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Por contrato firmado
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-slate-950 p-3.5 rounded-2xl border border-amber-500/40">
          <div className="flex items-center justify-between text-amber-300 text-xs font-bold">
            <span>Asesor Estrella del Mes</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-base font-black text-amber-300 truncate">
            {topPerformer && topPerformer.contractsCount > 0 ? topPerformer.name : 'Sin registros'}
          </div>
          <div className="text-[11px] text-slate-300 font-mono">
            {topPerformer && topPerformer.contractsCount > 0
              ? `${topPerformer.contractsCount} contratos • S/. ${topPerformer.totalAmount.toLocaleString()}`
              : 'Registra contratos para liderar'}
          </div>
        </div>
      </div>

      {/* Main Visual Bar Chart (Recharts) */}
      <div className="bg-slate-950/90 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Gráfico Comparativo de Rendimiento por Empleado
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">
            Mostrando {chartData.length} colaboradores activos
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          {chartData.length === 0 || totalMonthlyContracts === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Calendar className="w-10 h-10 text-slate-600" />
              <p className="text-sm font-bold">No hay contratos registrados para {MONTH_NAMES[selectedMonth]} {selectedYear}</p>
              <p className="text-xs text-slate-600">Cambia el mes o registra una nueva producción</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barSize={chartMetric === 'both' ? 24 : 36}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  label={{ value: chartMetric === 'amount' ? 'Soles (S/.)' : 'Contratos', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                />
                {chartMetric === 'both' && (
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#10b981" 
                    fontSize={11} 
                    tickLine={false}
                    tickFormatter={(val) => `S/.${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                  />
                )}
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 text-white">
                          <p className="font-black text-amber-400 text-sm border-b border-slate-700 pb-1">
                            {data.fullName}
                          </p>
                          <div className="space-y-1 pt-0.5 font-mono">
                            <div className="flex justify-between gap-4 text-blue-300">
                              <span>Contratos Cerrados:</span>
                              <span className="font-bold">{data['Contratos Realizados']}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-emerald-400">
                              <span>Monto Contratado:</span>
                              <span className="font-bold">S/. {data['Monto Contratado (S/.)'].toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-slate-300">
                              <span>Recaudado a la fecha:</span>
                              <span className="font-bold">S/. {data['Monto Recaudado (S/.)'].toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-purple-300 border-t border-slate-800 pt-1">
                              <span>Ticket Promedio:</span>
                              <span className="font-bold">S/. {data.ticketPromedio.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />

                {(chartMetric === 'both' || chartMetric === 'contracts') && (
                  <Bar
                    yAxisId="left"
                    dataKey="Contratos Realizados"
                    name="N° de Contratos"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-cnt-${index}`} fill={index === 0 ? '#F59E0B' : '#3B82F6'} />
                    ))}
                  </Bar>
                )}

                {(chartMetric === 'both' || chartMetric === 'amount') && (
                  <Bar
                    yAxisId={chartMetric === 'both' ? 'right' : 'left'}
                    dataKey="Monto Contratado (S/.)"
                    name="Monto Total (S/.)"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-amt-${index}`} fill={index === 0 ? '#10B981' : '#059669'} />
                    ))}
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Staff Leaderboard Ranking Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-amber-400" />
          Tabla de Posiciones & Desglose Comercial
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {staffStats.map((staff, idx) => {
            const percentOfTotal = totalMonthlyContracts > 0 
              ? Math.round((staff.contractsCount / totalMonthlyContracts) * 100) 
              : 0;

            return (
              <div 
                key={staff.name}
                className={`p-4 rounded-2xl border transition-all ${
                  idx === 0 && staff.contractsCount > 0
                    ? 'bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      idx === 0 
                        ? 'bg-amber-400 text-slate-950 font-black' 
                        : idx === 1 
                        ? 'bg-slate-300 text-slate-950' 
                        : idx === 2 
                        ? 'bg-amber-700 text-white' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-white truncate max-w-[160px]">
                        {staff.name}
                      </h5>
                      <span className="text-[10px] text-slate-400 block">
                        Asesor Comercial / Producción
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 font-mono">
                    {staff.contractsCount} {staff.contractsCount === 1 ? 'contrato' : 'contratos'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Monto Contratado</span>
                    <span className="font-black text-emerald-400">
                      S/. {staff.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Cuota del Mes</span>
                    <span className="font-black text-amber-300">
                      {percentOfTotal}% del total
                    </span>
                  </div>
                </div>

                {/* Mini Progress Bar */}
                <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentOfTotal}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
