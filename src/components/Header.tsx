import React, { useState, useEffect } from 'react';
import { UserRole, StaffMember, AuthUser } from '../types';
import { TCTLogo } from './TCTLogo';
import { 
  ShieldCheck, 
  UserCheck, 
  PlusCircle, 
  Sliders,
  Users,
  LogOut,
  User,
  Maximize2,
  Minimize2,
  Clapperboard,
  Video
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
  onOpenAnalytics: () => void;
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
  allUsers = [],
  onStaffChange,
  onUserSelect,
  onOpenNewProject,
  onOpenRulesModal,
  onLogout,
  activeProjectsCount
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen API not allowed or supported in this context:', err);
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
        const staffMatch = allStaff.find(s => s.id === selectedUser.id || s.name.toLowerCase() === selectedUser.fullName.toLowerCase()) || {
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
          
          {/* Official TCT Logo & Calligraphy Slogan Branding */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
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

          {/* Synthesized User Selector & Actions Panel (Top-Right Controls) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 ml-auto flex-wrap justify-end gap-y-1.5">
            
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
                  {currentUser?.role === 'admin' ? (
                    <select
                      id="select-active-system-user"
                      aria-label="Seleccionar usuario activo"
                      value={
                        currentRole === 'admin' 
                          ? (allUsers.find(u => u.role === 'admin')?.id || 'admin') 
                          : (currentStaff?.id || allStaff[0]?.id || '')
                      }
                      onChange={(e) => handleSelectUser(e.target.value)}
                      className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[190px] truncate pr-1"
                    >
                      {allUsers.length > 0 ? (
                        allUsers.map((usr) => (
                          <option key={usr.id} value={usr.id} className="bg-slate-900 text-white">
                            {usr.fullName}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="admin" className="bg-slate-900 text-white">
                            Ing. Michael RomeroReyes
                          </option>
                          {allStaff.map((st) => (
                            <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                              {st.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  ) : (
                    <span className="text-xs font-black text-white max-w-[140px] sm:max-w-[200px] truncate px-1">
                      {currentUser?.fullName || currentStaff.name}
                    </span>
                  )}

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

            {/* Master Rules Button (Visible for Admin users) */}
            {currentRole === 'admin' && (
              <button
                id="btn-open-rules-config"
                onClick={onOpenRulesModal}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/60 transition-all flex items-center justify-center text-xs font-black shadow-xs shrink-0 cursor-pointer"
                title="Reglas del Sistema (Configuración, Usuarios, Autoguardado)"
                aria-label="Reglas del Sistema"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {/* Pantalla Completa (Fullscreen API) Toggle Button */}
            <button
              id="btn-fullscreen-toggle"
              onClick={toggleFullscreen}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/50 transition-all flex items-center justify-center text-xs font-bold shadow-xs shrink-0 cursor-pointer"
              title={isFullscreen ? "Salir de Pantalla Completa" : "Modo Pantalla Completa (Inmersivo)"}
              aria-label="Pantalla Completa"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-amber-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {/* Nueva Producción Icon-Only Button */}
            <button
              id="btn-new-project-header"
              onClick={onOpenNewProject}
              className="relative p-2 sm:p-2.5 bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-600 text-slate-950 rounded-xl shadow-md hover:shadow-amber-500/20 transition-all shrink-0 cursor-pointer flex items-center justify-center group border border-amber-300"
              title="Nueva Producción / Emitir Contrato (Ctrl+N)"
              aria-label="Nueva Producción"
            >
              <Clapperboard className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
              {/* Subtle small badge plus */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-950 text-amber-400 font-black text-[9px] rounded-full flex items-center justify-center border border-amber-400 shadow-xs">
                +
              </span>
            </button>

            {/* Logout Button */}
            <button
              id="btn-logout-header"
              onClick={onLogout}
              className="p-2 sm:p-2.5 rounded-xl bg-red-950/50 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/50 transition-all flex items-center justify-center text-xs font-bold shadow-xs shrink-0 group cursor-pointer"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-red-300 group-hover:text-white transition-colors" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
