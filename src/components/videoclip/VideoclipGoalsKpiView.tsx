import React, { useState } from 'react';
import { VideoclipShot, VideoclipCatalog, VideoclipGoal, ShotPlan } from '../../types/videoclip';
import { formatShotNumber } from '../../utils/videoclipStorage';
import { 
  Target, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Camera, 
  Aperture, 
  User, 
  Film, 
  Plus, 
  Trash2,
  PieChart,
  Award
} from 'lucide-react';

interface VideoclipGoalsKpiViewProps {
  shots: VideoclipShot[];
  catalog: VideoclipCatalog;
  goals: VideoclipGoal[];
  onSaveGoal: (goal: VideoclipGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onNavigateToNewShot?: () => void;
}

export const VideoclipGoalsKpiView: React.FC<VideoclipGoalsKpiViewProps> = ({
  shots,
  catalog,
  goals,
  onSaveGoal,
  onDeleteGoal,
  onNavigateToNewShot
}) => {
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('ALL');

  // KPI Calculations
  const totalShots = shots.length;

  // Shots per Camera Operator
  const camCounts: { [cam: string]: number } = {};
  shots.forEach(s => {
    camCounts[s.cameraOperator] = (camCounts[s.cameraOperator] || 0) + 1;
  });

  // Shots per Lens
  const lensCounts: { [lens: string]: number } = {};
  shots.forEach(s => {
    lensCounts[s.lens] = (lensCounts[s.lens] || 0) + 1;
  });

  // Shots per Plan Category
  const catCounts: { [cat: string]: number } = {};
  shots.forEach(s => {
    catCounts[s.shotPlanCategory] = (catCounts[s.shotPlanCategory] || 0) + 1;
  });

  // Unique covered plan codes
  const coveredCodes = new Set(shots.map(s => s.shotPlanCode));
  const totalAvailablePlans = catalog.shotPlans.length;
  const coveragePercent = totalAvailablePlans > 0 
    ? Math.round((coveredCodes.size / totalAvailablePlans) * 100) 
    : 0;

  // Key Essential Plans Checklist for Decision Making on Set
  const essentialPlans = [
    { code: 'PG-AMB', label: 'General Todos (AMB)', cat: 'GENERAL' },
    { code: 'PE-A', label: 'Entero Artista', cat: 'ENTERO' },
    { code: 'PA-A', label: 'Americano Artista', cat: 'AMERICANO' },
    { code: 'PM-A', label: 'Plano Medio Artista', cat: 'MEDIO' },
    { code: 'PP-A', label: 'Primer Plano Rostro', cat: 'PRIMER PLANO' },
    { code: 'PD-I', label: 'Detalle Instrumento', cat: 'DETALLE' },
    { code: 'PE-BV', label: 'Entero Bailarines', cat: 'ENTERO' }
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">
                Métricas & Toma de Decisiones en Rodaje
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                EN VIVO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluación de cobertura cinematográfica, distribución técnica y cumplimiento de planos requeridos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Grabadas</span>
            <span className="text-2xl font-black text-amber-400 font-mono">{totalShots} tomas</span>
          </div>
        </div>
      </div>

      {/* Top 4 Quick Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase font-mono">Tomas Registradas</span>
            <Film className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {totalShots}
          </div>
          <p className="text-[10px] text-slate-500">Consecutivo actual</p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase font-mono">Planos Cubiertos</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {coveredCodes.size} <span className="text-sm text-slate-500">/ {totalAvailablePlans}</span>
          </div>
          <p className="text-[10px] text-slate-500">{coveragePercent}% de variedad</p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase font-mono">Camarógrafos Activos</span>
            <User className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
            {Object.keys(camCounts).length}
          </div>
          <p className="text-[10px] text-slate-500">En set de grabación</p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase font-mono">Lentes Utilizados</span>
            <Aperture className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
            {Object.keys(lensCounts).length}
          </div>
          <p className="text-[10px] text-slate-500">Ópticas en producción</p>
        </div>
      </div>

      {/* Decision Making Matrix: Essential Shot Checklist */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Guía de Cobertura Esencial para Decisión en Rodaje
              </h3>
              <p className="text-xs text-slate-400">
                Planos indispensables que todo videoclip debe tener antes de dar por finalizada una locación o tema.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {essentialPlans.map(item => {
            const count = shots.filter(s => s.shotPlanCode === item.code).length;
            const isRecorded = count > 0;

            return (
              <div
                key={item.code}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isRecorded
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                    : 'bg-amber-950/20 border-amber-500/40 text-slate-400'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-xs text-amber-300">
                      {item.code}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {item.cat}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">
                    {item.label}
                  </h4>
                </div>

                <div className="shrink-0 text-right">
                  {isRecorded ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {count} {count === 1 ? 'toma' : 'tomas'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      PENDIENTE
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Camarógrafos Contribution & Lenses Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Camarógrafos Performance */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-black text-white">
              Tomas por Camarógrafo
            </h3>
          </div>

          <div className="space-y-3">
            {Object.keys(camCounts).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Sin tomas registradas</p>
            ) : (
              Object.entries(camCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([cam, count]) => {
                  const pct = Math.round((count / totalShots) * 100);
                  return (
                    <div key={cam} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          {cam}
                        </span>
                        <span className="font-mono text-slate-400">
                          <strong className="text-amber-400">{count}</strong> tomas ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-sky-500 to-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Lenses Usage Distribution */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Aperture className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-black text-white">
              Distribución de Lentes Ópticos
            </h3>
          </div>

          <div className="space-y-3">
            {Object.keys(lensCounts).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Sin tomas registradas</p>
            ) : (
              Object.entries(lensCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([lens, count]) => {
                  const pct = Math.round((count / totalShots) * 100);
                  return (
                    <div key={lens} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          {lens}
                        </span>
                        <span className="text-slate-400">
                          <strong className="text-white">{count}</strong> ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
