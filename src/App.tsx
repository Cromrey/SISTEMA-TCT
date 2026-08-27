import React, { useState, useEffect, useRef } from 'react';
import { ProductionProject, UserRole, StaffMember, AuthUser } from './types';
import { 
  getStoredProjects, 
  initStorage, 
  saveProjects, 
  resetToDemoData, 
  generateSmartAlerts, 
  generateDecisionInsights 
} from './utils/storage';
import { initRulesStorage } from './utils/rulesStorage';
import { 
  getActiveSession, 
  setActiveSession, 
  getStoredUsers, 
  usersToStaffMembers,
  isSessionSuperceded,
  getDeviceSessionToken
} from './utils/authStorage';
import { LoginPage } from './components/LoginPage';
import { UserManagementModal } from './components/UserManagementModal';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { NewProjectModal } from './components/NewProjectModal';
import { ComparativeAnalyticsModal } from './components/ComparativeAnalyticsModal';
import { ReportPrintModal } from './components/ReportPrintModal';
import { ContractExportModal } from './components/ContractExportModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { DeleteProjectConfirmModal } from './components/DeleteProjectConfirmModal';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { RotateCcw, Sparkles, CheckCircle2, ShieldCheck, UserCheck, AlertTriangle, X, Trash2 } from 'lucide-react';

const INITIAL_FALLBACK_STAFF: StaffMember[] = [
  { id: 'usr-emp-carlos', name: 'Carlos Mendoza', role: 'Director de Cámara', phone: '+51 912 345 678', confirmed: true },
  { id: 'usr-emp-valeria', name: 'Valeria Castro', role: 'Fotógrafo Principal', phone: '+51 923 456 789', confirmed: true },
  { id: 'usr-emp-jorge', name: 'Jorge Huamán', role: 'Piloto Dron', phone: '+51 934 567 890', confirmed: true },
  { id: 'usr-emp-pedro', name: 'Pedro Alva', role: 'Editor & Ingest', phone: '+51 945 678 901', confirmed: true }
];

