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
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            
            {/* Sync & Connectivity Status Indicator */}
            <SyncStatusIndicator />

            {/* Admin-only: Manage Users Button */}
            {currentRole === 'admin' && (
              <button
                id="btn-open-users-mgmt"
                onClick={onOpenUsersManagement}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white border border-blue-400/40 transition-all flex items-center gap-1.5 text-xs font-black shadow-xs shrink-0"
                title="Gestionar Cuentas de Usuarios: Administradores y Empleados (Crear, Editar, Passwords)"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Usuarios</span>
              </button>
            )}

            {/* "Reglas" Master Rules Button */}
            <button
              id="btn-open-rules-config"
              onClick={onOpenRulesModal}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-400/40 transition-all flex items-center gap-1.5 text-xs font-black shadow-xs shrink-0"
              title="Configurar Reglas Maestras TCT: Checklists, Equipos, Paquetes, Proformas y Formatos"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Reglas</span>
            </button>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-inner shrink-0">
              <button
                id="btn-role-admin"
                onClick={() => onRoleChange('admin')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Cambiar a Vista de Administrador"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
              
              <button
                id="btn-role-employee"
                onClick={() => onRoleChange('employee')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentRole === 'employee'
                    ? 'bg-blue-500 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Cambiar a Vista de Técnico"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Técnico</span>
              </button>
            </div>

            {/* Staff Switcher for employee role */}
            {currentRole === 'employee' && (
              <select
                value={currentStaff.id}
                onChange={(e) => {
                  const found = allStaff.find(s => s.id === e.target.value);
                  if (found) onStaffChange(found);
                }}
                className="hidden lg:block text-xs bg-slate-800 text-amber-300 font-bold border border-slate-700 rounded-xl p-1.5 cursor-pointer max-w-[130px] truncate"
                title="Cambiar técnico actual"
              >
                {allStaff.map(st => (
                  <option key={st.id} value={st.id}>
                    👤 {st.name.split(' ')[0]} ({st.role.split(' ')[0]})
                  </option>
                ))}
              </select>
            )}

            {/* New Project CTA (Only for Admin) */}
            {currentRole === 'admin' && (
              <button
                id="btn-new-project-header"
                onClick={onOpenNewProject}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all shrink-0"
                title="Registrar nueva producción y emitir contrato"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">+ Producción</span>
              </button>
            )}

            {/* Logged User Info & Logout Button (Icon only) */}
            <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-800 space-x-1.5 shrink-0">
              {currentUser && (
                <div className="hidden xl:flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-left">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                    currentUser.role === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-blue-500 text-white'
                  }`}>
                    {currentUser.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[11px] font-black text-white truncate max-w-[90px]">
                      {currentUser.username}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate max-w-[90px]">
                      {currentUser.role === 'admin' ? 'Admin' : currentUser.jobTitle?.split(' ')[0] || 'Técnico'}
                    </p>
                  </div>
                </div>
              )}

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
