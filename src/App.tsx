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
  usersToStaffMembers 
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
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { RotateCcw, Sparkles, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

const INITIAL_FALLBACK_STAFF: StaffMember[] = [
  { id: 'usr-emp-carlos', name: 'Carlos Mendoza', role: 'Director de Cámara', phone: '+51 912 345 678', confirmed: true },
  { id: 'usr-emp-valeria', name: 'Valeria Castro', role: 'Fotógrafo Principal', phone: '+51 923 456 789', confirmed: true },
  { id: 'usr-emp-jorge', name: 'Jorge Huamán', role: 'Piloto Dron', phone: '+51 934 567 890', confirmed: true },
  { id: 'usr-emp-pedro', name: 'Pedro Alva', role: 'Editor & Ingest', phone: '+51 945 678 901', confirmed: true }
];

// Inactivity timeout: 3 minutes = 180,000 milliseconds
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;

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
      const match = staffList.find(s => s.id === session.id || s.name.toLowerCase() === session.fullName.toLowerCase());
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
  const [rulesInitialTab, setRulesInitialTab] = useState<'checklists' | 'equipment' | 'packages' | 'services' | 'formats' | 'users' | 'system'>('checklists');
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

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

  useSwipeGesture({
    onSwipeLeft: handleGoBack,
    onSwipeRight: handleGoForward,
    enabled: !!currentUser
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
    showToast('⏱️ Sesión cerrada automáticamente por inactividad de 3 minutos.');
  };

  // 3-Minute Inactivity and Background Tab Tracker
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
      'click'
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    // Check every 2 seconds if 3 minutes of inactivity elapsed
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActiveTimestampRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleAutoLogout();
      }
    }, 2000);

    // Tab visibility change (minimized / backgrounded tab)
    const handleVisibilityChange = () => {
      const elapsed = Date.now() - lastActiveTimestampRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleAutoLogout();
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
      window.removeEventListener('tct_users_updated' as any, handleUsersUpdated);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle Login Success
  const handleLoginSuccess = (user: AuthUser, remember: boolean) => {
    setActiveSession(user, remember);
    setCurrentUser(user);
    setCurrentRole(user.role);

    // If employee, auto-select their staff profile
    const staffList = usersToStaffMembers(getStoredUsers());
    if (user.role === 'employee') {
      const match = staffList.find(s => s.id === user.id || s.name.toLowerCase() === user.fullName.toLowerCase());
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

  // Handle Logout
  const handleLogout = () => {
    setActiveSession(null);
    setCurrentUser(null);
    showToast('Sesión cerrada correctamente. Ingrese con sus credenciales TCT.');
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

  // Delete a single project / contract
  const handleDeleteProject = (projectId: string) => {
    const target = projects.find(p => p.id === projectId);
    const title = target ? target.title : 'el expediente';
    if (window.confirm(`¿Deseas eliminar permanentemente el contrato/expediente "${title}"?`)) {
      const updated = projects.filter(p => p.id !== projectId);
      setProjects(updated);
      saveProjects(updated);
      if (selectedProjectForDetail?.id === projectId) setSelectedProjectForDetail(null);
      if (selectedProjectForContract?.id === projectId) setSelectedProjectForContract(null);
      if (selectedProjectForReport?.id === projectId) setSelectedProjectForReport(null);
      showToast(`🗑️ "${title}" ha sido eliminado del sistema.`);
    }
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6">

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
          />
        ) : (
          <StaffDashboard
            projects={projects}
            currentStaff={currentStaff}
            onOpenProject={(proj) => setSelectedProjectForDetail(proj)}
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

    </div>
  );
}
