import React, { useRef } from 'react';
import { UserRole, StaffMember, AuthUser } from '../types';
import { TCTLogo } from './TCTLogo';
import { 
  Clapperboard,
  LogOut,
  Sliders
} from 'lucide-react';

interface HeaderProps {
  currentUser: AuthUser | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentStaff: StaffMember;
  allStaff: StaffMember[];
  allUsers?: AuthUser[];
  onStaffChange: (staff: StaffMember) => void;
  onUserSelect?: (user: AuthUser) => void;
  onOpenNewProject: () => void;
  onOpenAnalytics?: () => void;
  onOpenRulesModal?: () => void;
  onOpenUsersManagement?: () => void;
  onOpenCalendar?: () => void;
  onLogout?: (deepExit?: boolean) => void;
  onResetData?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeProjectsCount?: number;
  onGoBack?: () => void;
  onGoForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onRoleChange,
  currentStaff,
  allStaff,
  allUsers = [],
  onStaffChange,
  onUserSelect,
  onOpenNewProject,
  onOpenRulesModal,
  onLogout
}) => {
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Single click (Cerrar sesión) vs Double click (Salir completo del aplicativo)
  const handleExitClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimeoutRef.current) {
      // Second click within threshold -> Double Click (Deep Exit)
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      if (onLogout) {
        onLogout(true);
      }
    } else {
      // First click -> wait for potential second click
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        if (onLogout) {
          onLogout(false);
        }
      }, 280);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (onLogout) {
      onLogout(true);
    }
  };
  // Find current active user job title or cargo
  const activeUser = allUsers.find(u => 
    (currentRole === 'employee' && u.fullName === currentStaff.name) || 
    (currentRole === 'admin' && u.role === 'admin') ||
    u.id === currentUser?.id
  ) || currentUser;

  const currentJobTitle = currentRole === 'admin' 
    ? 'Administrador General' 
    : (currentStaff?.role || activeUser?.jobTitle || 'Técnico de Producción');

  const handleSelectUser = (userId: string) => {
    const selectedUser = allUsers.find(u => u.id === userId);
    if (selectedUser) {
      if (onUserSelect) {
        onUserSelect(selectedUser);
      }
      if (selectedUser.role === 'admin') {
        onRoleChange('admin');
      } else {
        onRoleChange('employee');
        const staffMatch = allStaff.find(s => s.id === selectedUser.id || (s.name && selectedUser.fullName && s.name.toLowerCase() === selectedUser.fullName.toLowerCase())) || {
          id: selectedUser.id,
          name: selectedUser.fullName,
          role: selectedUser.jobTitle || 'Técnico de Producción',
          phone: selectedUser.phone || '+51 900 000 000',
          confirmed: true
        };
        onStaffChange(staffMatch);
      }
    } else {
      const staffMatch = allStaff.find(s => s.id === userId);
      if (staffMatch) {
        onRoleChange('employee');
        onStaffChange(staffMatch);
      }
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between min-h-16 py-2 gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
          
          {/* Left Block: Official TCT Logo & Calligraphy Slogan Branding */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="flex items-center space-x-2">
              <TCTLogo size="md" variant="icon-only" />
              <div className="flex flex-col justify-center">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-sm sm:text-base md:text-lg tracking-wider text-white flex items-center leading-none">
                    CORPORACIÓN TCT
                  </span>
                </div>
                <span className="font-slogan text-xs sm:text-sm md:text-base text-amber-300 font-medium tracking-wide leading-tight select-none drop-shadow-sm mt-0.5">
                  Marcando Historia
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls Panel: User Selector & Nueva Producción CTA */}
          <div className="flex items-center space-x-2 sm:space-x-3 ml-auto flex-wrap justify-end gap-y-1.5">
            
            {/* User Switcher Dropdown with Cargo Badge */}
            <div className="flex items-center bg-slate-950/90 hover:bg-slate-950 p-1 sm:p-1.5 rounded-xl border border-slate-800 shadow-inner">
              <div className="flex items-center space-x-1.5 px-1.5 py-0.5">
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                  currentRole === 'admin' 
                    ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400' 
                    : 'bg-blue-500 text-white ring-1 ring-blue-400'
                }`}>
                  {currentRole === 'admin' ? '🛡️' : '👷'}
                </div>

                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <select
                    id="select-active-system-user"
                    aria-label="Seleccionar usuario activo"
                    value={
                      activeUser?.id || (currentRole === 'admin' 
                        ? (allUsers.find(u => u.role === 'admin')?.id || 'admin') 
                        : (currentStaff?.id || allStaff[0]?.id || ''))
                    }
                    onChange={(e) => handleSelectUser(e.target.value)}
                    className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate pr-1"
                  >
                    {allUsers.length > 0 ? (
                      allUsers.map((usr) => (
                        <option key={usr.id} value={usr.id} className="bg-slate-900 text-white font-bold">
                          {usr.role === 'admin' ? '🛡️ ' : '🎬 '} {usr.fullName}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="admin" className="bg-slate-900 text-white">
                          🛡️ Ing. Michael RomeroReyes
                        </option>
                        {allStaff.map((st) => (
                          <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                            🎬 {st.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>

                  {/* Role / Cargo Badge right beside user */}
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-xs ${
                    currentRole === 'admin'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                  }`}>
                    {currentJobTitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Reglas Maestras & Configuración Button (Admin Only) */}
            {currentRole === 'admin' && onOpenRulesModal && (
              <button
                id="btn-header-rules-admin"
                onClick={onOpenRulesModal}
                className="p-2 sm:px-3 sm:py-2.5 bg-slate-950/90 hover:bg-slate-800 active:scale-95 text-amber-400 hover:text-amber-300 rounded-xl border border-slate-800 hover:border-amber-400/50 shadow-inner transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 font-black text-xs group"
                title="Reglas Maestras, Personalización de Contrato & Configuración (Admin)"
                aria-label="Reglas y Configuración"
              >
                <Sliders className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
                <span className="hidden md:inline font-bold">Reglas</span>
              </button>
            )}

            {/* Nueva Producción Button */}
            <button
              id="btn-new-project-header"
              onClick={onOpenNewProject}
              className="relative p-2 sm:px-3.5 sm:py-2.5 bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-600 text-slate-950 rounded-xl shadow-md hover:shadow-amber-500/20 transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 group border border-amber-300 font-black text-xs"
              title="Nueva Producción / Emitir Contrato (Ctrl+N)"
              aria-label="Nueva Producción"
            >
              <Clapperboard className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Nueva Producción</span>
              {/* Subtle small badge plus on mobile */}
              <span className="sm:hidden absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-950 text-amber-400 font-black text-[9px] rounded-full flex items-center justify-center border border-amber-400 shadow-xs">
                +
              </span>
            </button>

            {/* Salir / Logout Button (Single Click: Logout / Double Click: Salir Completo) */}
            <button
              id="btn-header-logout"
              onClick={handleExitClick}
              onDoubleClick={handleDoubleClick}
              className="p-2 sm:px-3 sm:py-2.5 bg-slate-950/90 hover:bg-red-950/80 active:scale-95 text-slate-300 hover:text-red-300 rounded-xl border border-slate-800 hover:border-red-500/50 shadow-inner transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 font-black text-xs group"
              title="Salir: 1 Clic para Cerrar Sesión • Doble Clic para Salir del Sistema"
              aria-label="Salir"
            >
              <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden md:inline font-bold">Salir</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
