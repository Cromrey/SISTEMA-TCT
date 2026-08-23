import React, { useState, useEffect } from 'react';
import { ProductionProject, StaffMember, SmartAlert } from '../types';
import { 
  Film, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles, 
  HardDrive,
  Eye,
  TrendingUp,
  User,
  Paperclip
} from 'lucide-react';
import { CalendarView } from './CalendarView';
import { getProjectProgressInfo } from '../utils/projectProgress';

interface StaffDashboardProps {
  projects: ProductionProject[];
  currentStaff: StaffMember;
  onOpenProject: (project: ProductionProject) => void;
  onOpenAnalytics?: () => void;
  onUpdateProject?: (project: ProductionProject) => void;
  onOpenNewProject?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  projects,
  currentStaff,
  onOpenProject,
  onUpdateProject,
  onOpenNewProject
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'calendar'>('events');

  useEffect(() => {
    const handleSwitchTab = (e: CustomEvent<{ view: string }>) => {
      if (e.detail?.view === 'calendar') {
        setActiveSubTab('calendar');
      } else if (e.detail?.view === 'list') {
        setActiveSubTab('events');
      }
    };
    window.addEventListener('tct_switch_tab' as any, handleSwitchTab);
    return () => {
      window.removeEventListener('tct_switch_tab' as any, handleSwitchTab);
    };
  }, []);

  // Filter projects strictly for this staff member (assigned staff or contract advisor)
  const myProjects = projects.filter(p => {
    if (p.isArchived) return false;
    const staffNameLower = (currentStaff.name || '').toLowerCase().trim();
    const isAssigned = p.assignedStaff && p.assignedStaff.some(s => 
      s.id === currentStaff.id || 
      (s.name && s.name.toLowerCase().trim() === staffNameLower) ||
      (s.name && staffNameLower && s.name.toLowerCase().includes(staffNameLower))
    );
    const isContractHolder = p.contractHolder && staffNameLower && p.contractHolder.toLowerCase().includes(staffNameLower);
    return isAssigned || isContractHolder;
  });

  // KPI Calculations for this staff member
  const totalMyBudget = myProjects.reduce((acc, p) => acc + p.totalBudget, 0);
  
  let myTotalSteps = 0;
  let myDoneSteps = 0;
  myProjects.forEach(p => {
    p.phases.forEach(ph => {
      ph.steps.forEach(st => {
        myTotalSteps++;
        if (st.status === 'completed') myDoneSteps++;
      });
    });
  });

  const overallStaffProgress = myTotalSteps > 0 ? ((myDoneSteps / myTotalSteps) * 100).toFixed(2) : '0.00';
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Staff Greeting & Direct Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
              Panel Técnico TCT
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Rol: <strong>{currentStaff.role}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Hola, {currentStaff.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Tienes <strong>{myProjects.length} eventos asignados</strong> bajo tu responsabilidad operativa.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {onOpenNewProject && (
            <button
              onClick={onOpenNewProject}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ Nueva Producción</span>
            </button>
          )}

          <button
            onClick={() => setActiveSubTab(activeSubTab === 'events' ? 'calendar' : 'events')}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>{activeSubTab === 'events' ? 'Ver Calendario' : 'Ver Mis Eventos'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Eventos Asignados</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {myProjects.length}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold block mt-0.5">
            En seguimiento activo
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Avance Promedio</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1">
            {overallStaffProgress}%
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {myDoneSteps} de {myTotalSteps} pasos ejecutados
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Presupuesto Asignado</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
            S/. {totalMyBudget.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Monto total en eventos
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">SLA & Entregas</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
            100%
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
            Cumplimiento en plazo
          </span>
        </div>

      </div>

      {/* Main Content Area */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-500" />
              <span>Mis Eventos & Producciones Activas ({myProjects.length})</span>
            </h3>
          </div>

          {myProjects.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs space-y-2">
              <Film className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No tienes producciones asignadas actualmente.</p>
              <p className="text-slate-400">El administrador te asignará eventos o puedes registrar uno nuevo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myProjects.map((project) => {
                const isToday = project.eventDate === todayStr;
                const progressInfo = getProjectProgressInfo(project);

                let totalSteps = 0;
                let doneSteps = 0;
                project.phases.forEach(ph => ph.steps.forEach(st => {
                  totalSteps++;
                  if (st.status === 'completed') doneSteps++;
                }));

                const isActivelyWorking = !project.isArchived && progressInfo.percentage < 100;

                // Find active milestone
                let activeStepNum = 1;
                let activeStepTitle = 'Recepción Inicial';
                for (const ph of project.phases) {
                  for (const st of ph.steps) {
                    if (st.status === 'in_progress') {
                      activeStepNum = st.stepNumber;
                      activeStepTitle = st.title;
                      break;
                    }
                  }
                }

                return (
                  <div 
                    key={project.id}
                    className={`rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between space-y-4 shadow-xs ${
                      isActivelyWorking 
                        ? 'animate-subtle-pulse bg-gradient-to-br from-amber-50/30 via-white to-amber-50/20 border-amber-400/90' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="font-mono text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-300">
                            {project.uniqueCode}
                          </span>
                          <span className="font-mono text-[11px] font-bold bg-slate-900 text-slate-100 px-2 py-0.5 rounded-lg">
                            {project.contractNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            {project.eventType}
                          </span>
                        </div>

                        {isToday && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse shadow-xs">
                            🔴 EVENTO HOY
                          </span>
                        )}
                      </div>

                      <h3 
                        onClick={() => onOpenProject(project)}
                        className="text-base sm:text-lg font-black text-slate-900 hover:text-amber-600 cursor-pointer transition-colors leading-snug"
                      >
                        {project.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span><strong>Fecha:</strong> {project.eventDate} ({project.eventTime || 'Horario pactado'})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate"><strong>Locación:</strong> {project.eventLocation}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>Cliente:</strong> {project.clientName} ({project.clientPhone})</span>
                        </div>
                      </div>
                    </div>

                    {/* Highlighted Progress and Milestone Block */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      
                      <div className="bg-slate-950 text-white p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase tracking-wide bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              Paso {activeStepNum}/12
                            </span>
                            <div className="text-xs font-bold text-slate-200 truncate max-w-[180px] sm:max-w-[220px] mt-0.5">
                              {activeStepTitle}
                            </div>
                          </div>

                          <div className="text-right">
                            {progressInfo.isValidated ? (
                              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                                {progressInfo.formattedPercentage}
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 text-right justify-end">
                                <span className="text-[9px] bg-red-950 text-red-300 px-1 py-0.5 rounded border border-red-800">❌ Bloqueado</span>
                                <span className="text-lg font-black text-red-400 font-mono line-through opacity-75">
                                  {progressInfo.formattedPercentage}
                                </span>
                              </div>
                            )}
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {doneSteps}/12 pasos
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden p-0.5 border border-slate-700">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressInfo.isValidated
                                ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400'
                                : 'bg-gradient-to-r from-red-500 to-amber-500 opacity-60'
                            }`}
                            style={{ width: `${progressInfo.percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          Presupuesto: <strong className="text-slate-900">S/. {project.totalBudget.toLocaleString()}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenProject(project)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Gestionar 12 Pasos</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Calendar for Staff */}
      {activeSubTab === 'calendar' && (
        <CalendarView
          projects={projects}
          currentStaffId={currentStaff.id}
          onOpenProject={onOpenProject}
        />
      )}

    </div>
  );
};
