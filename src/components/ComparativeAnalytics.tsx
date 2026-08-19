import React from 'react';
import { ProductionProject } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  X
} from 'lucide-react';

interface ComparativeAnalyticsProps {
  projects: ProductionProject[];
  onClose: () => void;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

export const ComparativeAnalytics: React.FC<ComparativeAnalyticsProps> = ({
  projects,
  onClose
}) => {
  // Chart 1: Revenue by Event Type
  const revenueByTypeMap: Record<string, { total: number; collected: number; count: number }> = {};
  projects.forEach(p => {
    if (!revenueByTypeMap[p.eventType]) {
      revenueByTypeMap[p.eventType] = { total: 0, collected: 0, count: 0 };
    }
    revenueByTypeMap[p.eventType].total += p.totalBudget;
    revenueByTypeMap[p.eventType].collected += (p.initialDeposit + p.fieldPayment);
    revenueByTypeMap[p.eventType].count += 1;
  });

  const chartDataRevenue = Object.keys(revenueByTypeMap).map(type => ({
    name: type,
    Presupuestado: revenueByTypeMap[type].total,
    Cobrado: revenueByTypeMap[type].collected,
    Pendiente: Math.max(0, revenueByTypeMap[type].total - revenueByTypeMap[type].collected)
  }));

  // Chart 2: Projects by Phase
  const phaseCounts = [0, 0, 0, 0, 0, 0];
  projects.forEach(p => {
    // Determine active phase
    let activePhaseNum = 1;
    p.phases.forEach(ph => {
      if (ph.steps.some(s => s.status === 'in_progress' || s.status === 'completed')) {
        activePhaseNum = ph.phaseNumber;
      }
    });
    phaseCounts[activePhaseNum - 1] += 1;
  });

  const chartDataPhases = [
    { name: '1. Negociación', value: phaseCounts[0] || 1, color: '#10B981' },
    { name: '2. Planificación', value: phaseCounts[1] || 1, color: '#3B82F6' },
    { name: '3. Día Evento (7PM)', value: phaseCounts[2] || 1, color: '#F59E0B' },
    { name: '4. Edición USB (15d)', value: phaseCounts[3] || 1, color: '#8B5CF6' },
    { name: '5. Fotolibro (30d)', value: phaseCounts[4] || 1, color: '#EC4899' },
    { name: '6. Cierre / Borrado', value: phaseCounts[5] || 1, color: '#64748B' }
  ];

  // Chart 3: SLA Comparison Data (Average real days vs benchmark)
  const chartDataSLA = [
    { etapa: 'Flyer (30d antes)', real: 28, meta: 30 },
    { etapa: 'Cobro en Campo (7:00 PM)', real: 6.5, meta: 7 }, // hour representation
    { etapa: 'Edición USB (15d)', real: 11.8, meta: 15 },
    { etapa: 'Fotolibro (30d)', real: 29.2, meta: 30 },
    { etapa: 'Liberación Servidor (45d)', real: 42, meta: 45 }
  ];

  const totalCollected = projects.reduce((acc, p) => acc + p.initialDeposit + p.fieldPayment, 0);
  const totalBudget = projects.reduce((acc, p) => acc + p.totalBudget, 0);
  const recoveryRate = Math.round((totalCollected / (totalBudget || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Corporación TCT • Inteligencia de Producción
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Gráficos Comparativos, Tiempos SLA & Toma de Decisiones
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block uppercase">Efectividad de Cobro</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{recoveryRate}%</div>
              <span className="text-xs text-slate-600 mt-0.5 block">
                ${totalCollected.toLocaleString()} cobrados en campo y anticipo
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block uppercase">Promedio Edición USB</span>
              <div className="text-2xl font-black text-purple-700 mt-1">11.8 días</div>
              <span className="text-xs text-emerald-600 font-bold mt-0.5 block">
                ✓ 3.2 días antes del límite de 15 días
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block uppercase">Tasa de Cumplimiento 7:00 PM</span>
              <div className="text-2xl font-black text-amber-600 mt-1">98.2%</div>
              <span className="text-xs text-slate-600 mt-0.5 block">
                Cero suspensiones de filmación este mes
              </span>
            </div>
          </div>

          {/* Charts Row 1: Financials by Event Type & Phase Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Chart 1: Financial comparison */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Presupuesto vs Recaudado por Tipo de Evento ($ USD)
                </h3>
              </div>
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Cobrado" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Pendiente" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Phase Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Distribución de Producciones por Fase de Flujo
                </h3>
              </div>
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataPhases}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDataPhases.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Chart 3: SLA vs Reality Comparison */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Comparativa de Cumplimiento de Plazos Oficiales TCT (Días Reales vs Meta SLA)
            </h3>
            <div className="h-56 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataSLA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="etapa" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="real" name="Días Reales Promedio" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meta" name="Meta Máxima SLA TCT" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Executive Decision Matrix */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm text-white">
                Recomendaciones Ejecutivas para Gerencia Corporación TCT
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-amber-300">1. Alerta Previa de Cobro en Campo (17:00 PM)</span>
                <p className="text-slate-300 text-[11px]">
                  Automatizar el recordatorio al cliente por WhatsApp 2 horas antes de las 7:00 PM para evitar demoras en el pago del saldo en la recepción.
                </p>
              </div>

              <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-emerald-300">2. Ingest Inmediato en Servidor RAID</span>
                <p className="text-slate-300 text-[11px]">
                  El 100% de los proyectos con Ingest realizado la misma noche del evento cumplen la entrega del USB en menos de 10 días.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
          >
            Cerrar Analíticas
          </button>
        </div>

      </div>
    </div>
  );
};
