import React, { useState } from 'react';
import { AuthUser, UserRole } from '../types';
import { 
  getStoredUsers, 
  createOrUpdateUser, 
  deleteUser, 
  resetUsersToDefaults,
  getUserProjectAssignments,
  UserAssignmentsReport
} from '../utils/authStorage';
import { getStoredProjects } from '../utils/storage';
import { TCTLogo } from './TCTLogo';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  Edit3, 
  Trash2, 
  KeyRound, 
  Search, 
  Check, 
  AlertCircle, 
  RotateCcw, 
  Phone, 
  Mail, 
  Briefcase, 
  Lock, 
  Eye, 
  EyeOff,
  Sparkles,
  User,
  AlertTriangle,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';

interface UserManagementModalProps {
  currentUser: AuthUser;
  onClose: () => void;
  onUsersChanged?: (users: AuthUser[]) => void;
}

const JOB_TITLE_PRESETS = [
  'Director de Cámara',
  'Fotógrafo Principal',
  'Piloto Dron',
  'Editor & Ingest',
  'Asesor Comercial',
  'Técnico de Audio & Luces',
  'Coordinador de Producción',
  'Administrador General'
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  currentUser,
  onClose,
  onUsersChanged
}) => {
  const [users, setUsers] = useState<AuthUser[]>(getStoredUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  
  // Create / Edit modal sub-state
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('employee');
  const [formFullName, setFormFullName] = useState('');
  const [formJobTitle, setFormJobTitle] = useState('Director de Cámara');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deletion confirm modal sub-state with detailed assignments report
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [deleteReport, setDeleteReport] = useState<UserAssignmentsReport | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshUsersList = () => {
    const updated = getStoredUsers();
    setUsers(updated);
    if (onUsersChanged) onUsersChanged(updated);
  };

  // Open modal to Create new user
  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormUsername('');
    setFormPassword('');
    setFormRole('employee');
    setFormFullName('');
    setFormJobTitle('Director de Cámara');
    setFormPhone('');
    setFormEmail('');
    setFormIsActive(true);
    setShowPassword(false);
    setFormError(null);
    setIsEditing(true);
  };

  // Open modal to Edit existing user
  const handleOpenEdit = (u: AuthUser) => {
    setEditingUserId(u.id);
    setFormUsername(u.username);
    setFormPassword(u.password);
    setFormRole(u.role);
    setFormFullName(u.fullName);
    setFormJobTitle(u.jobTitle || '');
    setFormPhone(u.phone || '');
    setFormEmail(u.email || '');
    setFormIsActive(u.isActive);
    setShowPassword(false);
    setFormError(null);
    setIsEditing(true);
  };

  // Save form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = createOrUpdateUser({
      id: editingUserId || undefined,
      username: formUsername,
      password: formPassword,
      role: formRole,
      fullName: formFullName,
      jobTitle: formJobTitle,
      phone: formPhone,
      email: formEmail,
      isActive: formIsActive
    });

    if (result.success) {
      showToast(editingUserId ? `✓ Usuario "${formUsername}" actualizado al instante.` : `✓ Nuevo usuario "${formUsername}" creado y actualizado al instante.`);
      setIsEditing(false);
      refreshUsersList();
    } else {
      setFormError(result.error || 'Ocurrió un error al guardar el usuario.');
    }
  };

  // Toggle user active status
  const handleToggleStatus = (u: AuthUser) => {
    if (u.username.toUpperCase() === 'TCT') {
      showToast('⚠️ La cuenta principal "TCT" no se puede desactivar.');
      return;
    }

    const result = createOrUpdateUser({
      id: u.id,
      username: u.username,
      password: u.password,
      role: u.role,
      fullName: u.fullName,
      jobTitle: u.jobTitle,
      phone: u.phone,
      email: u.email,
      isActive: !u.isActive
    });

    if (result.success) {
      showToast(`Estado de "${u.username}" cambiado a ${!u.isActive ? 'Activo' : 'Inactivo'}.`);
      refreshUsersList();
    }
  };

  // Delete user trigger - prepares assignment details report
  const handleInitiateDeleteUser = (u: AuthUser) => {
    if (u.username.toUpperCase() === 'TCT') {
      showToast('⚠️ No se puede eliminar el usuario principal "TCT".');
      return;
    }

    const allProjects = getStoredProjects();
    const report = getUserProjectAssignments(u, allProjects);
    setUserToDelete(u);
    setDeleteReport(report);
  };

  // Confirm delete execution
  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const deletedName = userToDelete.fullName;
    const result = deleteUser(userToDelete.id);
    if (result.success) {
      showToast(`✓ Usuario "${deletedName}" eliminado y datos actualizados al instante.`);
      setUserToDelete(null);
      setDeleteReport(null);
      refreshUsersList();
    } else {
      showToast(`❌ Error: ${result.error}`);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (window.confirm('¿Restablecer las cuentas de usuarios a los valores predeterminados de Corporación TCT?')) {
      resetUsersToDefaults();
      refreshUsersList();
      showToast('✓ Cuentas de usuario restablecidas a valores de fábrica.');
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      u.username.toLowerCase().includes(q) || 
      u.fullName.toLowerCase().includes(q) || 
      (u.jobTitle && u.jobTitle.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q));
    
    return matchesRole && matchesQuery;
  });

  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const totalActive = users.filter(u => u.isActive).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 text-slate-900">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <TCTLogo size="sm" variant="icon-only" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Gestión de Usuarios y Accesos
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Panel de Administrador
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Creación y control de cuentas de Empleados y Administradores de Corporación TCT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black text-center shrink-0 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          
          {/* Top Stats Strip & Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Usuarios</span>
                <span className="text-lg font-black text-slate-900">{users.length}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <User className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Administradores</span>
                <span className="text-lg font-black text-amber-900">{totalAdmins}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-700 block">Empleados / Técnicos</span>
                <span className="text-lg font-black text-blue-900">{totalEmployees}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                id="btn-add-new-user"
                onClick={handleOpenCreate}
                className="w-full h-full min-h-[58px] px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Crear Nuevo Usuario</span>
              </button>
            </div>

          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, usuario, cargo..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-medium"
              />
            </div>

            {/* Role Filter Chips */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  roleFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({users.length})
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  roleFilter === 'admin'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admins ({totalAdmins})</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter('employee')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  roleFilter === 'employee'
                    ? 'bg-blue-600 text-white font-black'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Empleados ({totalEmployees})</span>
              </button>
            </div>

          </div>

          {/* User List Grid / Cards */}
          <div className="space-y-2.5">
            {filteredUsers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 space-y-2">
                <User className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-bold">No se encontraron usuarios con ese criterio de búsqueda.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setRoleFilter('all'); }}
                  className="text-xs text-amber-600 hover:underline font-bold"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isRootAdmin = u.username.toUpperCase() === 'TCT';
                const isCurrentLogged = u.id === currentUser.id;

                return (
                  <div
                    key={u.id}
                    className={`bg-white rounded-2xl p-4 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                      !u.isActive 
                        ? 'border-slate-200 bg-slate-50/70 opacity-75' 
                        : u.role === 'admin'
                        ? 'border-amber-200/80 hover:border-amber-400'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {/* User Info */}
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        u.role === 'admin'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {u.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900 truncate">
                            {u.fullName}
                          </h4>
                          
                          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            @{u.username}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}>
                            {u.role === 'admin' ? '👑 Admin' : '🎥 Empleado'}
                          </span>

                          {isRootAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                              RAÍZ
                            </span>
                          )}

                          {isCurrentLogged && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                              (Tú)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            {u.jobTitle || 'Técnico'}
                          </span>

                          {u.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.phone}
                            </span>
                          )}

                          {u.email && (
                            <span className="flex items-center gap-1 truncate max-w-xs">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {u.email}
                            </span>
                          )}

                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                            <KeyRound className="w-3 h-3 text-amber-500" />
                            Pass: {u.password}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      
                      {/* Active Status Badge / Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        disabled={isRootAdmin}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isRootAdmin ? 'Cuenta protegida' : 'Click para activar o desactivar'}
                      >
                        {u.isActive ? '✓ Activo' : '✕ Inactivo'}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
                        title="Editar usuario o cambiar contraseña"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      {!isRootAdmin && (
                        <button
                          type="button"
                          onClick={() => handleInitiateDeleteUser(u)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                          title="Eliminar usuario y verificar contratos/producciones asignadas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer info & Reset button */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Los nuevos usuarios creados tendrán acceso inmediato al sistema con sus credenciales.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-700 font-bold hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
              title="Restablecer cuentas por defecto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer cuentas</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Listo
            </button>
          </div>
        </div>

      </div>

      {/* Deletion Confirmation Modal with Contracts & Staff Productions Summary */}
      {userToDelete && deleteReport && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-white text-red-600 font-black">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">
                    Confirmar Eliminación de Usuario
                  </h3>
                  <p className="text-xs text-red-100 font-medium">
                    Verificación de contratos y personal técnico asignado
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setUserToDelete(null); setDeleteReport(null); }}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-red-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* User Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                  {userToDelete.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">{userToDelete.fullName}</div>
                  <div className="text-slate-500 font-medium">@{userToDelete.username} • {userToDelete.jobTitle || 'Personal'}</div>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-black uppercase ${
                    userToDelete.role === 'admin' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                  }`}>
                    {userToDelete.role === 'admin' ? 'Administrador' : 'Personal Técnico'}
                  </span>
                </div>
              </div>

              {/* Assignment Metric Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Contratos Vinculados:</span>
                  </div>
                  <div className="text-xl font-black text-amber-950 mt-1">
                    {deleteReport.totalContracts} contrato(s)
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Producciones Asignado:</span>
                  </div>
                  <div className="text-xl font-black text-blue-950 mt-1">
                    {deleteReport.totalStaffAssignments} evento(s)
                  </div>
                </div>
              </div>

              {/* Detailed Staff Productions List */}
              {deleteReport.staffProductions.length > 0 ? (
                <div className="space-y-2">
                  <div className="font-black text-slate-900 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-red-600" />
                    <span>Producciones donde irá como personal técnico:</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {deleteReport.staffProductions.map((prod, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-100/90 rounded-xl border border-slate-200 flex flex-col gap-1">
                        <div className="font-black text-slate-900 flex items-center justify-between">
                          <span className="truncate">{prod.title}</span>
                          <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                            {prod.uniqueCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {prod.eventDate}
                          </span>
                          {prod.eventLocation && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {prod.eventLocation}
                            </span>
                          )}
                          <span className="font-bold text-blue-700 ml-auto">
                            Rol: {prod.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-medium">
                  ✓ Este usuario no tiene producciones técnicas asignadas actualmente.
                </div>
              )}

              {/* Warning Notice */}
              <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200 text-[11px] leading-relaxed">
                <strong>Advertencia:</strong> Al eliminar este usuario, dejará de figurar en el directorio institucional y se actualizarán inmediatamente las listas del sistema.
              </div>

            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { setUserToDelete(null); setDeleteReport(null); }}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Usuario</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sub-modal: Form for Create or Edit User */}
      {isEditing && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-fadeIn">
            
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  {editingUserId ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {editingUserId ? 'Editar Usuario TCT' : 'Crear Nuevo Usuario TCT'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-100 border-b border-red-200 text-red-800 text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                  Rol de Acceso en el Sistema:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormRole('admin');
                      if (formJobTitle === 'Director de Cámara') setFormJobTitle('Administrador General');
                    }}
                    className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all ${
                      formRole === 'admin'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormRole('employee');
                      if (formJobTitle === 'Administrador General') setFormJobTitle('Director de Cámara');
                    }}
                    className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all ${
                      formRole === 'employee'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Empleado / Técnico</span>
                  </button>
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Usuario (Login): *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="Ej: jorge, TCT, etc."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contraseña: *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Contraseña de acceso"
                      className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nombre Completo: *
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Ej: Lic. Jorge Huamán"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Job Title / Cargo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cargo / Especialidad:
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                    placeholder="Ej: Director de Cámara, Fotógrafo Principal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  
                  {/* Preset chips */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {JOB_TITLE_PRESETS.slice(0, 5).map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormJobTitle(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                          formJobTitle === preset
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Info (Phone and Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Correo Electrónico:
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="usuario@corporaciontct.pe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center space-x-2 text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Usuario Activo (Permitir inicio de sesión inmediato)</span>
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
