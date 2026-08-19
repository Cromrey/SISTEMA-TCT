import React, { useState } from 'react';
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
  Paperclip,
  QrCode
} from 'lucide-react';
import { CalendarView } from './CalendarView';
import { ProjectQrCheckinModal } from './ProjectQrCheckinModal';

interface StaffDashboardProps {
  projects: ProductionProject[];
  currentStaff: StaffMember;
  onOpenProject: (project: ProductionProject) => void;
  onOpenAnalytics?: () => void;
  onUpdateProject?: (project: ProductionProject) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  projects,
  currentStaff,
  onOpenProject,
  onUpdateProject
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'calendar'>('events');
  const [qrProject, setQrProject] = useState<ProductionProject | null>(null);

  // Filter projects where this technician is assigned
  const myProjects = projects.filter(p => {
    if (p.isArchived) return false;
    return p.assignedStaff.some(s => s.id === currentStaff.id || s.name === currentStaff.name);
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
  const myCompliancePercent = Math.round((myDoneSteps / (myTotalSteps || 1)) * 100);

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = myProjects.filter(p => p.eventDate >= todayStr);

  return (
    <div className="space-y-6">
      
      {/* Staff Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg border-2 border-slate-900">
            {currentStaff.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
                TÉCNICO ASIGNADO
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Corporación TCT
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              ¡Hola, {currentStaff.name}!
            </h2>
            <p className="text-xs text-slate-300">
              Rol: <strong>{currentStaff.role}</strong> • Tienes <strong>{myProjects.length} eventos contratados</strong> bajo tu responsabilidad técnica.
            </p>
          </div>
        </div>
      </div>

      {/* Staff Personal KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: My Assigned Events */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Mis Producciones</span>
            <div className="p-2 bg-blue-100 rounded-xl text-blue-900">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{myProjects.length}</span>
            <span className="text-xs text-slate-500 font-medium ml-1.5">contratadas</span>
          </div>
          <div className="text-[10px] text-blue-600 font-bold mt-1">
            {upcomingEvents.length} próximas fechas
          </div>
        </div>

        {/* KPI 2: Step Compliance % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Mi Cumplimiento</span>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-900">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-700">{myCompliancePercent}%</span>
            <span className="text-xs text-slate-500 font-medium ml-1.5">de pasos</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">
            {myDoneSteps} de {myTotalSteps} pasos validados
          </div>
        </div>

        {/* KPI 3: Contracted Budget in S/. */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Monto de Contratos</span>
            <div className="p-2 bg-amber-100 rounded-xl text-amber-900">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-700">S/. {totalMyBudget.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Producciones asignadas
          </div>
        </div>

        {/* KPI 4: 7:00 PM Protocol Alert */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Regla 7:00 PM</span>
            <div className="p-2 bg-red-100 rounded-xl text-red-900">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-red-600">Cobro Obligatorio</span>
          </div>
          <div className="text-[10px] text-red-700 font-bold mt-1">
            Cobro en mano antes de 7:00 PM
          </div>
        </div>

      </div>

      {/* Sub Tabs: Events List vs Calendar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              activeSubTab === 'events' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Mis Eventos Asignados ({myProjects.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              activeSubTab === 'calendar' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mi Calendario de Trabajo</span>
          </button>
        </div>
      </div>

      {/* Tab 1: My Events Cards */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          {myProjects.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 text-base">
                No tienes eventos asignados actualmente
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                La administración de Corporación TCT asignará nuevos contratos a tu perfil según el calendario de rodaje.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {myProjects.map((project) => {
                let totalSteps = 0;
                let doneSteps = 0;
                project.phases.forEach(p => p.steps.forEach(s => {
                  totalSteps++;
                  if (s.status === 'completed') doneSteps++;
                }));
                const percent = Math.round((doneSteps / (totalSteps || 12)) * 100);

                const isToday = project.eventDate === todayStr;
                const isActivelyWorking = !project.isArchived && percent < 100;

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
                            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                              {percent}%
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {doneSteps}/12 pasos
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden p-0.5 border border-slate-700">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          Presupuesto: <strong className="text-slate-900">S/. {project.totalBudget.toLocaleString()}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQrProject(project)}
                            className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
                            title="Escanear o Registrar Llegada a Locación"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>QR Check-in</span>
                          </button>

                          <button
                            onClick={() => onOpenProject(project)}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
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

      {/* QR Code Check-in Modal */}
      {qrProject && (
        <ProjectQrCheckinModal
          project={qrProject}
          isOpen={Boolean(qrProject)}
          onClose={() => setQrProject(null)}
          onUpdateProject={(updated) => {
            if (onUpdateProject) {
              onUpdateProject(updated);
            }
            setQrProject(updated);
          }}
        />
      )}

    </div>
  );
};
