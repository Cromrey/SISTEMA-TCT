import React, { useState } from 'react';
import { ProductionProject } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  Receipt, 
  ChevronRight, 
  ExternalLink, 
  Flame, 
  CheckCircle2, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileCheck,
  User,
  ArrowRight,
  Filter
} from 'lucide-react';

interface OverdueIssue {
  projectId: string;
  project: ProductionProject;
  type: '7pm_field_payment' | 'video_15d_sla' | 'photobook_30d_sla' | 'nas_backup_pending' | 'closing_delay';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  daysOverdue: number;
  actionRequired: string;
  stepNumber: number;
}

interface SlaOverdueAlertsBannerProps {
  projects: ProductionProject[];
  onOpenProject: (project: ProductionProject) => void;
  onFilterByOverdue?: () => void;
  onOpenContract?: (project: ProductionProject) => void;
}

export const SlaOverdueAlertsBanner: React.FC<SlaOverdueAlertsBannerProps> = ({
  projects,
  onOpenProject,
  onFilterByOverdue,
  onOpenContract
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date(todayStr).getTime();

  // Scan all projects for SLA breaches & overdue deadlines
  const overdueIssues: OverdueIssue[] = [];

  projects.forEach((proj) => {
    if (proj.isArchived) return;

    const eventTime = new Date(proj.eventDate).getTime();
    const diffDaysFromEvent = Math.round((nowTime - eventTime) / 86400000);

    // 1. Check: 7:00 PM Field Payment Rule on Event Day or Past Event
    const step7 = proj.phases[2]?.steps[1];
    const isStep7Paid = step7?.fieldPaymentData?.paymentStatus === 'paid';
    const isToday = proj.eventDate === todayStr;

    if (isToday && !isStep7Paid && proj.finalBalance > 0) {
      overdueIssues.push({
        projectId: proj.id,
        project: proj,
        type: '7pm_field_payment',
        severity: 'critical',
        title: '🚨 REGLA ESTRICTA 7:00 PM: Cobro en Campo Hoy',
        description: `El evento es HOY. Saldo pendiente: S/. ${proj.finalBalance.toLocaleString()}. Si no se cancela o prorroga antes de 7:00 PM, aplica retiro de personal.`,
        daysOverdue: 0,
        actionRequired: 'Registrar cobro de saldo o reporte de prórroga en Paso 7',
        stepNumber: 7
      });
    } else if (eventTime < nowTime && !isStep7Paid && proj.finalBalance > 0) {
      const overdueDays = Math.max(1, diffDaysFromEvent);
      overdueIssues.push({
        projectId: proj.id,
        project: proj,
        type: '7pm_field_payment',
        severity: 'critical',
        title: '⚠️ Saldo en Campo Sin Liquidar (Evento Pasado)',
        description: `El evento concluyó hace ${overdueDays} día(s) y mantiene un saldo pendiente de S/. ${proj.finalBalance.toLocaleString()}.`,
        daysOverdue: overdueDays,
        actionRequired: 'Contactar al cliente y registrar voucher de cancelación',
        stepNumber: 7
      });
    }

    // 2. Check: Video Master 4K ProRes 15 Days SLA (Step 9)
    const step9 = proj.phases[3]?.steps[0];
    if (step9 && step9.status === 'in_progress') {
      if (diffDaysFromEvent > 15) {
        const daysOver = diffDaysFromEvent - 15;
        overdueIssues.push({
          projectId: proj.id,
          project: proj,
          type: 'video_15d_sla',
          severity: 'critical',
          title: `⚠️ Retraso en Video USB (Excede SLA de 15 Días por +${daysOver}d)`,
          description: `Han transcurrido ${diffDaysFromEvent} días desde el evento (${proj.eventDate}). La entrega en estuche USB 4K se encuentra vencida.`,
          daysOverdue: daysOver,
          actionRequired: 'Priorizar render en DaVinci/Premiere y notificar a cliente',
          stepNumber: 9
        });
      }
    }

    // 3. Check: Photobook 30 Days SLA (Step 11)
    const step11 = proj.phases[4]?.steps[0];
    if (proj.includesPhotobook && step11 && step11.status === 'in_progress') {
      if (diffDaysFromEvent > 30) {
        const daysOver = diffDaysFromEvent - 30;
        overdueIssues.push({
          projectId: proj.id,
          project: proj,
          type: 'photobook_30d_sla',
          severity: 'warning',
          title: `📖 Fotolibro Impreso Retrasado (+${daysOver}d sobre SLA)`,
          description: `Han transcurrido ${diffDaysFromEvent} días desde el evento. Plazo máximo de imprenta: 30 días calendario.`,
          daysOverdue: daysOver,
          actionRequired: 'Acelerar maqueta y despacho de empastado de lujo',
          stepNumber: 11
        });
      }
    }

    // 4. Check: Backup RAW NAS (Step 8) pending for past events
    const step8 = proj.phases[2]?.steps[2];
    if (eventTime < nowTime && step8 && step8.status !== 'completed' && diffDaysFromEvent >= 2) {
      overdueIssues.push({
        projectId: proj.id,
        project: proj,
        type: 'nas_backup_pending',
        severity: 'warning',
        title: `💾 Ingest y Respaldo NAS Pendiente (+${diffDaysFromEvent}d)`,
        description: `Las tarjetas SD del evento aún no cuentan con verificación dual de backup en NAS RAID.`,
        daysOverdue: diffDaysFromEvent,
        actionRequired: 'Cargar bitácora de Ingest con total de GB respaldados',
        stepNumber: 8
      });
    }
  });

  if (overdueIssues.length === 0) {
    return null; // No alerts needed when all SLAs are on time
  }

  const criticalCount = overdueIssues.filter(i => i.severity === 'critical').length;
  const warningCount = overdueIssues.filter(i => i.severity === 'warning').length;

  return (
    <div className="bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 text-white rounded-2xl border border-red-500/50 shadow-lg overflow-hidden transition-all">
      
      {/* Banner Top Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3 border-b border-red-500/30">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-600/30 rounded-xl border border-red-500 text-red-300 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <h3 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                Alertas de Plazos y SLA Vencidos TCT
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                {overdueIssues.length} {overdueIssues.length === 1 ? 'PROYECTO REQUIERE ATENCIÓN' : 'PROYECTOS EN ALERTA'}
              </span>
            </div>
            <p className="text-xs text-red-200/80 mt-0.5">
              {criticalCount > 0 && <span className="font-bold text-red-300 mr-2">🚨 {criticalCount} Crítico(s)</span>}
              {warningCount > 0 && <span className="font-bold text-amber-300">⚠️ {warningCount} Advertencia(s)</span>}
              {' '}• Acciones inmediatas para preservar el cumplimiento contractual
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onFilterByOverdue && (
            <button
              onClick={onFilterByOverdue}
              className="px-3 py-1.5 rounded-xl bg-red-600/40 hover:bg-red-600 text-white text-xs font-bold border border-red-500/60 transition-all flex items-center gap-1.5"
              title="Filtrar la lista de expedientes por los que tienen plazos vencidos"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Ver Solo Vencidos</span>
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Overdue Issues List */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-3 bg-slate-950/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {overdueIssues.map((issue, idx) => {
              const isCritical = issue.severity === 'critical';
              return (
                <div 
                  key={`${issue.projectId}-${issue.type}-${idx}`}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    isCritical 
                      ? 'bg-red-950/40 border-red-500/60 hover:border-red-400 shadow-xs' 
                      : 'bg-amber-950/30 border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <div className="space-y-2">
                    
                    {/* Header with Project Code & Days Overdue */}
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                          {issue.project.uniqueCode}
                        </span>
                        <span className="font-mono text-[10px] text-slate-300">
                          {issue.project.contractNumber}
                        </span>
                      </div>

                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                      }`}>
                        {issue.daysOverdue > 0 ? `+${issue.daysOverdue} días vencido` : 'Vence Hoy'}
                      </span>
                    </div>

                    {/* Title & Client */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                        {issue.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2">
                        <span><strong>Evento:</strong> {issue.project.title}</span>
                        <span>•</span>
                        <span><strong>Cliente:</strong> {issue.project.clientName} ({issue.project.clientPhone})</span>
                      </p>
                    </div>

                    {/* Description & Action Required */}
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                      <p className="text-slate-300 text-[11px]">
                        {issue.description}
                      </p>
                      <p className="text-amber-300 font-bold text-[11px] flex items-center gap-1 pt-0.5">
                        <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                        <span><strong>Acción:</strong> {issue.actionRequired}</span>
                      </p>
                    </div>

                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold">
                      Hito Paso {issue.stepNumber} de 12
                    </span>

                    <div className="flex items-center space-x-2">
                      {onOpenContract && (
                        <button
                          onClick={() => onOpenContract(issue.project)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <FileCheck className="w-3 h-3 text-emerald-400" />
                          <span>Contrato</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenProject(issue.project)}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] transition-all flex items-center gap-1 shadow-xs"
                      >
                        <span>Atender en Paso {issue.stepNumber}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
