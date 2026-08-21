import React from 'react';
import { ProductionProject, StepData, PhaseData } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Lock, 
  Sparkles, 
  Coins, 
  AlertCircle,
  Paperclip,
  CheckSquare,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

interface PhaseSequenceBarProps {
  project: ProductionProject;
  onStepClick?: (phaseIndex: number, stepIndex: number) => void;
  compact?: boolean;
}

export const PhaseSequenceBar: React.FC<PhaseSequenceBarProps> = ({
  project,
  onStepClick,
  compact = false
}) => {
  // Flatten all 12 steps
  const allSteps: { phase: PhaseData; step: StepData; phaseIdx: number; stepIdx: number }[] = [];
  project.phases.forEach((ph, pIdx) => {
    ph.steps.forEach((st, sIdx) => {
      allSteps.push({ phase: ph, step: st, phaseIdx: pIdx, stepIdx: sIdx });
    });
  });

  const totalSteps = allSteps.length;
  const completedSteps = allSteps.filter(item => item.step.status === 'completed').length;
  const progressPercent = Math.round((completedSteps / (totalSteps || 12)) * 100);

  // Active step
  const activeStepItem = allSteps.find(item => item.step.status === 'in_progress') 
    || allSteps.find(item => item.step.status !== 'completed')
    || allSteps[allSteps.length - 1];

  const activeStepNumber = activeStepItem ? activeStepItem.step.stepNumber : 1;

  // Missing action alert helper
  const getMissingAlert = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return 'Falta: Ficha técnica y proforma oficial';
      case 2: return 'Falta: Voucher de adelanto y firma de contrato';
      case 3: return 'Falta: Asignar director y reserva de equipos';
      case 4: return 'Falta: Salida de almacén (baterías y SDs formateadas)';
      case 5: return 'Falta: Hoja de ruta y transporte a locación';
      case 6: return 'Falta: Bitácora de rodaje en locación';
      case 7: return project.finalBalance > 0 ? '⚠️ URGENTE: Cobro en campo antes de 7:00 PM' : 'Falta: Liquidar saldo en campo';
      case 8: return 'Falta: Ingest RAW y backup dual en NAS';
      case 9: return 'Falta: Edición Video Master 4K (Plazo 15 Días)';
      case 10: return 'Falta: Publicar enlaces de redes (TikTok / YouTube)';
      case 11: return 'Falta: Maquetación Fotolibro (Plazo 30 Días)';
      case 12: return 'Falta: Entrega USB, Saldo S/. 0 y Conformidad';
      default: return 'Falta: Completar evidencias del paso';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Compact, Intuitive Progress Box */}
      <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Active Milestone: Strongly Pulsing Highlight as Requested */}
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-amber-600/40 text-amber-300 border-2 border-amber-400 font-black text-xs flex items-center gap-2 shadow-lg animate-pulse">
              <Zap className="w-4 h-4 text-amber-300 shrink-0" />
              <span>HITO ACTUAL: PASO {activeStepNumber}/12</span>
            </div>

            <div className="text-left">
              <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-xs sm:max-w-md">
                {activeStepItem?.step.title}
              </h3>
              <span className="text-[10px] text-slate-300 font-medium">
                {activeStepItem?.phase.name}
              </span>
            </div>
          </div>

          {/* Progress Percentage Display */}
          <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono leading-none">
                {progressPercent}<span className="text-sm font-bold text-amber-300">%</span>
              </div>
              <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 block mt-0.5">
                {completedSteps} de {totalSteps} pasos
              </span>
            </div>
          </div>

        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Alerta de lo que falta para continuar al siguiente paso */}
        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-300 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong>Acción Requerida:</strong> {getMissingAlert(activeStepNumber)}
            </span>
          </div>

          <div className="text-[11px] text-slate-300 font-mono shrink-0">
            Presupuesto: <strong className="text-amber-300 font-bold">S/. {project.totalBudget.toLocaleString()}</strong> | Saldo: <strong className="text-emerald-300 font-bold">S/. {project.finalBalance.toLocaleString()}</strong>
          </div>
        </div>

      </div>

      {/* Grid of 6 Phases & 12 Steps (Text overflow fixed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {project.phases.map((phase, phaseIdx) => {
          const phaseCompleted = phase.steps.every(s => s.status === 'completed');
          const phaseInProgress = phase.steps.some(s => s.status === 'in_progress');

          return (
            <div 
              key={phase.phaseNumber}
              className={`rounded-2xl p-3 border transition-all flex flex-col justify-between ${
                phaseCompleted
                  ? 'bg-slate-50 border-slate-200 shadow-xs'
                  : phaseInProgress
                  ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Phase Title Header */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span 
                    className="text-[10px] font-black px-2 py-0.5 rounded-md text-white shadow-xs"
                    style={{ backgroundColor: phase.color }}
                  >
                    Fase {phase.phaseNumber}
                  </span>
                  {phaseCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : phaseInProgress ? (
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
                
                <h4 className="text-[11px] font-black text-slate-900 line-clamp-1 mb-2.5" title={phase.name}>
                  {phase.name.split('. ')[1] || phase.name}
                </h4>

                {/* Steps inside this phase */}
                <div className="space-y-1.5">
                  {phase.steps.map((step, stepIdx) => {
                    const globalIdx = allSteps.findIndex(item => item.step.stepNumber === step.stepNumber);
                    const isFirstStep = globalIdx === 0;
                    const prevStep = !isFirstStep ? allSteps[globalIdx - 1] : null;
                    const isLocked = !isFirstStep && prevStep && prevStep.step.status !== 'completed';

                    const isDone = step.status === 'completed';
                    const isWorking = step.status === 'in_progress';
                    const isActive = step.stepNumber === activeStepNumber && !isDone;
                    const isSpecialRule = step.stepNumber === 7; // Regla 7:00 PM
                    const hasAttachments = step.attachments && step.attachments.length > 0;

                    return (
                      <button
                        key={step.stepNumber}
                        type="button"
                        onClick={() => onStepClick && onStepClick(phaseIdx, stepIdx)}
                        className={`w-full text-left p-2 rounded-xl border text-xs transition-all flex flex-col gap-1 group ${
                          isDone
                            ? 'bg-emerald-50/80 text-emerald-950 border-emerald-200 hover:bg-emerald-100'
                            : isActive
                            ? 'bg-amber-100 text-amber-950 border-2 border-amber-500 font-black shadow-md ring-2 ring-amber-400 animate-pulse scale-[1.02]'
                            : isWorking
                            ? 'bg-amber-100/90 text-amber-950 border-amber-400 font-bold hover:bg-amber-200'
                            : isSpecialRule
                            ? 'bg-red-50 text-red-950 border-red-200 hover:bg-red-100 font-bold'
                            : isLocked
                            ? 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {/* Top row: step number + title */}
                        <div className="flex items-center space-x-1.5 min-w-0 w-full">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                            isDone 
                              ? 'bg-emerald-600 text-white' 
                              : isActive
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                              : isWorking
                              ? 'bg-amber-500 text-slate-950'
                              : isSpecialRule
                              ? 'bg-red-600 text-white'
                              : isLocked
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {isLocked ? <Lock className="w-2.5 h-2.5" /> : step.stepNumber}
                          </div>
                          <span className="truncate text-[11px] font-bold leading-tight" title={step.title}>
                            {step.title}
                          </span>
                        </div>

                        {/* Bottom row: status pill and attachment icon */}
                        <div className="flex items-center justify-between text-[9px] pl-5 w-full">
                          <span className={`px-1.5 py-0.2 rounded font-bold truncate max-w-[100px] ${
                            isDone
                              ? 'bg-emerald-200/60 text-emerald-900'
                              : isActive 
                              ? 'bg-amber-400 text-slate-950 font-black' 
                              : isSpecialRule
                              ? 'bg-red-200/60 text-red-900 font-bold'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isDone ? '✓ Listo' : isActive ? '⚡ EN CURSO' : step.badgeText}
                          </span>

                          {hasAttachments && (
                            <Paperclip className="w-3 h-3 text-amber-600 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
