import React, { useRef } from 'react';
import { UserRole, StaffMember, AuthUser } from '../types';
import { TCTLogo } from './TCTLogo';
import { 
  Clapperboard,
  LogOut,
  Sliders,
  ArrowLeft,
  ArrowRight,
  Film
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
  onOpenVideoclip?: () => void;
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
  onOpenVideoclip,
  onOpenRulesModal,
  onLogout,
  onGoBack,
  onGoForward
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
  // Identity resolution strictly tied to current authenticated user
  const isEmployee = (currentUser?.role === 'employee') || (currentRole === 'employee');
  const isAdmin = !isEmployee && ((currentUser?.role === 'admin') || (currentRole === 'admin'));

  // Clean admin name if it contains bracketed suffix
  const adminCleanName = currentUser?.fullName 
    ? currentUser.fullName.replace(/\s*\(Administrador.*?\)/i, '')
    : 'Michael Romero';

  const displayName = isEmployee 
    ? (currentUser?.fullName || currentStaff?.name || 'Elim Zucira')
    : adminCleanName;

  const displayRole: UserRole = isEmployee ? 'employee' : 'admin';
  const displayJobTitle = isEmployee
    ? (currentUser?.jobTitle || currentStaff?.role || 'Asesor Comercial / Técnico de Producción')
    : 'Administrador General';

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
          
          {/* Left Block: Official TCT Logo, Calligraphy Slogan & Navigation Icons */}
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

            {/* Atrás & Adelante Navigation Icon Controls */}
            <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 ml-1">
              <button
                type="button"
                id="btn-nav-back"
                onClick={onGoBack}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-all cursor-pointer group shadow-xs"
                title="Atrás (Cerrar modal o volver a la vista principal)"
                aria-label="Atrás"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <button
                type="button"
                id="btn-nav-forward"
                onClick={onGoForward}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-all cursor-pointer group shadow-xs"
                title="Adelante (Abrir producción activa o siguiente elemento)"
                aria-label="Adelante"
              >
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Controls Panel: User Selector, Reglas, Nueva Producción & Salir */}
          <div className="flex items-center space-x-2 sm:space-x-3 ml-auto flex-wrap justify-end gap-y-1.5">
            
            {/* User Profile Info with Cargo Badge */}
            <div className="flex items-center bg-slate-950/90 p-1 sm:p-1.5 rounded-xl border border-slate-800 shadow-inner">
              <div className="flex items-center space-x-1.5 px-1.5 py-0.5">
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                  displayRole === 'admin' 
                    ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400' 
                    : 'bg-blue-500 text-white ring-1 ring-blue-400'
                }`}>
                  {displayRole === 'admin' ? '🛡️' : '🎬'}
                </div>

                <div className="flex items-center space-x-1.5 max-w-[160px] sm:max-w-[240px]">
                  <span className="text-xs font-black text-white truncate" title={`${displayName} • ${displayJobTitle}`}>
                    {displayName}
                  </span>

                  {/* Role / Cargo Badge right beside user */}
                  <span className={`hidden sm:inline-block px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-xs ${
                    displayRole === 'admin'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                  }`}>
                    {displayJobTitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Videoclip / Tomas en Vivo Button (Available for Admin and Employee) */}
            {onOpenVideoclip && (
              <button
                id="btn-header-videoclip"
                onClick={onOpenVideoclip}
                className="relative p-2 sm:px-3.5 sm:py-2.5 bg-gradient-to-r from-purple-900/90 via-slate-900 to-amber-950/80 hover:from-purple-800 hover:to-amber-900 active:scale-95 text-amber-300 hover:text-amber-200 rounded-xl border border-amber-500/50 hover:border-amber-400 shadow-md shadow-purple-950/40 transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 font-black text-xs group"
                title="Módulo Videoclip: Registro y Gestión de Tomas en Vivo"
                aria-label="Videoclip y Tomas"
              >
                <Film className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-mono">🎬 Videoclip</span>
                <span className="sm:hidden text-[10px] font-mono">🎬</span>
              </button>
            )}

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
              <span className="sm:hidden absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-950 text-amber-400 font-black text-[9px] rounded-full flex items-center justify-center border border-amber-400 shadow-xs">
                +
              </span>
            </button>

            {/* Salir / Logout Button */}
            <button
              id="btn-header-logout"
              onClick={handleExitClick}
              onDoubleClick={handleDoubleClick}
              className="px-2.5 py-2 sm:px-3.5 sm:py-2.5 bg-red-950/70 hover:bg-red-900 active:scale-95 text-red-200 hover:text-white rounded-xl border border-red-800/80 hover:border-red-500 shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 font-black text-xs group"
              title="Salir: 1 Clic para Cerrar Sesión • Doble Clic para Salir del Sistema"
              aria-label="Salir del sistema"
            >
              <LogOut className="w-4 h-4 text-red-400 group-hover:text-white group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-bold">Salir</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