// Inactivity timeout: 60 minutes = 3,600,000 milliseconds (Safe background threshold)
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getActiveSession());
  const [allUsers, setAllUsers] = useState<AuthUser[]>(() => getStoredUsers());
  const [allStaff, setAllStaff] = useState<StaffMember[]>(() => {
    const users = getStoredUsers();
    const converted = usersToStaffMembers(users);
    return converted.length > 0 ? converted : INITIAL_FALLBACK_STAFF;
  });

  const [projects, setProjects] = useState<ProductionProject[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const session = getActiveSession();
    return session ? session.role : 'admin';
  });
  
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(() => {
    const session = getActiveSession();
    const staffList = usersToStaffMembers(getStoredUsers());
    if (session && session.role === 'employee') {
      const match = staffList.find(s => s.id === session.id || (s.name && session.fullName && s.name.toLowerCase() === session.fullName.toLowerCase()));
      if (match) return match;
    }
    return staffList[0] || INITIAL_FALLBACK_STAFF[0];
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<ProductionProject | null>(null);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState<ProductionProject | null>(null);
  const [selectedProjectForContract, setSelectedProjectForContract] = useState<ProductionProject | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [rulesInitialTab, setRulesInitialTab] = useState<'checklists' | 'equipment' | 'packages' | 'services' | 'formats' | 'users' | 'system' | 'contract_design' | 'company' | 'staff_assignment' | 'shortcuts'>('checklists');
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  // Deletion modal and one-time broadcast notification state
  const [projectToDelete, setProjectToDelete] = useState<ProductionProject | null>(null);
  const [deletionAlertBanner, setDeletionAlertBanner] = useState<{
    code: string;
    title: string;
    reason: string;
    user: string;
    details?: string;
  } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedAdminFilter, setSavedAdminFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue' | 'phase_specific'>('all');

  // Track timestamp for 3-minute continuous use / background auto-logout
  const lastActiveTimestampRef = useRef<number>(Date.now());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle navigation history: Go Back (Swipe right-to-left or Header Back button)
  const handleGoBack = () => {
    if (selectedProjectForDetail) {
      setSelectedProjectForDetail(null);
      showToast('← Cerrar detalles de expediente');
      return;
    }
    if (selectedProjectForContract) {
      setSelectedProjectForContract(null);
      showToast('← Cerrar contrato');
      return;
    }
    if (selectedProjectForReport) {
      setSelectedProjectForReport(null);
      showToast('← Cerrar reporte');
      return;
    }
    if (isNewProjectModalOpen) {
      setIsNewProjectModalOpen(false);
      showToast('← Cerrar nueva producción');
      return;
    }
    if (isAnalyticsModalOpen) {
      setIsAnalyticsModalOpen(false);
      showToast('← Cerrar analítica');
      return;
    }
    if (isRulesModalOpen) {
      setIsRulesModalOpen(false);
      showToast('← Cerrar configuración de reglas');
      return;
    }
    if (isUsersModalOpen) {
      setIsUsersModalOpen(false);
      showToast('← Cerrar administración de usuarios');
      return;
    }
    showToast('← Vista principal de proyectos');
  };

  // Handle navigation history: Go Forward (Swipe left-to-right or Header Forward button)
  const handleGoForward = () => {
    // If no modal open, open the latest active project or open new project wizard
    if (!selectedProjectForDetail && !selectedProjectForContract && !selectedProjectForReport && !isNewProjectModalOpen && !isAnalyticsModalOpen && !isRulesModalOpen && !isUsersModalOpen) {
      const activeProj = projects.find(p => !p.isArchived);
      if (activeProj) {
        setSelectedProjectForDetail(activeProj);
        showToast(`→ Abrir producción: ${activeProj.title}`);
        return;
      } else {
        setIsNewProjectModalOpen(true);
        showToast('→ Iniciar Nueva Producción');
        return;
      }
    }
    showToast('→ Avanzar al siguiente elemento');
  };

  // Explicitly disable swipe gestures on touch devices to avoid accidental window/modal navigation
  useSwipeGesture({
    onSwipeLeft: handleGoBack,
    onSwipeRight: handleGoForward,
    enabled: false
  });

  // Trigger auto-logout on inactivity
  const handleAutoLogout = () => {
    setActiveSession(null);
    setCurrentUser(null);
    setSelectedProjectForDetail(null);
    setSelectedProjectForReport(null);
    setSelectedProjectForContract(null);
    setIsNewProjectModalOpen(false);
    setIsAnalyticsModalOpen(false);
    setIsRulesModalOpen(false);
    setIsUsersModalOpen(false);
    showToast('⏱️ Sesión cerrada por tiempo prolongado de inactividad.');
  };

  // Trigger logout when account is accessed from another device/window
  const handleConcurrentAccessLogout = () => {
    setActiveSession(null);
    setCurrentUser(null);
    setSelectedProjectForDetail(null);
    setSelectedProjectForReport(null);
    setSelectedProjectForContract(null);
    setIsNewProjectModalOpen(false);
    setIsAnalyticsModalOpen(false);
    setIsRulesModalOpen(false);
    setIsUsersModalOpen(false);
    showToast('🔒 Se inició sesión con esta cuenta desde otro dispositivo. La sesión anterior fue cerrada.');
  };

  // 3-Minute Inactivity and Concurrent Session Checker
  useEffect(() => {
    if (!currentUser) return;

    const recordUserActivity = () => {
      lastActiveTimestampRef.current = Date.now();
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel'
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    // Check every 1.5 seconds if 3 minutes of inactivity elapsed OR if session was superceded by another login
    const checkInterval = setInterval(() => {
      // 1. Inactivity check
      const elapsed = Date.now() - lastActiveTimestampRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleAutoLogout();
        return;
      }

      // 2. Concurrency check (single device per account)
      if (currentUser && isSessionSuperceded(currentUser)) {
        handleConcurrentAccessLogout();
      }
    }, 1500);

    // Tab visibility change (minimized / backgrounded tab)
    const handleVisibilityChange = () => {
      const elapsed = Date.now() - lastActiveTimestampRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleAutoLogout();
      } else if (currentUser && isSessionSuperceded(currentUser)) {
        handleConcurrentAccessLogout();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, recordUserActivity);
      });
      clearInterval(checkInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  // Synchronize users and staff list
  const refreshStaffList = (usersList?: AuthUser[]) => {
    const users = usersList || getStoredUsers();
    const updatedStaff = usersToStaffMembers(users);
    if (updatedStaff.length > 0) {
      setAllStaff(updatedStaff);
      // Keep currentStaff aligned if found
      if (currentStaff) {
        const match = updatedStaff.find(s => s.id === currentStaff.id);
        if (match) setCurrentStaff(match);
      }
    }
  };

  // Load initial data and hydrate from IndexedDB
  useEffect(() => {
    const loaded = getStoredProjects();
    setProjects(loaded);

    // Hydrate asynchronously from IndexedDB
    initStorage((hydrated) => {
      if (hydrated && hydrated.length > 0) {
        setProjects(hydrated);
      }
    });

    initRulesStorage();
    refreshStaffList();

    // Listen for custom project update events across components
    const handleProjectsUpdated = (e: CustomEvent<ProductionProject[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setProjects(e.detail);
      }
    };
    window.addEventListener('tct_projects_updated' as any, handleProjectsUpdated);

    // Listen for deletion broadcasts (realtime multi-session sync)
    const handleProjectDeletedEvent = (e: CustomEvent<{
      id: string;
      code: string;
      title: string;
      reason: string;
      user: string;
      details?: string;
    }>) => {
      if (e.detail) {
        const { id, code, title, reason, user, details } = e.detail;
        setProjects(prev => prev.filter(p => p.id !== id));
        if (selectedProjectForDetail?.id === id) setSelectedProjectForDetail(null);
        if (selectedProjectForContract?.id === id) setSelectedProjectForContract(null);
        if (selectedProjectForReport?.id === id) setSelectedProjectForReport(null);

        // Show one-time broadcast deletion banner to all active users / admins
        setDeletionAlertBanner({
          code,
          title,
          reason,
          user,
          details
        });
      }
    };
    window.addEventListener('tct_project_deleted' as any, handleProjectDeletedEvent);

    // Cross-tab storage synchronization listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tct_production_projects' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setProjects(parsed);
          }
        } catch (err) {
          console.warn('Storage sync error:', err);
        }
      }
      if (e.key === 'tct_last_deleted_project' && e.newValue) {
        try {
          const delPayload = JSON.parse(e.newValue);
          if (delPayload && delPayload.code) {
            setDeletionAlertBanner({
              code: delPayload.code,
              title: delPayload.title,
              reason: delPayload.reason,
              user: delPayload.user || 'Administrador',
              details: delPayload.details
            });
          }
        } catch (err) {
          console.warn('Delete storage sync error:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom user updates
    const handleUsersUpdated = (e: CustomEvent<AuthUser[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        refreshStaffList(e.detail);
      }
    };
    window.addEventListener('tct_users_updated' as any, handleUsersUpdated);

    // Online / Offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      showToast('🟢 Conexión a Internet restablecida: Cola de sincronización procesada.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('🟡 Modo Offline Activo: Todos los cambios se guardan localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('tct_projects_updated' as any, handleProjectsUpdated);
      window.removeEventListener('tct_project_deleted' as any, handleProjectDeletedEvent);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tct_users_updated' as any, handleUsersUpdated);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [selectedProjectForDetail, selectedProjectForContract, selectedProjectForReport]);

  // Handle Login Success
  const handleLoginSuccess = (user: AuthUser, remember: boolean) => {
    lastActiveTimestampRef.current = Date.now();
    setActiveSession(user, remember);
    setCurrentUser(user);
    setCurrentRole(user.role);

    // If employee, auto-select their staff profile
    const staffList = usersToStaffMembers(getStoredUsers());
    if (user.role === 'employee') {
      const match = staffList.find(s => s.id === user.id || (s.name && user.fullName && s.name.toLowerCase() === user.fullName.toLowerCase()));
      if (match) {
        setCurrentStaff(match);
      } else {
        const newStaffProfile: StaffMember = {
          id: user.id,
          name: user.fullName,
          role: user.jobTitle || 'Técnico de Producción',
          phone: user.phone || '+51 900 000 000',
          confirmed: true
        };
        setCurrentStaff(newStaffProfile);
      }
    }

    showToast(`✓ ¡Bienvenido(a), ${user.fullName}! Acceso como ${user.role === 'admin' ? 'Administrador' : 'Empleado'}.`);
  };

  // Handle Logout (Single click = standard logout, Double click = deep exit)
  const handleLogout = (deepExit: boolean = false) => {
    setActiveSession(null);
    setCurrentUser(null);
    if (deepExit) {
      showToast('🔒 Saliendo del sistema TCT...');
      try {
        window.open('', '_self', '');
        window.close();
      } catch (err) {
        console.warn('Could not execute window.close():', err);
      }
    } else {
      showToast('Sesión cerrada correctamente. Ingrese con sus credenciales TCT.');
    }
  };

  // Update a project
  const handleUpdateProject = (updated: ProductionProject) => {
    const updatedList = projects.map(p => p.id === updated.id ? updated : p);
    setProjects(updatedList);
    saveProjects(updatedList);

    // Keep detail and contract modal updated if open
    if (selectedProjectForDetail && selectedProjectForDetail.id === updated.id) {
      setSelectedProjectForDetail(updated);
    }
    if (selectedProjectForContract && selectedProjectForContract.id === updated.id) {
      setSelectedProjectForContract(updated);
    }
    showToast(`✓ Cambios guardados para "${updated.title}"`);
  };

  // Create a new project
  const handleCreateProject = (newProj: ProductionProject) => {
    const updatedList = [newProj, ...projects];
    setProjects(updatedList);
    saveProjects(updatedList);
    setIsNewProjectModalOpen(false);
    
    // Automatically open the populated contract ready for export!
    setSelectedProjectForContract(newProj);
    showToast(`🎉 ¡Producción creada con éxito! Contrato listo para exportar.`);
  };

  // Delete a single project / contract - Opens the Reason form modal
  const handleDeleteProject = (projectId: string) => {
    const target = projects.find(p => p.id === projectId);
    if (target) {
      setProjectToDelete(target);
    }
  };

  // Confirm permanent deletion with mandatory reason
  const handleConfirmDeleteProject = (projectId: string, reason: string, details: string) => {
    const target = projects.find(p => p.id === projectId);
    const code = target?.uniqueCode || target?.contractNumber || projectId;
    const title = target?.title || 'Expediente Audiovisual';
    const updated = projects.filter(p => p.id !== projectId);
    
    setProjects(updated);
    saveProjects(updated);

    const deletePayload = {
      id: projectId,
      code,
      title,
      reason,
      user: currentUser?.fullName || (currentRole === 'admin' ? 'Administrador' : 'Usuario'),
      details: details.trim() || undefined,
      timestamp: Date.now()
    };

    // Save deletion record for multi-tab sync
    localStorage.setItem('tct_last_deleted_project', JSON.stringify(deletePayload));
    
    // Broadcast custom event for in-page immediate sync
    window.dispatchEvent(new CustomEvent('tct_project_deleted', { detail: deletePayload }));

    setProjectToDelete(null);
    if (selectedProjectForDetail?.id === projectId) setSelectedProjectForDetail(null);
    if (selectedProjectForContract?.id === projectId) setSelectedProjectForContract(null);
    if (selectedProjectForReport?.id === projectId) setSelectedProjectForReport(null);

    // Show prominent one-time confirmation banner
    setDeletionAlertBanner({
      code,
      title,
      reason,
      user: currentUser?.fullName || 'Administrador',
      details: details.trim() || undefined
    });

    showToast(`🗑️ Expediente "${code}" eliminado permanentemente.`);
  };

  // Reset to demo data
  const handleResetData = () => {
    if (window.confirm('¿Deseas restaurar los proyectos demo oficiales de Corporación TCT?')) {
      const reset = resetToDemoData();
      setProjects(reset);
      showToast('🔄 Base de datos restablecida con datos demo de Corporación TCT');
    }
  };

  const smartAlerts = generateSmartAlerts(projects);
  const decisionInsights = generateDecisionInsights(projects);

  // If no user is logged in, show the official TCT Login Screen!
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/50 flex items-center space-x-2 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentStaff={currentStaff}
        allStaff={allStaff}
        allUsers={allUsers}
        onStaffChange={setCurrentStaff}
        onUserSelect={(usr) => {
          setCurrentUser(usr);
        }}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenRulesModal={() => {
          setRulesInitialTab('company');
          setIsRulesModalOpen(true);
        }}
        onOpenUsersManagement={() => {
          setRulesInitialTab('users');
          setIsRulesModalOpen(true);
        }}
        onLogout={handleLogout}
        onResetData={handleResetData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeProjectsCount={projects.filter(p => !p.isArchived).length}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
      />

      {/* Main Workspace with responsive full-width padding */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 space-y-4">

        {/* ONE-TIME SYSTEM NOTIFICATION BANNER (Cross-User & Multi-Session Sync) */}
        {deletionAlertBanner && (
          <div className="bg-gradient-to-r from-red-950/95 via-red-900/90 to-slate-900 border-2 border-red-500/80 rounded-2xl p-4 shadow-2xl flex items-start justify-between gap-3 animate-fade-in text-white">
            <div className="flex items-start space-x-3 min-w-0">
              <div className="p-2 bg-red-600/30 rounded-xl border border-red-500/50 shrink-0 text-red-400 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                    Aviso del Sistema SIGAT (Por Única Vez)
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-300">
                    Expediente: {deletionAlertBanner.code}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white leading-tight">
                  El expediente <span className="text-amber-200 underline">"{deletionAlertBanner.title}"</span> ha sido eliminado permanentemente por <span className="font-semibold text-slate-200">{deletionAlertBanner.user}</span>.
                </h4>
                <div className="text-xs text-red-200/90 flex items-start gap-1 pt-0.5">
                  <span className="font-bold text-red-300">Motivo de eliminación:</span>
                  <span className="italic">{deletionAlertBanner.reason}</span>
                </div>
                {deletionAlertBanner.details && (
                  <p className="text-[11px] text-slate-300 bg-black/40 rounded-lg px-2.5 py-1 mt-1 border border-red-500/30">
                    <strong>Detalles:</strong> {deletionAlertBanner.details}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setDeletionAlertBanner(null)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Entendido / Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Switch based on Role */}
        {currentRole === 'admin' ? (
          <AdminDashboard
            projects={projects}
            alerts={smartAlerts}
            insights={decisionInsights}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenProject={(proj) => setSelectedProjectForDetail(proj)}
            onOpenNewProject={() => setIsNewProjectModalOpen(true)}
            onOpenReportPrint={(proj) => setSelectedProjectForReport(proj)}
            onOpenContractExport={(proj) => setSelectedProjectForContract(proj)}
            onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            savedQuickFilter={savedAdminFilter}
            onSaveQuickFilter={setSavedAdminFilter}
            allStaff={allStaff}
            allUsers={allUsers}
            onOpenRulesModal={() => {
              setRulesInitialTab('checklists');
              setIsRulesModalOpen(true);
            }}
            onOpenUsersManagement={() => {
              setRulesInitialTab('users');
              setIsRulesModalOpen(true);
            }}
          />
        ) : (
          <StaffDashboard
            projects={projects}
            currentStaff={currentStaff}
            onOpenProject={(proj) => setSelectedProjectForDetail(proj)}
            onOpenContractExport={(proj) => setSelectedProjectForContract(proj)}
            onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
            onUpdateProject={handleUpdateProject}
            onOpenNewProject={() => setIsNewProjectModalOpen(true)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-3.5 sm:py-4 text-xs">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-amber-400">CORPORACIÓN TCT</span>
            <span className="font-slogan text-amber-300/80 text-sm hidden sm:inline">• Marcando Historia</span>
            <span className="text-slate-500">• Sistema Integrado de Gestion Audiovisual 2026. Derechos reservados .</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>6 Fases • 12 Pasos Secuenciales Oficiales</span>
          </div>
        </div>
      </footer>

      {/* MODAL 0: User Management Modal (Admin only) */}
      {isUsersModalOpen && currentUser && (
        <UserManagementModal
          currentUser={currentUser}
          onClose={() => setIsUsersModalOpen(false)}
          onUsersChanged={(updatedUsers) => {
            refreshStaffList(updatedUsers);
          }}
        />
      )}

      {/* MODAL 1: Complete Project Detail & 12-Step Sequential Inspector */}
      {selectedProjectForDetail && (
        <ProjectDetailModal
          project={selectedProjectForDetail}
          currentUser={currentUser}
          currentRole={currentRole}
          onClose={() => setSelectedProjectForDetail(null)}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={currentRole === 'admin' ? handleDeleteProject : undefined}
          onOpenReportPrint={(proj) => setSelectedProjectForReport(proj)}
          onOpenContractExport={(proj) => setSelectedProjectForContract(proj)}
        />
      )}

      {/* MODAL 2: New Production Wizard (Aligns with Contract format) */}
      {isNewProjectModalOpen && (
        <NewProjectModal
          existingProjects={projects}
          currentUser={currentUser}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreateProject={handleCreateProject}
        />
      )}

      {/* MODAL 3: Comparative Analytics & Role-Based Decision Making */}
      {isAnalyticsModalOpen && (
        <ComparativeAnalyticsModal
          projects={projects}
          insights={decisionInsights}
          currentStaffId={currentRole === 'employee' ? currentStaff.id : undefined}
          onClose={() => setIsAnalyticsModalOpen(false)}
          onOpenProject={(proj) => {
            setIsAnalyticsModalOpen(false);
            setSelectedProjectForDetail(proj);
          }}
        />
      )}

      {/* MODAL 4: Printable PDF Official Report with TCT Watermark in Soles (S/.) */}
      {selectedProjectForReport && (
        <ReportPrintModal
          project={selectedProjectForReport}
          onClose={() => setSelectedProjectForReport(null)}
        />
      )}

      {/* MODAL 5: Official TCT Contract Export Modal with Watermark */}
      {selectedProjectForContract && (
        <ContractExportModal
          project={selectedProjectForContract}
          currentRole={currentRole}
          onClose={() => setSelectedProjectForContract(null)}
          onUpdateProject={handleUpdateProject}
        />
      )}

      {/* MODAL 7: Admin Settings & Master Rules (Checklists, Equipment, Proformas, Services, Formats, Users, System & Demo) */}
      {isRulesModalOpen && (
        <AdminSettingsModal
          onClose={() => setIsRulesModalOpen(false)}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          currentUser={currentUser || undefined}
          currentStaff={currentStaff}
          allStaff={allStaff}
          onStaffChange={setCurrentStaff}
          initialTab={rulesInitialTab}
          onUsersChanged={(updatedUsers) => {
            refreshStaffList(updatedUsers);
          }}
          onResetDemoData={handleResetData}
          onProjectsChange={(updatedProjects) => {
            setProjects(updatedProjects);
          }}
          onRulesUpdated={() => {
            showToast('✓ Reglas Maestras TCT guardadas y actualizadas');
          }}
        />
      )}

      {/* MODAL 8: Delete Project Confirmation with Mandatory Reason Form */}
      {projectToDelete && (
        <DeleteProjectConfirmModal
          project={projectToDelete}
          onClose={() => setProjectToDelete(null)}
          onConfirmDelete={handleConfirmDeleteProject}
        />
      )}

    </div>
  );
}
