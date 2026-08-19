import React from 'react';
import { UserRole, StaffMember, AuthUser } from '../types';
import { TCTLogo } from './TCTLogo';
import { 
  ShieldCheck, 
  UserCheck, 
  PlusCircle, 
  Sliders,
  Users,
  LogOut
} from 'lucide-react';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface HeaderProps {
  currentUser: AuthUser | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentStaff: StaffMember;
  allStaff: StaffMember[];
  onStaffChange: (staff: StaffMember) => void;
  onOpenNewProject: () => void;
  onOpenAnalytics: () => void;
  onOpenExportLovableModal: () => void;
  onOpenRulesModal: () => void;
  onOpenUsersManagement: () => void;
  onLogout: () => void;
  onResetData: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeProjectsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onRoleChange,
  currentStaff,
  allStaff,
  onStaffChange,
  onOpenNewProject,
  onOpenAnalytics,
  onOpenExportLovableModal,
  onOpenRulesModal,
  onOpenUsersManagement,
  onLogout,
  onResetData,
  activeProjectsCount
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2 gap-2">
          
          {/* Official TCT Logo & Branding */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <TCTLogo size="md" variant="icon-only" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm sm:text-lg tracking-wider text-white flex items-center gap-1.5">
                  CORPORACIÓN TCT
                </span>
                <span className="hidden lg:inline px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  PRODUCCIÓN AUDIOVISUAL
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Monitoreo, Eventos y Entregables • {activeProjectsCount} producciones activas
              </p>
            </div>
          </div>

          {/* Right Actions & User Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* "Reglas" Master Rules Button (Access to Rules, Users, System View, Shortcuts, and Sync status) */}
            <button
              id="btn-open-rules-config"
              onClick={onOpenRulesModal}
              className="px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/60 transition-all flex items-center gap-2 text-xs font-black shadow-xs shrink-0 cursor-pointer"
              title="Configurar Reglas Maestras TCT, Usuarios, Vista de Sistema y Atajos"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-black">Reglas & Sistema</span>
            </button>

            {/* New Project CTA (Only for Admin) */}
            {currentRole === 'admin' && (
              <button
                id="btn-new-project-header"
                onClick={onOpenNewProject}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
                title="Registrar nueva producción y emitir contrato (Ctrl+N)"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">+ Nueva Producción</span>
                <span className="text-[10px] bg-slate-950/20 px-1 py-0.2 rounded font-mono font-bold hidden lg:inline">
                  Ctrl+N
                </span>
              </button>
            )}

            {/* Logged User Info displaying who is using the system on this machine */}
            <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-800 space-x-1.5 shrink-0">
              <div className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 px-2.5 sm:px-3 py-1 rounded-xl border border-slate-700 text-left">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                  currentUser?.role === 'admin' || currentRole === 'admin'
                    ? 'bg-amber-500 text-slate-950' 
                    : 'bg-blue-500 text-white'
                }`}>
                  {(currentUser?.username || 'TC').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-[11px] font-black text-white truncate max-w-[130px]" title={currentUser?.username || 'Usuario TCT'}>
                    👤 {currentUser?.username || 'Ing. Roberto Acuña'}
                  </p>
                  <p className="text-[9px] text-slate-400 truncate max-w-[130px]">
                    {currentUser?.role === 'admin' ? '🛡️ Admin • Equipo Local' : `👷 ${currentUser?.jobTitle || 'Técnico'} • Terminal`}
                  </p>
                </div>
              </div>

              {/* Logout Button (Icon only) */}
              <button
                id="btn-logout-header"
                onClick={onLogout}
                className="p-2 rounded-xl bg-red-950/50 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/50 transition-all flex items-center justify-center text-xs font-bold shadow-xs shrink-0 group cursor-pointer"
                title="Cerrar sesión del aplicativo"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 text-red-300 group-hover:text-white transition-colors" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
