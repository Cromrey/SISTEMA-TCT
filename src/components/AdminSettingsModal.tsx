import React, { useState, useEffect, useRef } from 'react';
import { 
  TCTMasterRules, 
  TCTMasterPackage, 
  EquipmentItem, 
  MasterStepChecklistRule, 
  TemplateDocumentFormat,
  EventType,
  UserRole,
  AuthUser,
  ProductionProject,
  StaffMember,
  TCTCompanyInfo,
  TCTCompanyBankAccount,
  TCTContractDesign
} from '../types';
import { 
  getStoredRules, 
  saveMasterRules, 
  resetMasterRulesToDefault,
  INITIAL_COMPANY_INFO,
  INITIAL_CONTRACT_DESIGN
} from '../utils/rulesStorage';
import { 
  getStoredUsers, 
  createOrUpdateUser, 
  deleteUser, 
  resetUsersToDefaults,
  deleteAllEmployeesExceptAdmin,
  deleteUsersByFilter,
  getUserProjectAssignments
} from '../utils/authStorage';
import { 
  resetToDemoData, 
  getStoredProjects, 
  saveProjects, 
  getLastSyncTime,
  deleteAllContractsHistory,
  deleteProjectsByFilter,
  deleteSingleProject,
  factoryResetAllSystemData
} from '../utils/storage';
import { 
  KeyboardShortcutConfig, 
  getStoredShortcuts, 
  saveStoredShortcuts, 
  resetShortcutsToDefault, 
  SHORTCUT_ACTIONS 
} from '../utils/shortcutsStorage';
import { formatDateDDMMAA } from '../utils/dateFormatter';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { TCTLogo } from './TCTLogo';
import { exportElementToPdf } from '../utils/printHelper';
import { 
  getStoredLiveSessions, 
  fetchLiveSessionsFromServer,
  terminateSessionById, 
  blockAndExpelUser, 
  unblockUser, 
  deleteUserAccountAndPurge, 
  LiveSession 
} from '../utils/sessionMonitor';
import { 
  Sliders, 
  X, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Camera, 
  Package, 
  ListChecks, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  Coins, 
  Clock, 
  ShieldCheck, 
  UserCheck,
  Sparkles,
  Info,
  ChevronRight,
  Search,
  ExternalLink,
  Layers,
  HardDrive,
  Users,
  Video,
  FileCheck,
  Check,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Database,
  Lock,
  Phone,
  Mail,
  Briefcase,
  Keyboard,
  Command,
  Zap,
  Building2,
  Building,
  Landmark,
  CreditCard,
  QrCode,
  UserMinus,
  Film,
  Palette,
  Type,
  LayoutGrid,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Activity,
  UserX,
  Laptop,
  Smartphone,
  Radio,
  RefreshCw,
  Ban
} from 'lucide-react';

export type SettingsTab = 'company' | 'contract_design' | 'staff_assignment' | 'checklists' | 'equipment' | 'packages' | 'services' | 'formats' | 'users' | 'shortcuts' | 'system' | 'live_sessions';

interface AdminSettingsModalProps {
  onClose: () => void;
  onRulesUpdated?: () => void;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  currentUser?: AuthUser;
  onUsersChanged?: (users: AuthUser[]) => void;
  onResetDemoData?: () => void;
  onProjectsChange?: (projects: ProductionProject[]) => void;
  initialTab?: SettingsTab;
  currentStaff?: StaffMember;
  allStaff?: StaffMember[];
  onStaffChange?: (staff: StaffMember) => void;
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

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ 
  onClose, 
  onRulesUpdated,
  currentRole = 'admin',
  onRoleChange,
  currentUser,
  onUsersChanged,
  onResetDemoData,
  onProjectsChange,
  initialTab = 'checklists',
  currentStaff,
  allStaff = [],
  onStaffChange
}) => {
  const [rules, setRules] = useState<TCTMasterRules>(getStoredRules());
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [showButtonsMenu, setShowButtonsMenu] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Logo change state
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // --- Company Information State ---
  const [companyInfo, setCompanyInfo] = useState<TCTCompanyInfo>(rules.companyInfo || INITIAL_COMPANY_INFO);
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccountNum, setNewBankAccountNum] = useState('');
  const [newBankCci, setNewBankCci] = useState('');
  const [newBankCurrency, setNewBankCurrency] = useState<'PEN' | 'USD'>('PEN');

  // --- Contract Design & Template Customization State ---
  const [contractDesign, setContractDesign] = useState<TCTContractDesign>(
    rules.contractDesign ? { ...INITIAL_CONTRACT_DESIGN, ...rules.contractDesign } : INITIAL_CONTRACT_DESIGN
  );

  // --- Personnel & Equipment Assignment State ---
  const [projectsList, setProjectsList] = useState<ProductionProject[]>(getStoredProjects());
  const [selectedAssignProjectId, setSelectedAssignProjectId] = useState<string>(
    getStoredProjects()[0]?.id || ''
  );
  const [assignUserSelection, setAssignUserSelection] = useState<string>('');
  const [assignRoleSelection, setAssignRoleSelection] = useState<string>('Director de Cámara');
  const [assignCustomName, setAssignCustomName] = useState<string>('');
  const [assignCustomPhone, setAssignCustomPhone] = useState<string>('+51 900 000 000');

  // --- Checklist Management State ---
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(1);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [editingChecklistIdx, setEditingChecklistIdx] = useState<number | null>(null);
  const [editingChecklistValue, setEditingChecklistValue] = useState('');

  // --- Equipment Management State ---
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [newEquipmentCategory, setNewEquipmentCategory] = useState<EquipmentItem['category']>('Cámara');
  const [newEquipmentSerial, setNewEquipmentSerial] = useState('');
  const [equipmentFilterCat, setEquipmentFilterCat] = useState<string>('all');
  const [inventoryConditionFilter, setInventoryConditionFilter] = useState<string>('all');
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);
  const [formEqCode, setFormEqCode] = useState('');
  const [formEqName, setFormEqName] = useState('');
  const [formEqCategory, setFormEqCategory] = useState<EquipmentItem['category']>('Cámara');
  const [formEqSerial, setFormEqSerial] = useState('');
  const [formEqImageUrl, setFormEqImageUrl] = useState('');
  const [formEqFeatures, setFormEqFeatures] = useState('');
  const [formEqDate, setFormEqDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEqCondition, setFormEqCondition] = useState<'Operativo' | 'En Mantenimiento' | 'De Baja' | 'Nuevo'>('Operativo');
  const [formEqError, setFormEqError] = useState<string | null>(null);
  const [isExportingInventoryPdf, setIsExportingInventoryPdf] = useState(false);

  // --- Unsaved Changes Tracking State ---
  const [isDirty, setIsDirty] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);

  // --- Proforma / Package Management State ---
  const [editingPackage, setEditingPackage] = useState<TCTMasterPackage | null>(rules.packages[0] || null);
  const [newServiceInput, setNewServiceInput] = useState('');

  // --- Services & Extras Management State ---
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<'Video' | 'Foto' | 'Audio' | 'Dron' | 'Entrega' | 'Otro'>('Video');
  const [standardExtraHourRate, setStandardExtraHourRate] = useState<number>(rules.standardExtraHourRate || 150);
  const [maxDiscountPercentage, setMaxDiscountPercentage] = useState<number>(rules.maxDiscountPercentageAllowed || 20);
  const [newAdvisorName, setNewAdvisorName] = useState('');

  // --- Formats Management State ---
  const [selectedFormat, setSelectedFormat] = useState<TemplateDocumentFormat | null>(rules.templateFormats[0] || null);

  // --- Users Management State ---
  const [usersList, setUsersList] = useState<AuthUser[]>(getStoredUsers());
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
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
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // --- Keyboard Shortcuts State ---
  const [shortcutsList, setShortcutsList] = useState<KeyboardShortcutConfig[]>(getStoredShortcuts());
  const [selectedShortcutAction, setSelectedShortcutAction] = useState<string>(SHORTCUT_ACTIONS[0].actionId);
  const [customShortcutKeys, setCustomShortcutKeys] = useState<string>('ctrl+b');

  // --- Live Sessions Monitor State ---
  const [liveSessionsList, setLiveSessionsList] = useState<LiveSession[]>(() => getStoredLiveSessions());
  const [liveSessionsFilter, setLiveSessionsFilter] = useState<'all' | 'online' | 'idle' | 'blocked'>('all');
  const [liveSessionsSearch, setLiveSessionsSearch] = useState('');

  // Live session auto-sync
  useEffect(() => {
    let isMounted = true;
    const syncSessions = async () => {
      try {
        const live = await fetchLiveSessionsFromServer();
        if (isMounted && Array.isArray(live)) {
          setLiveSessionsList(live);
        }
      } catch (e) {
        if (isMounted) {
          setLiveSessionsList(getStoredLiveSessions());
        }
      }
    };

    syncSessions();
    window.addEventListener('tct_live_sessions_updated', syncSessions);
    const interval = setInterval(syncSessions, 2000);
    return () => {
      isMounted = false;
      window.removeEventListener('tct_live_sessions_updated', syncSessions);
      clearInterval(interval);
    };
  }, []);

  const handleExpelSession = async (session: LiveSession) => {
    if (window.confirm(`¿Seguro que deseas expulsar y cerrar la sesión activa de ${session.fullName} (${session.username})?`)) {
      await terminateSessionById(session.sessionId);
      const updated = await fetchLiveSessionsFromServer();
      setLiveSessionsList(updated);
      notifySuccess(`✓ Sesión activa de ${session.fullName} expulsada y cerrada en tiempo real.`);
    }
  };

  const handleBlockAndExpelUser = async (session: LiveSession) => {
    if (session.username.toUpperCase() === 'TCT') {
      notifyError('No se puede bloquear la cuenta principal de Administrador "TCT".');
      return;
    }
    if (window.confirm(`⚠️ ¿Bloquear acceso y expulsar inmediatamente a ${session.fullName} (@${session.username})? No podrá volver a ingresar al aplicativo.`)) {
      await blockAndExpelUser(session.userId);
      const updated = await fetchLiveSessionsFromServer();
      setLiveSessionsList(updated);
      setUsersList(getStoredUsers());
      notifySuccess(`🚫 Usuario ${session.fullName} bloqueado y expulsado.`);
    }
  };

  const handleUnblockSessionUser = async (userId: string, name: string) => {
    await unblockUser(userId);
    const updated = await fetchLiveSessionsFromServer();
    setLiveSessionsList(updated);
    setUsersList(getStoredUsers());
    notifySuccess(`✅ Usuario ${name} desbloqueado exitosamente.`);
  };

  const handleDeleteUserAccount = async (userId: string, username: string, name: string) => {
    if (username.toUpperCase() === 'TCT') {
      notifyError('No se puede eliminar la cuenta principal de Administrador "TCT".');
      return;
    }
    if (window.confirm(`⚠️ ¿Eliminar definitivamente la cuenta de ${name} (@${username}) y cerrar todas sus sesiones?`)) {
      deleteUserAccountAndPurge(userId);
      const updated = await fetchLiveSessionsFromServer();
      setLiveSessionsList(updated);
      setUsersList(getStoredUsers());
      notifySuccess(`🗑️ Cuenta de ${name} eliminada y purgada del sistema.`);
    }
  };

  // --- Selective Deletion & Data Management State ---
  const [selectedProjectIdToDelete, setSelectedProjectIdToDelete] = useState<string>('');
  const [deleteFilterDataType, setDeleteFilterDataType] = useState<'contracts' | 'quotations' | 'employees' | 'by_event_type' | 'archived_only'>('contracts');
  const [deleteFilterEventType, setDeleteFilterEventType] = useState<string>('all');
  const [deleteFilterStaffRole, setDeleteFilterStaffRole] = useState<'all' | 'employee' | 'admin'>('employee');

  const handleDeleteSingleSelectedProject = () => {
    if (!selectedProjectIdToDelete) {
      notifyError('Por favor selecciona un expediente para eliminar.');
      return;
    }
    const all = getStoredProjects();
    const target = all.find(p => p.id === selectedProjectIdToDelete);
    const targetTitle = target ? `${target.title} (${target.contractNumber || target.uniqueCode || target.clientName})` : 'este expediente';
    
    if (window.confirm(`¿Estás seguro de que deseas ELIMINAR DEFINITIVAMENTE el expediente "${targetTitle}"?\n\nEsta acción borrará el contrato, historial de 12 pasos y todos sus adjuntos.`)) {
      deleteSingleProject(selectedProjectIdToDelete);
      setSelectedProjectIdToDelete('');
      const updated = getStoredProjects();
      setProjectsList(updated);
      if (onProjectsChange) onProjectsChange(updated);
      notifySuccess(`🗑️ Expediente "${targetTitle}" eliminado exitosamente del sistema.`);
    }
  };

  // File input ref for JSON restore
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const notifyError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const handleToggleShortcut = (id: string) => {
    const updated = shortcutsList.map(sc => sc.id === id ? { ...sc, enabled: !sc.enabled } : sc);
    setShortcutsList(updated);
    saveStoredShortcuts(updated);
    notifySuccess('Estado de atajo actualizado');
  };

  const handleUpdateShortcutKeys = (id: string, newKeys: string) => {
    const updated = shortcutsList.map(sc => sc.id === id ? { ...sc, keys: newKeys.trim().toLowerCase() } : sc);
    setShortcutsList(updated);
    saveStoredShortcuts(updated);
  };

  const handleAddCustomShortcut = () => {
    const actionDef = SHORTCUT_ACTIONS.find(a => a.actionId === selectedShortcutAction);
    if (!actionDef || !customShortcutKeys.trim()) return;

    const existingIdx = shortcutsList.findIndex(sc => sc.actionId === selectedShortcutAction);
    let updated: KeyboardShortcutConfig[];

    if (existingIdx >= 0) {
      updated = shortcutsList.map((sc, idx) => idx === existingIdx ? {
        ...sc,
        keys: customShortcutKeys.trim().toLowerCase(),
        enabled: true
      } : sc);
    } else {
      const newSc: KeyboardShortcutConfig = {
        id: `sc_${selectedShortcutAction}_${Date.now()}`,
        actionId: selectedShortcutAction,
        name: actionDef.name,
        description: actionDef.description,
        category: actionDef.category,
        keys: customShortcutKeys.trim().toLowerCase(),
        enabled: true,
        isCustom: true
      };
      updated = [...shortcutsList, newSc];
    }

    setShortcutsList(updated);
    saveStoredShortcuts(updated);
    notifySuccess(`✓ Atajo guardado: ${actionDef.name} -> ${customShortcutKeys.toUpperCase()}`);
  };

  const handleResetShortcuts = () => {
    const defaults = resetShortcutsToDefault();
    setShortcutsList(defaults);
    notifySuccess('Atajos de teclado restablecidos a la configuración de fábrica');
  };

  // -------------------------------------------------------------
  // 0. COMPANY INFO (CORPORACIÓN TCT) MANAGEMENT
  // -------------------------------------------------------------
  const handleSaveCompanyInfo = () => {
    const updatedRules: TCTMasterRules = {
      ...rules,
      companyInfo: { ...companyInfo }
    };
    saveMasterRules(updatedRules);
    setRules(updatedRules);
    if (onRulesUpdated) onRulesUpdated();
    notifySuccess('✓ Datos institucionales de Corporación TCT actualizados correctamente');
  };

  const handleResetCompanyInfo = () => {
    if (window.confirm('¿Restaurar los datos oficiales institucionales de Corporación TCT a los valores predeterminados?')) {
      const resetInfo = { ...INITIAL_COMPANY_INFO };
      setCompanyInfo(resetInfo);
      const updatedRules: TCTMasterRules = {
        ...rules,
        companyInfo: resetInfo
      };
      saveMasterRules(updatedRules);
      setRules(updatedRules);
      if (onRulesUpdated) onRulesUpdated();
      notifySuccess('🔄 Datos de Corporación TCT restablecidos a los valores oficiales de fábrica');
    }
  };

  const handleUpdateLogo = (newLogoUrl: string) => {
    const updatedCompany: TCTCompanyInfo = {
      ...companyInfo,
      logoUrl: newLogoUrl
    };
    const updatedContractDesign: TCTContractDesign = {
      ...contractDesign,
      customLogoUrl: newLogoUrl
    };
    setCompanyInfo(updatedCompany);
    setContractDesign(updatedContractDesign);

    const updatedRules: TCTMasterRules = {
      ...rules,
      companyInfo: updatedCompany,
      contractDesign: updatedContractDesign
    };
    saveMasterRules(updatedRules);
    setRules(updatedRules);
    if (onRulesUpdated) onRulesUpdated();
    notifySuccess('✓ Logo institucional de Corporación TCT actualizado');
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('El archivo seleccionado supera los 3MB. Por favor suba una imagen más liviana.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        handleUpdateLogo(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    handleUpdateLogo('/assets/tct-logo.png');
  };

  const handleAddBankAccount = () => {
    if (!newBankName.trim() || !newBankAccountNum.trim()) {
      alert('Por favor ingrese el nombre del banco y el número de cuenta.');
      return;
    }
    const newAcc: TCTCompanyBankAccount = {
      id: `bank_${Date.now()}`,
      bankName: newBankName.trim(),
      accountType: 'Corriente',
      accountNumber: newBankAccountNum.trim(),
      holderName: companyInfo.legalName || 'Corporación TCT S.A.C.',
      cci: newBankCci.trim() || undefined,
      currency: newBankCurrency
    };
    const updatedAccounts = [...(companyInfo.bankAccounts || []), newAcc];
    setCompanyInfo({ ...companyInfo, bankAccounts: updatedAccounts });
    setNewBankName('');
    setNewBankAccountNum('');
    setNewBankCci('');
    notifySuccess(`✓ Cuenta ${newAcc.bankName} añadida`);
  };

  const handleDeleteBankAccount = (bankId: string) => {
    const updatedAccounts = (companyInfo.bankAccounts || []).filter(b => b.id !== bankId);
    setCompanyInfo({ ...companyInfo, bankAccounts: updatedAccounts });
    notifySuccess('Cuenta bancaria eliminada');
  };

  // -------------------------------------------------------------
  // 0.05. CONTRACT DESIGN & HEADER CUSTOMIZATION
  // -------------------------------------------------------------
  const handleSaveContractDesign = () => {
    const updatedRules: TCTMasterRules = {
      ...rules,
      contractDesign: { ...contractDesign }
    };
    saveMasterRules(updatedRules);
    setRules(updatedRules);
    if (onRulesUpdated) onRulesUpdated();
    notifySuccess('✓ Diseño, encabezado y cláusulas de contrato guardados correctamente');
  };

  const handleResetContractDesign = () => {
    if (window.confirm('¿Deseas restablecer el diseño del contrato a la plantilla predeterminada de Corporación TCT?')) {
      const resetDesign = { ...INITIAL_CONTRACT_DESIGN };
      setContractDesign(resetDesign);
      const updatedRules: TCTMasterRules = {
        ...rules,
        contractDesign: resetDesign
      };
      saveMasterRules(updatedRules);
      setRules(updatedRules);
      if (onRulesUpdated) onRulesUpdated();
      notifySuccess('🔄 Diseño de contrato restablecido a los valores oficiales de fábrica');
    }
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo de imagen no debe superar los 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setContractDesign({
          ...contractDesign,
          logoType: 'custom',
          customLogoUrl: result
        });
        notifySuccess('✓ Logo institucional cargado correctamente');
      };
      reader.readAsDataURL(file);
    }
  };

  // -------------------------------------------------------------
  // 0.1 PERSONAL & EQUIPMENT ASSIGNMENT MANAGEMENT
  // -------------------------------------------------------------
  const selectedAssignProject = projectsList.find(p => p.id === selectedAssignProjectId) || projectsList[0];

  const handleAddStaffToProject = () => {
    if (!selectedAssignProject) return;

    let staffToAdd: StaffMember;
    if (assignUserSelection === 'custom') {
      if (!assignCustomName.trim()) {
        alert('Por favor ingrese el nombre del personal.');
        return;
      }
      staffToAdd = {
        id: `staff_${Date.now()}`,
        name: assignCustomName.trim(),
        role: assignRoleSelection,
        phone: assignCustomPhone.trim() || '+51 900 000 000',
        confirmed: true
      };
    } else {
      const selectedUser = usersList.find(u => u.id === assignUserSelection);
      if (!selectedUser) {
        alert('Seleccione un usuario o personal técnico de la lista.');
        return;
      }
      staffToAdd = {
        id: selectedUser.id,
        name: selectedUser.fullName,
        role: assignRoleSelection || selectedUser.jobTitle || 'Técnico de Producción',
        phone: selectedUser.phone || '+51 900 000 000',
        confirmed: true
      };
    }

    // Check if already in project
    const currentStaffList = selectedAssignProject.assignedStaff || [];
    if (currentStaffList.some(s => s.name.toLowerCase() === staffToAdd.name.toLowerCase())) {
      alert(`El personal "${staffToAdd.name}" ya se encuentra asignado a esta producción.`);
      return;
    }

    const updatedStaffList = [...currentStaffList, staffToAdd];
    const updatedProject: ProductionProject = {
      ...selectedAssignProject,
      assignedStaff: updatedStaffList,
      directorName: assignRoleSelection.includes('Director') ? staffToAdd.name : selectedAssignProject.directorName,
      leadPhotographer: assignRoleSelection.includes('Fotógrafo') ? staffToAdd.name : selectedAssignProject.leadPhotographer,
      dronePilot: assignRoleSelection.includes('Dron') ? staffToAdd.name : selectedAssignProject.dronePilot,
      leadEditor: assignRoleSelection.includes('Editor') ? staffToAdd.name : selectedAssignProject.leadEditor,
      updatedAt: new Date().toISOString()
    };

    const updatedProjects = projectsList.map(p => p.id === updatedProject.id ? updatedProject : p);
    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);
    if (onProjectsChange) onProjectsChange(updatedProjects);
    setAssignCustomName('');
    notifySuccess(`✓ ${staffToAdd.name} (${staffToAdd.role}) asignado a ${selectedAssignProject.title}`);
  };

  const handleRemoveStaffFromProject = (staffId: string) => {
    if (!selectedAssignProject) return;
    const updatedStaffList = (selectedAssignProject.assignedStaff || []).filter(s => s.id !== staffId);
    const updatedProject: ProductionProject = {
      ...selectedAssignProject,
      assignedStaff: updatedStaffList,
      updatedAt: new Date().toISOString()
    };
    const updatedProjects = projectsList.map(p => p.id === updatedProject.id ? updatedProject : p);
    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);
    if (onProjectsChange) onProjectsChange(updatedProjects);
    notifySuccess('Personal retirado de la producción');
  };

  const handleToggleEquipmentForProject = (eqItem: EquipmentItem) => {
    if (!selectedAssignProject) return;
    const currentEq = selectedAssignProject.assignedEquipment || [];
    const exists = currentEq.some(e => e.id === eqItem.id);
    let updatedEq: EquipmentItem[];
    if (exists) {
      updatedEq = currentEq.filter(e => e.id !== eqItem.id);
    } else {
      updatedEq = [...currentEq, { ...eqItem, status: 'Checked-Out' }];
    }
    const updatedProject: ProductionProject = {
      ...selectedAssignProject,
      assignedEquipment: updatedEq,
      updatedAt: new Date().toISOString()
    };
    const updatedProjects = projectsList.map(p => p.id === updatedProject.id ? updatedProject : p);
    setProjectsList(updatedProjects);
    saveProjects(updatedProjects);
    if (onProjectsChange) onProjectsChange(updatedProjects);
    notifySuccess(exists ? `Equipo ${eqItem.name} desasignado` : `✓ Equipo ${eqItem.name} asignado a producción`);
  };

  const handleSaveAll = () => {
    const updatedRules: TCTMasterRules = {
      ...rules,
      companyInfo: { ...companyInfo },
      standardExtraHourRate: Number(standardExtraHourRate),
      maxDiscountPercentageAllowed: Number(maxDiscountPercentage)
    };
    saveMasterRules(updatedRules);
    setRules(updatedRules);
    setIsDirty(false);
    if (onRulesUpdated) onRulesUpdated();
    notifySuccess('✓ Reglas Maestras TCT guardadas de forma persistente');
  };

  const handleResetToDefaults = () => {
    if (window.confirm('¿Deseas restaurar todas las reglas, checklists, inventario de equipos, proformas y formatos a los valores estándar de fábrica de Corporación TCT?')) {
      const reset = resetMasterRulesToDefault();
      setRules(reset);
      setEditingPackage(reset.packages[0] || null);
      setSelectedFormat(reset.templateFormats[0] || null);
      setStandardExtraHourRate(reset.standardExtraHourRate);
      setMaxDiscountPercentage(reset.maxDiscountPercentageAllowed);
      setIsDirty(false);
      if (onRulesUpdated) onRulesUpdated();
      notifySuccess('🔄 Configuración de Reglas restablecida a los valores oficiales TCT');
    }
  };

  // -------------------------------------------------------------
  // 1. CHECKLIST MANAGEMENT
  // -------------------------------------------------------------
  const currentStepChecklistRule = rules.stepChecklists.find(r => r.stepNumber === selectedStepNumber);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const updatedRules = {
      ...rules,
      stepChecklists: rules.stepChecklists.map(rule => {
        if (rule.stepNumber === selectedStepNumber) {
          return {
            ...rule,
            defaultChecklist: [...rule.defaultChecklist, newChecklistText.trim()]
          };
        }
        return rule;
      })
    };
    setRules(updatedRules);
    setIsDirty(true);
    setNewChecklistText('');
  };

  const handleDeleteChecklistItem = (index: number) => {
    const updatedRules = {
      ...rules,
      stepChecklists: rules.stepChecklists.map(rule => {
        if (rule.stepNumber === selectedStepNumber) {
          const filtered = rule.defaultChecklist.filter((_, idx) => idx !== index);
          return {
            ...rule,
            defaultChecklist: filtered
          };
        }
        return rule;
      })
    };
    setRules(updatedRules);
    setIsDirty(true);
  };

  const handleSaveEditedChecklistItem = (index: number) => {
    if (!editingChecklistValue.trim()) return;
    const updatedRules = {
      ...rules,
      stepChecklists: rules.stepChecklists.map(rule => {
        if (rule.stepNumber === selectedStepNumber) {
          const updated = [...rule.defaultChecklist];
          updated[index] = editingChecklistValue.trim();
          return {
            ...rule,
            defaultChecklist: updated
          };
        }
        return rule;
      })
    };
    setRules(updatedRules);
    setIsDirty(true);
    setEditingChecklistIdx(null);
    setEditingChecklistValue('');
  };

  // -------------------------------------------------------------
  // 2. EQUIPMENT INVENTORY & EDITING MANAGEMENT
  // -------------------------------------------------------------
  const handleOpenAddEquipmentModal = () => {
    setEditingEquipment(null);
    const catPrefix = 'EQ';
    const nextNum = (rules.equipmentCatalog.length + 1).toString().padStart(3, '0');
    setFormEqCode(`${catPrefix}-${nextNum}`);
    setFormEqName('');
    setFormEqCategory('Cámara');
    setFormEqSerial('');
    setFormEqImageUrl('');
    setFormEqFeatures('');
    setFormEqDate(new Date().toISOString().split('T')[0]);
    setFormEqCondition('Operativo');
    setFormEqError(null);
    setIsEquipmentModalOpen(true);
  };

  const handleOpenEditEquipmentModal = (eq: EquipmentItem) => {
    setEditingEquipment(eq);
    setFormEqCode(eq.code || '');
    setFormEqName(eq.name || '');
    setFormEqCategory(eq.category || 'Cámara');
    setFormEqSerial(eq.serialNumber || '');
    setFormEqImageUrl(eq.imageUrl || '');
    setFormEqFeatures(eq.features || '');
    setFormEqDate(eq.registrationDate || new Date().toISOString().split('T')[0]);
    setFormEqCondition(
      (eq.condition === 'Operativo' || eq.condition === 'En Mantenimiento' || eq.condition === 'De Baja' || eq.condition === 'Nuevo')
        ? eq.condition
        : 'Operativo'
    );
    setFormEqError(null);
    setIsEquipmentModalOpen(true);
  };

  const handleEquipmentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormEqError('La imagen no debe superar los 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        setFormEqImageUrl(base64);
        setFormEqError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEquipmentForm = () => {
    setFormEqError(null);
    const cleanCode = formEqCode.trim().toUpperCase();
    const cleanName = formEqName.trim();
    const cleanSerial = formEqSerial.trim();

    if (!cleanCode) {
      setFormEqError('El código del equipo es obligatorio (ej. CAM-001).');
      return;
    }
    if (!cleanName) {
      setFormEqError('El nombre del equipo es obligatorio.');
      return;
    }

    // Check duplicate code
    const isDupCode = rules.equipmentCatalog.some(e => 
      e.id !== editingEquipment?.id && 
      e.code && 
      e.code.trim().toUpperCase() === cleanCode
    );
    if (isDupCode) {
      setFormEqError(`⚠️ Ya existe otro equipo registrado con el código "${cleanCode}". Utilice un código único para evitar duplicados.`);
      return;
    }

    // Check duplicate serial number (if provided)
    if (cleanSerial) {
      const isDupSerial = rules.equipmentCatalog.some(e =>
        e.id !== editingEquipment?.id &&
        e.serialNumber &&
        e.serialNumber.trim().toUpperCase() === cleanSerial.toUpperCase()
      );
      if (isDupSerial) {
        setFormEqError(`⚠️ Ya existe otro equipo registrado con el número de serie "${cleanSerial}".`);
        return;
      }
    }

    let updatedList: EquipmentItem[];
    if (editingEquipment) {
      updatedList = rules.equipmentCatalog.map(e => {
        if (e.id === editingEquipment.id) {
          return {
            ...e,
            code: cleanCode,
            name: cleanName,
            category: formEqCategory,
            serialNumber: cleanSerial || undefined,
            imageUrl: formEqImageUrl || undefined,
            features: formEqFeatures.trim() || undefined,
            registrationDate: formEqDate,
            condition: formEqCondition,
            maintenanceRequired: formEqCondition === 'En Mantenimiento' || formEqCondition === 'De Baja',
            isAvailable: formEqCondition === 'Operativo' || formEqCondition === 'Nuevo'
          };
        }
        return e;
      });
      notifySuccess(`✓ Equipo "${cleanName}" (${cleanCode}) actualizado en el inventario`);
    } else {
      const newEq: EquipmentItem = {
        id: `eq-${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        category: formEqCategory,
        serialNumber: cleanSerial || undefined,
        imageUrl: formEqImageUrl || undefined,
        features: formEqFeatures.trim() || undefined,
        registrationDate: formEqDate,
        condition: formEqCondition,
        checkedOut: false,
        isAvailable: formEqCondition === 'Operativo' || formEqCondition === 'Nuevo',
        maintenanceRequired: formEqCondition === 'En Mantenimiento' || formEqCondition === 'De Baja'
      };
      updatedList = [newEq, ...rules.equipmentCatalog];
      notifySuccess(`✓ Equipo "${cleanName}" (${cleanCode}) registrado en el inventario`);
    }

    const updatedRules = {
      ...rules,
      equipmentCatalog: updatedList
    };
    setRules(updatedRules);
    saveMasterRules(updatedRules);
    if (onRulesUpdated) onRulesUpdated();
    setIsDirty(true);
    setIsEquipmentModalOpen(false);
  };

  const handleDeleteEquipment = (id: string) => {
    const target = rules.equipmentCatalog.find(e => e.id === id);
    if (window.confirm(`¿Seguro que deseas eliminar el equipo "${target?.name || 'seleccionado'}" del inventario institucional?`)) {
      const updatedRules = {
        ...rules,
        equipmentCatalog: rules.equipmentCatalog.filter(e => e.id !== id)
      };
      setRules(updatedRules);
      saveMasterRules(updatedRules);
      if (onRulesUpdated) onRulesUpdated();
      setIsDirty(true);
      notifySuccess('Equipo eliminado del catálogo');
    }
  };

  const handleExportInventoryPdf = async () => {
    setIsExportingInventoryPdf(true);
    try {
      const ok = await exportElementToPdf(
        'tct-inventory-printable-document',
        `TCT-Inventario-Equipos-${new Date().toISOString().split('T')[0]}.pdf`,
        'Inventario Oficial de Equipos TCT'
      );
      if (ok) {
        notifySuccess('✓ Inventario oficial exportado en PDF exitosamente');
      }
    } catch (err) {
      console.error('Error exporting inventory PDF:', err);
      notifyError('No se pudo generar el PDF del inventario.');
    } finally {
      setIsExportingInventoryPdf(false);
    }
  };

  const filteredEquipment = rules.equipmentCatalog.filter(eq => {
    const matchesCat = equipmentFilterCat === 'all' || eq.category === equipmentFilterCat;
    const matchesCond = inventoryConditionFilter === 'all' || eq.condition === inventoryConditionFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      eq.name.toLowerCase().includes(q) ||
      (eq.code && eq.code.toLowerCase().includes(q)) ||
      (eq.serialNumber && eq.serialNumber.toLowerCase().includes(q)) ||
      (eq.features && eq.features.toLowerCase().includes(q));
    return matchesCat && matchesCond && matchesSearch;
  });

  // -------------------------------------------------------------
  // 3. PROFORMA PACKAGES MANAGEMENT
  // -------------------------------------------------------------
  const handleAddServiceToEditingPackage = () => {
    if (!newServiceInput.trim() || !editingPackage) return;
    const updatedPkg = {
      ...editingPackage,
      includedServices: [...editingPackage.includedServices, newServiceInput.trim()]
    };
    setEditingPackage(updatedPkg);
    const updatedPackages = rules.packages.map(p => p.id === updatedPkg.id ? updatedPkg : p);
    setRules({ ...rules, packages: updatedPackages });
    setNewServiceInput('');
  };

  const handleDeleteServiceFromEditingPackage = (index: number) => {
    if (!editingPackage) return;
    const updatedServices = editingPackage.includedServices.filter((_, idx) => idx !== index);
    const updatedPkg = {
      ...editingPackage,
      includedServices: updatedServices
    };
    setEditingPackage(updatedPkg);
    const updatedPackages = rules.packages.map(p => p.id === updatedPkg.id ? updatedPkg : p);
    setRules({ ...rules, packages: updatedPackages });
  };

  const handleCreateNewPackage = () => {
    const newPack: TCTMasterPackage = {
      id: `pkg-${Date.now()}`,
      name: 'Nuevo Paquete ' + (rules.packages.length + 1),
      basePrice: 1500,
      price: 1500,
      standardHours: 8,
      includesDrone: false,
      includesPhotobook: false,
      recommendedEquipment: [],
      slaDaysVideo: 15,
      slaDaysPhotobook: 30,
      description: 'Descripción del paquete personalizado',
      eventType: 'Evento Corporativo',
      includedServices: [
        'Cobertura con 1 Cámara Full HD',
        'Ingest y Edición de video resumen',
        'Entrega en USB TCT'
      ],
      isPopular: false
    };
    const updated = { ...rules, packages: [...rules.packages, newPack] };
    setRules(updated);
    setEditingPackage(newPack);
    notifySuccess('Nuevo paquete creado');
  };

  const handleDeletePackage = (id: string) => {
    if (rules.packages.length <= 1) {
      alert('Debe existir al menos un paquete en el sistema.');
      return;
    }
    if (window.confirm('¿Deseas eliminar este paquete de la lista institucional?')) {
      const updatedPackages = rules.packages.filter(p => p.id !== id);
      const updated = { ...rules, packages: updatedPackages };
      setRules(updated);
      setEditingPackage(updatedPackages[0] || null);
      notifySuccess('Paquete eliminado');
    }
  };

  const handleUpdateEditingPackage = (field: keyof TCTMasterPackage, value: any) => {
    if (!editingPackage) return;
    const updatedPkg = { ...editingPackage, [field]: value };
    setEditingPackage(updatedPkg);
    const updatedPackages = rules.packages.map(p => p.id === updatedPkg.id ? updatedPkg : p);
    setRules({ ...rules, packages: updatedPackages });
  };

  // -------------------------------------------------------------
  // 4. SERVICES & ADVISORS MANAGEMENT
  // -------------------------------------------------------------
  const handleAddServiceCatalogItem = () => {
    if (!newServiceName.trim()) return;
    const newItem = {
      id: `svc-${Date.now()}`,
      name: newServiceName.trim(),
      category: newServiceCategory
    };
    const updatedServices = [...(rules.standardServicesCatalog || []), newItem];
    setRules({ ...rules, standardServicesCatalog: updatedServices });
    setNewServiceName('');
    notifySuccess(`✓ Servicio "${newItem.name}" agregado al catálogo`);
  };

  const handleDeleteServiceCatalogItem = (id: string) => {
    const updatedServices = (rules.standardServicesCatalog || []).filter(s => s.id !== id);
    setRules({ ...rules, standardServicesCatalog: updatedServices });
  };

  const handleAddAdvisor = () => {
    if (!newAdvisorName.trim()) return;
    if (rules.authorizedContractHolders.includes(newAdvisorName.trim())) {
      alert('Este asesor ya está registrado.');
      return;
    }
    const updated = {
      ...rules,
      authorizedContractHolders: [...rules.authorizedContractHolders, newAdvisorName.trim()]
    };
    setRules(updated);
    setNewAdvisorName('');
    notifySuccess('Asesor autorizado agregado');
  };

  const handleDeleteAdvisor = (name: string) => {
    if (rules.authorizedContractHolders.length <= 1) {
      alert('Debe existir al menos un asesor/responsable en la lista.');
      return;
    }
    if (window.confirm(`¿Eliminar a "${name}" de los asesores autorizados?`)) {
      const updated = {
        ...rules,
        authorizedContractHolders: rules.authorizedContractHolders.filter(h => h !== name)
      };
      setRules(updated);
    }
  };

  // -------------------------------------------------------------
  // 5. FORMATS MANAGEMENT
  // -------------------------------------------------------------
  const handleDownloadFormat = (fmt: TemplateDocumentFormat) => {
    const blob = new Blob([fmt.contentTemplate], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fmt.title.replace(/\s+/g, '_')}_v${fmt.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess(`Descargando formato: ${fmt.title}`);
  };

  // -------------------------------------------------------------
  // 6. USER MANAGEMENT (Admin & Empleados)
  // -------------------------------------------------------------
  const refreshUsersList = () => {
    const updated = getStoredUsers();
    setUsersList(updated);
    if (onUsersChanged) onUsersChanged(updated);
  };

  const handleOpenCreateUser = () => {
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
    setUserFormError(null);
    setIsUserFormOpen(true);
  };

  const handleOpenEditUser = (u: AuthUser) => {
    setEditingUserId(u.id);
    setFormUsername(u.username);
    setFormPassword(u.password);
    setFormRole(u.role);
    setFormFullName(u.fullName);
    setFormJobTitle(u.jobTitle || 'Director de Cámara');
    setFormPhone(u.phone || '');
    setFormEmail(u.email || '');
    setFormIsActive(u.isActive);
    setShowPassword(false);
    setUserFormError(null);
    setIsUserFormOpen(true);
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);

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
      notifySuccess(editingUserId ? `✓ Usuario "${formUsername}" actualizado.` : `✓ Usuario "${formUsername}" creado.`);
      setIsUserFormOpen(false);
      refreshUsersList();
    } else {
      setUserFormError(result.error || 'Error al guardar el usuario.');
    }
  };

  const handleToggleUserStatus = (u: AuthUser) => {
    if (u.username.toUpperCase() === 'TCT') {
      notifySuccess('⚠️ La cuenta principal "TCT" no se puede desactivar.');
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
      notifySuccess(`Estado de "${u.username}" cambiado a ${!u.isActive ? 'Activo' : 'Inactivo'}.`);
      refreshUsersList();
    }
  };

  const handleDeleteUserItem = (u: AuthUser) => {
    if (u.username.toUpperCase() === 'TCT') {
      notifySuccess('⚠️ No se puede eliminar el usuario principal "TCT".');
      return;
    }

    const allProjects = getStoredProjects();
    const report = getUserProjectAssignments(u, allProjects);

    let message = `¿Está seguro de eliminar al usuario "${u.fullName}" (@${u.username})?\n\n`;
    message += `📊 Resumen de asignaciones en el sistema:\n`;
    message += `• Contratos vinculados: ${report.totalContracts}\n`;
    message += `• Producciones asignado como personal técnico: ${report.totalStaffAssignments}\n`;

    if (report.staffProductions.length > 0) {
      message += `\n📋 Producciones donde asistirá como técnico:\n`;
      report.staffProductions.slice(0, 5).forEach((p, i) => {
        message += `  ${i + 1}. ${p.title} (${p.eventDate}) - ${p.role}\n`;
      });
      if (report.staffProductions.length > 5) {
        message += `  ... y ${report.staffProductions.length - 5} producción(es) más.\n`;
      }
    }

    message += `\nEsta acción actualizará el sistema y los registros de usuarios al instante. ¿Desea proceder?`;

    if (window.confirm(message)) {
      const result = deleteUser(u.id);
      if (result.success) {
        notifySuccess(`✓ Usuario "${u.username}" eliminado y datos actualizados al instante.`);
        refreshUsersList();
      }
    }
  };

  const handleResetUsersDefaults = () => {
    if (window.confirm('¿Restablecer las cuentas de usuarios a los valores predeterminados de Corporación TCT?')) {
      resetUsersToDefaults();
      refreshUsersList();
      notifySuccess('✓ Cuentas de usuario restablecidas a valores de fábrica.');
    }
  };

  const filteredUsers = usersList.filter(u => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const q = userSearchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      u.username.toLowerCase().includes(q) || 
      u.fullName.toLowerCase().includes(q) || 
      (u.jobTitle && u.jobTitle.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));
    return matchesRole && matchesQuery;
  });

  // -------------------------------------------------------------
  // 7. SYSTEM & DEMO RESET & BACKUP TOOLS
  // -------------------------------------------------------------
  const handleTriggerResetDemo = () => {
    if (window.confirm('¿Deseas restablecer la base de datos a los proyectos demo oficiales de Corporación TCT?')) {
      const reset = resetToDemoData();
      if (onProjectsChange) {
        onProjectsChange(reset);
      } else if (onResetDemoData) {
        onResetDemoData();
      }
      notifySuccess('🔄 Proyectos demo restaurados correctamente para todos los usuarios.');
    }
  };

  const handleExportFullBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      system: 'Corporación TCT Producción Audiovisual',
      version: '2.0.0',
      projects: getStoredProjects(),
      rules: getStoredRules(),
      users: getStoredUsers()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `TCT_Respaldo_Completo_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    notifySuccess('✓ Archivo de copia de seguridad JSON exportado con éxito.');
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.projects && Array.isArray(parsed.projects)) {
            saveProjects(parsed.projects);
            if (onProjectsChange) onProjectsChange(parsed.projects);
          }
          if (parsed.rules) {
            saveMasterRules(parsed.rules);
            setRules(parsed.rules);
          }
          if (parsed.users && Array.isArray(parsed.users)) {
            localStorage.setItem('tct_auth_users_v1', JSON.stringify(parsed.users));
            refreshUsersList();
          }
          if (onRulesUpdated) onRulesUpdated();
          notifySuccess('✓ Respaldo restaurado exitosamente en el sistema local.');
        } catch (err) {
          alert('Error al leer el archivo JSON de respaldo. Verifique el formato.');
        }
      };
    }
  };

  // -------------------------------------------------------------
  // 8. DATA PURGE & CLEANUP HANDLERS
  // -------------------------------------------------------------
  const handleDeleteAllContractsHistory = () => {
    if (window.confirm('⚠️ ¿CONFIRMACIÓN: Deseas ELIMINAR TODO EL HISTORIAL Y REGISTRO DE CONTRATOS?\n\nEsta acción vaciará todos los expedientes, contratos y cotizaciones del sistema. Las cuentas de usuario y reglas se mantendrán.')) {
      const empty = deleteAllContractsHistory();
      if (onProjectsChange) {
        onProjectsChange(empty);
      }
      notifySuccess('🗑️ Todos los registros e historial de contratos han sido eliminados.');
    }
  };

  const handleFactoryResetAllData = () => {
    if (window.confirm('🚨 ACCIÓN DE ALTO RIESGO: ¿REINICIO TOTAL DE FÁBRICA?\n\nSe eliminarán:\n• Todos los contratos y cotizaciones\n• Todos los perfiles de usuario creados\n• Todos los cargos y configuraciones personalizadas\n• Todos los archivos y firmas adjuntas\n\n¿Estás completamente seguro?')) {
      factoryResetAllSystemData();
      resetUsersToDefaults();
      resetMasterRulesToDefault();
      resetShortcutsToDefault();
      refreshUsersList();
      if (onProjectsChange) {
        onProjectsChange([]);
      }
      if (onRulesUpdated) onRulesUpdated();
      notifySuccess('✨ Sistema reiniciado a estado original de fábrica.');
    }
  };

  const handleExecuteSelectiveDeletion = () => {
    if (deleteFilterDataType === 'contracts') {
      if (window.confirm('¿Eliminar todos los proyectos que tienen N° de Contrato emitido?')) {
        const result = deleteProjectsByFilter({ targetType: 'contracts' });
        if (onProjectsChange) onProjectsChange(result.remaining);
        notifySuccess(`🗑️ Se eliminaron ${result.deletedCount} contrato(s) del sistema.`);
      }
    } else if (deleteFilterDataType === 'quotations') {
      if (window.confirm('¿Eliminar todas las cotizaciones preliminares (sin N° de contrato)?')) {
        const result = deleteProjectsByFilter({ targetType: 'quotations' });
        if (onProjectsChange) onProjectsChange(result.remaining);
        notifySuccess(`🗑️ Se eliminaron ${result.deletedCount} cotización(es) del sistema.`);
      }
    } else if (deleteFilterDataType === 'employees') {
      if (window.confirm(`¿Eliminar empleados y personal técnico según el filtro (${deleteFilterStaffRole})?`)) {
        if (deleteFilterStaffRole === 'all' || deleteFilterStaffRole === 'employee') {
          const res = deleteAllEmployeesExceptAdmin();
          refreshUsersList();
          notifySuccess(`🗑️ Se eliminaron ${res.deletedCount} cuenta(s) de empleados técnicos.`);
        }
      }
    } else if (deleteFilterDataType === 'by_event_type') {
      if (window.confirm(`¿Eliminar todos los proyectos con tipo de evento "${deleteFilterEventType}"?`)) {
        const result = deleteProjectsByFilter({ eventType: deleteFilterEventType });
        if (onProjectsChange) onProjectsChange(result.remaining);
        notifySuccess(`🗑️ Se eliminaron ${result.deletedCount} proyecto(s) de tipo "${deleteFilterEventType}".`);
      }
    } else if (deleteFilterDataType === 'archived_only') {
      if (window.confirm('¿Eliminar todos los proyectos archivados y con 12 pasos completados?')) {
        const result = deleteProjectsByFilter({ isArchivedOnly: true });
        if (onProjectsChange) onProjectsChange(result.remaining);
        notifySuccess(`🗑️ Se eliminaron ${result.deletedCount} proyecto(s) archivados/completados.`);
      }
    }
  };

  const RULES_OPTIONS: {
    id: SettingsTab;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    color: string;
    bgHover: string;
    border: string;
  }[] = [
    {
      id: 'company',
      title: '1. Empresa TCT',
      description: 'Logo oficial, RUC, cuentas bancarias, representante y lema',
      icon: Building2,
      badge: 'Oficial',
      color: 'text-amber-800 bg-amber-100',
      bgHover: 'hover:border-amber-400 hover:bg-amber-50/70',
      border: 'border-amber-200'
    },
    {
      id: 'contract_design',
      title: '2. Diseño Contrato',
      description: 'Personalización de encabezados, logos, firmas y cláusulas',
      icon: Palette,
      badge: 'Visual',
      color: 'text-amber-900 bg-amber-200/80',
      bgHover: 'hover:border-amber-500 hover:bg-amber-100/60',
      border: 'border-amber-300'
    },
    {
      id: 'staff_assignment',
      title: '3. Asignación Personal',
      description: 'Camarógrafos, editores y técnicos asignados por contrato',
      icon: UserCheck,
      badge: `${projectsList.length} Proyectos`,
      color: 'text-indigo-700 bg-indigo-100',
      bgHover: 'hover:border-indigo-400 hover:bg-indigo-50/70',
      border: 'border-indigo-200'
    },
    {
      id: 'checklists',
      title: '4. Checklists',
      description: '12 fases de preproducción, rodaje, postproducción y entrega',
      icon: ListChecks,
      badge: '12 Pasos',
      color: 'text-emerald-700 bg-emerald-100',
      bgHover: 'hover:border-emerald-400 hover:bg-emerald-50/70',
      border: 'border-emerald-200'
    },
    {
      id: 'equipment',
      title: '5. Inventario',
      description: 'Cámaras, lentes, audio, drones, iluminación y accesorios',
      icon: Camera,
      badge: `${rules.equipmentCatalog.length} Equipos`,
      color: 'text-slate-800 bg-slate-200',
      bgHover: 'hover:border-slate-400 hover:bg-slate-100',
      border: 'border-slate-300'
    },
    {
      id: 'packages',
      title: '6. Proformas',
      description: 'Paquetes, bodas, quinceañeros, eventos y cotizaciones',
      icon: Package,
      badge: `${rules.packages.length} Paquetes`,
      color: 'text-purple-700 bg-purple-100',
      bgHover: 'hover:border-purple-400 hover:bg-purple-50/70',
      border: 'border-purple-200'
    },
    {
      id: 'services',
      title: '7. Tarifas & Asesores',
      description: 'Horas extra, comisiones, penalidades y recargos',
      icon: Coins,
      badge: 'Tarifario',
      color: 'text-amber-700 bg-amber-100',
      bgHover: 'hover:border-amber-400 hover:bg-amber-50/70',
      border: 'border-amber-200'
    },
    {
      id: 'formats',
      title: '8. Formatos',
      description: 'Plantillas de actas de conformidad y acuerdos legales',
      icon: FileText,
      badge: `${rules.formatsTemplates?.length || 5} Docs`,
      color: 'text-cyan-700 bg-cyan-100',
      bgHover: 'hover:border-cyan-400 hover:bg-cyan-50/70',
      border: 'border-cyan-200'
    },
    {
      id: 'users',
      title: '9. Usuarios & Cargos',
      description: 'Crear y administrar empleados, roles y accesos seguros',
      icon: Users,
      badge: `${usersList.length} Usuarios`,
      color: 'text-blue-700 bg-blue-100',
      bgHover: 'hover:border-blue-400 hover:bg-blue-50/70',
      border: 'border-blue-200'
    },
    {
      id: 'shortcuts',
      title: '10. Atajos',
      description: 'Teclas rápidas de teclado para navegación y emisión rápida',
      icon: Keyboard,
      badge: `${shortcutsList.length} Atajos`,
      color: 'text-orange-700 bg-orange-100',
      bgHover: 'hover:border-orange-400 hover:bg-orange-50/70',
      border: 'border-orange-200'
    },
    {
      id: 'system',
      title: '11. Base de Datos',
      description: 'Copias de seguridad, exportar / importar y mantenimiento',
      icon: Database,
      badge: 'Sistema',
      color: 'text-rose-700 bg-rose-100',
      bgHover: 'hover:border-rose-400 hover:bg-rose-50/70',
      border: 'border-rose-200'
    },
    {
      id: 'live_sessions',
      title: '12. Monitor en Vivo',
      description: 'Ver usuarios conectados en este instante, expulsar o bloquear no deseados',
      icon: Activity,
      badge: `${liveSessionsList.filter(s => s.status === 'online').length} Conectados`,
      color: 'text-emerald-700 bg-emerald-100',
      bgHover: 'hover:border-emerald-400 hover:bg-emerald-50/70',
      border: 'border-emerald-200'
    }
  ];

  const handleSelectOption = (tabId: SettingsTab) => {
    setActiveTab(tabId);
    setShowButtonsMenu(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in">
      <div className="bg-white text-slate-900 rounded-3xl max-w-5xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <TCTLogo size="sm" variant="icon-only" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>REGLAS</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                  TCT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {showButtonsMenu 
                  ? 'Seleccione una opción para ver y configurar' 
                  : (RULES_OPTIONS.find(o => o.id === activeTab)?.title || 'Configuración')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!showButtonsMenu && (
              <button
                onClick={() => setShowButtonsMenu(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Volver a los botones de Reglas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Menú de Botones</span>
              </button>
            )}
            <SyncStatusIndicator />
            <button
              onClick={() => {
                if (isDirty) {
                  setShowSaveConfirmDialog(true);
                } else {
                  onClose();
                }
              }}
              className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert Message */}
        {successMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-inner">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </span>
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-inner">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </span>
          </div>
        )}

        {/* Navigation Bar when inside a section (Atrás, Adelante, Guardar) */}
        {!showButtonsMenu && (
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between shrink-0 gap-3">
            {/* Left: Botón Atrás */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const idx = RULES_OPTIONS.findIndex(o => o.id === activeTab);
                  if (idx > 0) {
                    setActiveTab(RULES_OPTIONS[idx - 1].id);
                  } else {
                    setShowButtonsMenu(true);
                  }
                }}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black border border-slate-300 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Ir a la sección anterior"
              >
                <ArrowLeft className="w-4 h-4 text-amber-600" />
                <span>Atrás</span>
              </button>

              <button
                onClick={() => setShowButtonsMenu(true)}
                className="p-1.5 bg-white hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold border border-slate-300 flex items-center justify-center shadow-xs transition-all cursor-pointer"
                title="Volver al Menú Principal de Reglas"
              >
                <LayoutGrid className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Center: Current Tab Badge & Name */}
            <div className="flex items-center space-x-2 truncate">
              {(() => {
                const currentOpt = RULES_OPTIONS.find(o => o.id === activeTab);
                const currentIdx = RULES_OPTIONS.findIndex(o => o.id === activeTab);
                const Icon = currentOpt?.icon || Sliders;
                return (
                  <div className="flex items-center space-x-2 bg-white px-3.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                    <Icon className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-black text-slate-900 truncate">
                      {currentOpt?.title || 'Sección'}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {currentIdx + 1}/{RULES_OPTIONS.length}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Right: Botón Adelante & Botón Guardar */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const idx = RULES_OPTIONS.findIndex(o => o.id === activeTab);
                  if (idx < RULES_OPTIONS.length - 1) {
                    setActiveTab(RULES_OPTIONS[idx + 1].id);
                  }
                }}
                disabled={RULES_OPTIONS.findIndex(o => o.id === activeTab) >= RULES_OPTIONS.length - 1}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none text-slate-800 rounded-xl text-xs font-black border border-slate-300 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Ir a la sección siguiente"
              >
                <span>Adelante</span>
                <ArrowRight className="w-4 h-4 text-amber-600" />
              </button>

              <button
                onClick={handleSaveAll}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title="Guardar todos los cambios"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 space-y-6">

          {/* ========================================================= */}
          {/* MENU VIEW: GRID OF 11 INTERACTIVE OPTION BUTTONS          */}
          {/* ========================================================= */}
          {showButtonsMenu && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center max-w-xl mx-auto space-y-1.5">
                <h4 className="text-lg font-black text-slate-900 flex items-center justify-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-500" />
                  <span>Panel de Opciones y Reglas Maestras</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Seleccione cualquiera de los 11 módulos para ver y gestionar sus configuraciones de forma instantánea.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {RULES_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`p-4 sm:p-5 rounded-2xl bg-white border ${opt.border} shadow-xs ${opt.bgHover} transition-all duration-200 text-left flex flex-col justify-between group cursor-pointer relative hover:shadow-md hover:-translate-y-0.5 active:translate-y-0`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`w-10 h-10 rounded-2xl ${opt.color} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {opt.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black border border-slate-200">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <div>
                          <h5 className="font-black text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                            {opt.title}
                          </h5>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-amber-600 mt-2">
                        <span>Ingresar a configuración</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 0: DATOS OFICIALES CORPORACIÓN TCT (WITH LOGO CHANGER)*/}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'company' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">
                        Datos Institucionales de Corporación TCT
                      </h4>
                      <p className="text-xs text-slate-500">
                        Estos datos y el Logo Oficial se aplican automáticamente en Contratos, Proformas y Actas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleResetCompanyInfo}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Restaurar a los valores originales de fábrica"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Fábrica</span>
                    </button>
                    <button
                      onClick={handleSaveCompanyInfo}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Guardar datos de la empresa"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Empresa</span>
                    </button>
                  </div>
                </div>

                {/* --------------------------------------------------- */}
                {/* LOGO CORPORATIVO INSTITUCIONAL - GESTOR & CAMBIO    */}
                {/* --------------------------------------------------- */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-black text-white text-sm flex items-center gap-2">
                          <span>Logo Institucional de Corporación TCT</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                            Activo
                          </span>
                        </h5>
                        <p className="text-xs text-slate-400">
                          Cambie el logotipo para que se refleje de inmediato en la cabecera del sistema, impresiones y contratos.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleResetLogo}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Restablecer al Isotipo Oficial Predeterminado"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Logo Original</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Visual Preview */}
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Vista Previa Oficial
                      </span>
                      <div className="w-24 h-24 bg-slate-900/80 rounded-2xl flex items-center justify-center p-2 border border-slate-700 shadow-inner">
                        {companyInfo.logoUrl ? (
                          <img
                            src={companyInfo.logoUrl}
                            alt="Logo Corporativo TCT"
                            className="max-w-full max-h-full object-contain drop-shadow-md"
                          />
                        ) : (
                          <TCTLogo size="lg" variant="icon-only" />
                        )}
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold mt-2 truncate max-w-full">
                        {companyInfo.commercialName || 'Corporación TCT'}
                      </span>
                    </div>

                    {/* File Upload and Presets */}
                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          Subir Nuevo Logo (PNG, JPG, SVG o WebP):
                        </label>
                        <input
                          type="file"
                          ref={logoFileInputRef}
                          onChange={handleLogoFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Seleccionar Imagen de Dispositivo</span>
                          </button>
                          <span className="text-[11px] text-slate-400">Máx. 3MB</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          O Pegar Enlace / URL de la Imagen:
                        </label>
                        <input
                          type="text"
                          value={companyInfo.logoUrl || ''}
                          onChange={(e) => handleUpdateLogo(e.target.value)}
                          placeholder="https://ejemplo.com/logo-tct.png"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      {/* Quick presets */}
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-400 mr-2">Predeterminados:</span>
                        <div className="inline-flex gap-2 flex-wrap mt-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateLogo('/assets/tct-logo.png')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-lg transition-all border border-slate-700 cursor-pointer"
                          >
                            Isotipo Oficial (Rojo/Dorado)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateLogo('/assets/tct-3d-gold.png')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 rounded-lg transition-all border border-slate-700 cursor-pointer"
                          >
                            Dorado 3D Insignia
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Razón Social Legal:</label>
                    <input
                      type="text"
                      value={companyInfo.legalName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, legalName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Comercial:</label>
                    <input
                      type="text"
                      value={companyInfo.commercialName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, commercialName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Número de RUC:</label>
                    <input
                      type="text"
                      value={companyInfo.ruc}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, ruc: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Slogan / Lema Oficial:</label>
                    <input
                      type="text"
                      value={companyInfo.slogan}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, slogan: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none font-slogan text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Representante Legal / Titular Contrato:</label>
                    <input
                      type="text"
                      value={companyInfo.legalRepresentative}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, legalRepresentative: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Director General de Producción:</label>
                    <input
                      type="text"
                      value={companyInfo.productionDirector}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, productionDirector: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Fiscal / Sede de Operaciones:</label>
                    <input
                      type="text"
                      value={companyInfo.fiscalAddress}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, fiscalAddress: e.target.value, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Principal de Contacto:</label>
                    <input
                      type="text"
                      value={companyInfo.phoneMain}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phoneMain: e.target.value, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Secundario / WhatsApp:</label>
                    <input
                      type="text"
                      value={companyInfo.phoneSecondary || ''}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phoneSecondary: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico Oficial:</label>
                    <input
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sitio Web / Portal:</label>
                    <input
                      type="text"
                      value={companyInfo.website}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Días de Custodia del Master en Servidor (Contrato):</label>
                    <input
                      type="number"
                      value={companyInfo.contractMasterStorageDays || 60}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, contractMasterStorageDays: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Bank Accounts Section */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-amber-600" />
                      <span>Cuentas Bancarias Oficiales para Depósito / Transferencia</span>
                    </h5>
                    <span className="text-[11px] font-bold text-slate-500">
                      {companyInfo.bankAccounts?.length || 0} cuentas registradas
                    </span>
                  </div>

                  {/* List of existing accounts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(companyInfo.bankAccounts || []).map((acc) => (
                      <div key={acc.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-xs text-slate-900">{acc.bankName}</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
                              {acc.currency === 'USD' ? 'Dólares ($)' : 'Soles (S/)'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-700 mt-1 font-mono">
                            N° Cuenta: {acc.accountNumber}
                          </p>
                          {acc.cci && (
                            <p className="text-[11px] font-medium text-slate-500 font-mono">
                              CCI: {acc.cci}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Titular: {acc.accountHolder}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteBankAccount(acc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar cuenta bancaria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Bank Account Box */}
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
                    <h6 className="font-black text-xs text-amber-900 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Nueva Cuenta Bancaria Institucional</span>
                    </h6>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <input
                          type="text"
                          placeholder="Banco (ej. BCP, BBVA, Interbank)"
                          value={newBankName}
                          onChange={(e) => setNewBankName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="N° de Cuenta Corriente / Ahorros"
                          value={newBankAccountNum}
                          onChange={(e) => setNewBankAccountNum(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Código Interbancario (CCI)"
                          value={newBankCci}
                          onChange={(e) => setNewBankCci(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={newBankCurrency}
                          onChange={(e) => setNewBankCurrency(e.target.value as 'PEN' | 'USD')}
                          className="bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800"
                        >
                          <option value="PEN">Soles (PEN)</option>
                          <option value="USD">Dólares (USD)</option>
                        </select>
                        <button
                          onClick={handleAddBankAccount}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                        >
                          + Añadir
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 0.05: DISEÑO, ENCABEZADO Y CLÁUSULAS DEL CONTRATO */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'contract_design' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                
                {/* Header with Save & Reset */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300">
                      Personalización de Plantilla de Contrato
                    </span>
                    <h4 className="font-black text-slate-900 text-lg mt-1 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-amber-600" />
                      <span>Diseño, Encabezado, Fuentes, Colores y Cláusulas del Contrato</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Personalice los textos del encabezado, el logo institucional, la tipografía, los colores y las cláusulas de difusión en internet de los contratos generados.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleResetContractDesign}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restablecer Oficial</span>
                    </button>
                    <button
                      onClick={handleSaveContractDesign}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Diseño Contrato</span>
                    </button>
                  </div>
                </div>

                {/* Grid of Customization Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Panel 1: Encabezado y Logo */}
                  <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
                    <h5 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-amber-600" />
                      <span>1. Encabezado y Logotipo del Contrato</span>
                    </h5>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Título Principal de la Empresa en Contrato:</label>
                        <input
                          type="text"
                          value={contractDesign.headerTitle}
                          onChange={(e) => setContractDesign({ ...contractDesign, headerTitle: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                          placeholder="CORPORACIÓN TCT"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Subtítulo / Rubro Institucional:</label>
                        <input
                          type="text"
                          value={contractDesign.headerSubtitle}
                          onChange={(e) => setContractDesign({ ...contractDesign, headerSubtitle: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                          placeholder="Servicios Audiovisuales, Producción Cinematográfica & Fotografía Profesional"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Información Legal / RUC / Dirección en Encabezado:</label>
                        <input
                          type="text"
                          value={contractDesign.headerLegalInfo}
                          onChange={(e) => setContractDesign({ ...contractDesign, headerLegalInfo: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:border-amber-500 focus:outline-none"
                          placeholder="RUC: 20608941253 • Jr. Las Camelias 450, San Isidro, Lima • Tel: (01) 748-9200"
                        />
                      </div>

                      {/* Logo Selector */}
                      <div className="pt-2 border-t border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Logotipo en el Contrato:</label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800">
                            <input
                              type="radio"
                              name="logoTypeSelection"
                              checked={contractDesign.logoType === 'official'}
                              onChange={() => setContractDesign({ ...contractDesign, logoType: 'official' })}
                              className="accent-amber-600"
                            />
                            <span>Logo Oficial TCT</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800">
                            <input
                              type="radio"
                              name="logoTypeSelection"
                              checked={contractDesign.logoType === 'custom'}
                              onChange={() => setContractDesign({ ...contractDesign, logoType: 'custom' })}
                              className="accent-amber-600"
                            />
                            <span>Logo Personalizado / Imagen</span>
                          </label>
                        </div>

                        {contractDesign.logoType === 'custom' && (
                          <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                            {contractDesign.customLogoUrl ? (
                              <img
                                src={contractDesign.customLogoUrl}
                                alt="Logo Personalizado"
                                className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-slate-50"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            )}
                            <div className="flex-1">
                              <label className="inline-block px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-lg cursor-pointer transition-all">
                                <Upload className="w-3.5 h-3.5 inline mr-1" />
                                Subir Imagen Logo
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCustomLogoUpload}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-[10px] text-slate-500 mt-1">PNG, JPG o WebP con fondo transparente recomendado (máx. 2MB)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Tipografía y Paleta de Colores */}
                  <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200">
                    <h5 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Type className="w-4 h-4 text-indigo-600" />
                      <span>2. Tipografía & Estilo Visual</span>
                    </h5>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Familia Tipográfica del Contrato:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'sans', label: 'Modern Sans', desc: 'Sans-serif moderna y limpia', previewClass: 'font-sans' },
                            { id: 'serif', label: 'Editorial Serif', desc: 'Serif formal y distinguida', previewClass: 'font-serif' },
                            { id: 'geometric', label: 'Geométrica Pro', desc: 'Sans de alta densidad técnica', previewClass: 'font-sans tracking-tight' },
                            { id: 'mono', label: 'Monospace Tech', desc: 'Tipografía monospace técnica', previewClass: 'font-mono' }
                          ].map(fontOpt => (
                            <button
                              key={fontOpt.id}
                              type="button"
                              onClick={() => setContractDesign({ ...contractDesign, fontFamily: fontOpt.id as any })}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                contractDesign.fontFamily === fontOpt.id
                                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <span className={`text-xs font-bold text-slate-900 block ${fontOpt.previewClass}`}>
                                {fontOpt.label}
                              </span>
                              <span className="text-[10px] text-slate-500">{fontOpt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Accent Color Palette */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Color de Acento en Títulos:</label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            { color: '#b45309', label: 'Ámbar Oficial' },
                            { color: '#1e40af', label: 'Azul Marino' },
                            { color: '#0f172a', label: 'Pizarra Oscuro' },
                            { color: '#047857', label: 'Esmeralda' },
                            { color: '#6b21a8', label: 'Púrpura' }
                          ].map(c => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => setContractDesign({ ...contractDesign, primaryColor: c.color })}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                                contractDesign.primaryColor === c.color
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20" style={{ backgroundColor: c.color }} />
                              <span>{c.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* advisor signature role */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cargo Institucional del Asesor en la Firma:</label>
                        <input
                          type="text"
                          value={contractDesign.signerAdvisorRole}
                          onChange={(e) => setContractDesign({ ...contractDesign, signerAdvisorRole: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                          placeholder="Director de Producción / Asesor Comercial"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          En el contrato, el cargo se mostrará en una línea y el nombre completo en la línea siguiente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Panel 3: Cláusulas y Textos Legales */}
                  <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 lg:col-span-2">
                    <h5 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>3. Títulos, Cláusulas y Textos Legales del Contrato</span>
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Título Central del Contrato:</label>
                        <input
                          type="text"
                          value={contractDesign.contractTitle}
                          onChange={(e) => setContractDesign({ ...contractDesign, contractTitle: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Texto Introductorio del Contrato:</label>
                        <input
                          type="text"
                          value={contractDesign.contractIntroText}
                          onChange={(e) => setContractDesign({ ...contractDesign, contractIntroText: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Regla de Conservación de Material (Cláusula 4 - RAW & Master):</label>
                        <textarea
                          rows={2}
                          value={contractDesign.clause4PreservationText}
                          onChange={(e) => setContractDesign({ ...contractDesign, clause4PreservationText: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Pie de Página Oficial del Contrato:</label>
                        <input
                          type="text"
                          value={contractDesign.footerText}
                          onChange={(e) => setContractDesign({ ...contractDesign, footerText: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:border-amber-500 focus:outline-none"
                          placeholder="Documento emitido formalmente por el Sistema Integrado de Gestión Audiovisual de Corporación TCT: SIGAT • Perú"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Panel 4: Vista Previa en Vivo del Encabezado, Cláusula de Publicación y Pie */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border-2 border-slate-900 shadow-md lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Vista Previa en Vivo del Diseño de Contrato
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        Tipografía: {contractDesign.fontFamily.toUpperCase()}
                      </span>
                    </div>

                    {/* Simulation Card */}
                    <div className={`p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-slate-900 ${
                      contractDesign.fontFamily === 'serif' ? 'font-serif' :
                      contractDesign.fontFamily === 'mono' ? 'font-mono' :
                      contractDesign.fontFamily === 'geometric' ? 'font-sans tracking-tight' : 'font-sans'
                    }`}>
                      {/* Sim Header */}
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                        <div className="flex items-center space-x-2.5">
                          {contractDesign.logoType === 'custom' && contractDesign.customLogoUrl ? (
                            <img src={contractDesign.customLogoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-md" referrerPolicy="no-referrer" />
                          ) : (
                            <TCTLogo size="sm" variant="icon-only" />
                          )}
                          <div>
                            <h4 className="text-sm font-black uppercase text-slate-950">{contractDesign.headerTitle}</h4>
                            <p className="text-[9px] font-bold text-amber-700">{contractDesign.headerSubtitle}</p>
                            <p className="text-[8px] text-slate-500 font-mono">{contractDesign.headerLegalInfo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-slate-900 text-amber-400 font-mono text-[10px] font-black px-2 py-0.5 rounded-md">
                            CONTRATO-TCT-2026-001
                          </span>
                        </div>
                      </div>

                      {/* Sim Agreement */}
                      <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-[10px]">
                        <p className="font-bold text-slate-800">
                          ★ AUTORIZACIÓN DE DIFUSIÓN EN INTERNET: EL CLIENTE declara que <strong>ACEPTA</strong> de forma libre y voluntaria la publicación de extractos de video y fotos en las redes de <strong>{contractDesign.headerTitle}</strong>.
                        </p>
                      </div>

                      {/* Sim Signatures */}
                      <div className="grid grid-cols-2 gap-4 text-center pt-2 border-t border-slate-300 text-[9px]">
                        <div>
                          <div className="h-10 border-b border-dashed border-slate-400 w-32 mx-auto mb-1"></div>
                          <p className="font-bold uppercase text-slate-700">{contractDesign.signerAdvisorRole}</p>
                          <p className="font-black text-slate-900">Michael Romero</p>
                        </div>
                        <div>
                          <div className="h-10 border-b border-dashed border-slate-400 w-32 mx-auto mb-1"></div>
                          <p className="font-bold uppercase text-slate-700">El Contratante</p>
                          <p className="font-black text-slate-900">Juan Pérez Silva</p>
                        </div>
                      </div>

                      {/* Sim Footer */}
                      <div className="text-center text-[8px] text-slate-500 pt-1 border-t border-slate-200 font-mono">
                        {contractDesign.footerText}
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 0.1: ASIGNACIÓN DE PERSONAL & EQUIPOS POR CONTRATO */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'staff_assignment' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                
                {/* Project Selector Bar */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                      Asignación Operativa
                    </span>
                    <h4 className="font-black text-slate-900 text-base mt-1">
                      Personal Técnico & Equipos por Producción
                    </h4>
                    <p className="text-xs text-slate-500">
                      Asigna camarógrafos, fotógrafos, pilotos y equipos a cada contrato. Se sincroniza con el código QR y credenciales de acceso.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-700 shrink-0">Contrato / Producción:</label>
                    <select
                      value={selectedAssignProjectId}
                      onChange={(e) => setSelectedAssignProjectId(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-indigo-500 w-full sm:w-auto max-w-sm"
                    >
                      {projectsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.contractNumber || p.uniqueCode} • {p.title} ({p.clientName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedAssignProject ? (
                  <div className="space-y-6">
                    {/* Selected Project Summary Card */}
                    <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs">
                            {selectedAssignProject.contractNumber || selectedAssignProject.uniqueCode}
                          </span>
                          <h4 className="font-black text-sm text-white">
                            {selectedAssignProject.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Cliente: {selectedAssignProject.clientName} • Locación: {selectedAssignProject.eventLocation || 'No especificada'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                        <span>Personal Asignado: {selectedAssignProject.assignedStaff?.length || 0}</span>
                        <span>•</span>
                        <span>Equipos: {selectedAssignProject.assignedEquipment?.length || 0}</span>
                      </div>
                    </div>

                    {/* Section A: Assigned Staff List & Add Form */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>Personal Técnico Asignado ({selectedAssignProject.assignedStaff?.length || 0})</span>
                        </h5>
                      </div>

                      {/* Staff Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {(selectedAssignProject.assignedStaff || []).map((st) => (
                          <div key={st.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-xs">
                                👷
                              </div>
                              <div>
                                <h6 className="font-black text-xs text-slate-900">{st.name}</h6>
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-black text-[10px] border border-indigo-200 inline-block mt-0.5">
                                  {st.role}
                                </span>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{st.phone}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveStaffFromProject(st.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Retirar de esta producción"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {(!selectedAssignProject.assignedStaff || selectedAssignProject.assignedStaff.length === 0) && (
                          <div className="col-span-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>No hay personal técnico asignado a este contrato aún. Asigne el equipo técnico abajo.</span>
                          </div>
                        )}
                      </div>

                      {/* Add Staff Form */}
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-3">
                        <h6 className="font-black text-xs text-indigo-900 flex items-center gap-1.5">
                          <UserPlus className="w-4 h-4" />
                          <span>Asignar Miembro del Equipo a este Contrato</span>
                        </h6>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Seleccionar Usuario:</label>
                            <select
                              value={assignUserSelection}
                              onChange={(e) => setAssignUserSelection(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                            >
                              <option value="">-- Seleccionar de Usuarios --</option>
                              {usersList.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.fullName} ({u.jobTitle || u.role})
                                </option>
                              ))}
                              <option value="custom">-- Otro Personal (Manual) --</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Cargo en la Producción:</label>
                            <select
                              value={assignRoleSelection}
                              onChange={(e) => setAssignRoleSelection(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                            >
                              {JOB_TITLE_PRESETS.map((cargo) => (
                                <option key={cargo} value={cargo}>{cargo}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              onClick={handleAddStaffToProject}
                              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Asignar a Producción</span>
                            </button>
                          </div>
                        </div>

                        {assignUserSelection === 'custom' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                            <input
                              type="text"
                              placeholder="Nombre Completo del Técnico"
                              value={assignCustomName}
                              onChange={(e) => setAssignCustomName(e.target.value)}
                              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                            />
                            <input
                              type="text"
                              placeholder="Teléfono / WhatsApp"
                              value={assignCustomPhone}
                              onChange={(e) => setAssignCustomPhone(e.target.value)}
                              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section B: Equipment Checkout Checklist */}
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <h5 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-amber-600" />
                          <span>Equipos Audiovisuales Asignados ({selectedAssignProject.assignedEquipment?.length || 0})</span>
                        </h5>
                        <span className="text-xs text-slate-500 font-bold">
                          Marque los equipos del catálogo que saldrán a esta locación
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                        {rules.equipmentCatalog.map((eq) => {
                          const isAssigned = (selectedAssignProject.assignedEquipment || []).some(e => e.id === eq.id);
                          return (
                            <label
                              key={eq.id}
                              className={`p-3 rounded-2xl border flex items-center space-x-3 cursor-pointer transition-all ${
                                isAssigned 
                                  ? 'bg-amber-50/80 border-amber-400 text-slate-950 font-bold shadow-xs' 
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => handleToggleEquipmentForProject(eq)}
                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black truncate">{eq.name}</p>
                                <p className="text-[10px] text-slate-500">{eq.category} • S/N: {eq.serialNumber}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No hay proyectos disponibles.</p>
                )}

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: CHECKLISTS DE LOS 12 PASOS */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'checklists' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    Seleccionar Paso del Flujo Secuencial (1 al 12)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Edita las tareas estándar que todo técnico o supervisor debe verificar al completar este paso.
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
                  {rules.stepChecklists.map((rule) => (
                    <button
                      key={rule.stepNumber}
                      onClick={() => {
                        setSelectedStepNumber(rule.stepNumber);
                        setEditingChecklistIdx(null);
                      }}
                      className={`w-8 h-8 rounded-xl font-black text-xs transition-all flex items-center justify-center ${
                        selectedStepNumber === rule.stepNumber
                          ? 'bg-amber-500 text-slate-950 shadow-md scale-105 ring-2 ring-amber-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title={`Paso ${rule.stepNumber}: ${rule.stepName}`}
                    >
                      {rule.stepNumber}
                    </button>
                  ))}
                </div>
              </div>

              {currentStepChecklistRule && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-400 font-extrabold text-xs">
                        Paso {currentStepChecklistRule.stepNumber} • {currentStepChecklistRule.phaseName}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-1">
                        {currentStepChecklistRule.stepName}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                      {currentStepChecklistRule.defaultChecklist.length} Tareas Obligatorias
                    </span>
                  </div>

                  {/* Add item */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                      placeholder="Escribe una nueva regla o tarea obligatoria para este paso..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      onClick={handleAddChecklistItem}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Tarea</span>
                    </button>
                  </div>

                  {/* List of items */}
                  <div className="space-y-2">
                    {currentStepChecklistRule.defaultChecklist.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between transition-colors gap-3"
                      >
                        {editingChecklistIdx === idx ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingChecklistValue}
                              onChange={(e) => setEditingChecklistValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEditedChecklistItem(idx)}
                              className="flex-1 px-3 py-1 bg-white border border-amber-400 rounded-lg text-xs font-bold focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditedChecklistItem(idx)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingChecklistIdx(null)}
                              className="p-1.5 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{item}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingChecklistIdx(idx);
                              setEditingChecklistValue(item);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar texto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteChecklistItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar de la plantilla"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: INVENTARIO DE EQUIPOS AUDIOVISUALES */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'equipment' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header & Stats Banner */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300">
                      Activos Fijos TCT
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Control institucional de equipamiento y series
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-950 mt-1">
                    Inventario de Equipos Audiovisuales
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xl">
                    Administre los códigos únicos, números de serie, fotografías, características técnicas y estado operativo de todos los equipos.
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleExportInventoryPdf}
                    disabled={isExportingInventoryPdf}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-400 font-black text-xs rounded-2xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                    title="Exportar inventario oficial a formato PDF para control técnico"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingInventoryPdf ? 'Generando PDF...' : 'Exportar PDF'}</span>
                  </button>

                  <button
                    onClick={handleOpenAddEquipmentModal}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Dar de Alta Equipo</span>
                  </button>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total en Inventario</span>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-xl font-black text-slate-950">{rules.equipmentCatalog.length}</span>
                    <span className="text-xs text-slate-500">equipos</span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Operativos / Disponibles</span>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-xl font-black text-emerald-950">
                      {rules.equipmentCatalog.filter(e => e.condition === 'Operativo' || e.condition === 'Nuevo' || !e.condition).length}
                    </span>
                    <span className="text-xs text-emerald-700">activos</span>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">En Mantenimiento</span>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-xl font-black text-amber-950">
                      {rules.equipmentCatalog.filter(e => e.condition === 'En Mantenimiento').length}
                    </span>
                    <span className="text-xs text-amber-700">revisión</span>
                  </div>
                </div>

                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">De Baja / Obsoleto</span>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-xl font-black text-rose-950">
                      {rules.equipmentCatalog.filter(e => e.condition === 'De Baja').length}
                    </span>
                    <span className="text-xs text-rose-700">retirados</span>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 flex-1">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por código, nombre, número de serie o características..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
                  <div className="flex items-center space-x-1 shrink-0">
                    <label className="text-[10px] font-black uppercase text-slate-400 mr-1">Estado:</label>
                    <select
                      value={inventoryConditionFilter}
                      onChange={(e) => setInventoryConditionFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Todos los Estados</option>
                      <option value="Operativo">Operativo</option>
                      <option value="Nuevo">Nuevo</option>
                      <option value="En Mantenimiento">En Mantenimiento</option>
                      <option value="De Baja">De Baja</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {['all', 'Cámara', 'Lente', 'Dron', 'Audio', 'Iluminación', 'Estabilizador'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setEquipmentFilterCat(cat)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                          equipmentFilterCat === cat
                            ? 'bg-slate-900 text-amber-400 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat === 'all' ? 'Todos' : cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Equipment Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredEquipment.map((eq) => (
                  <div
                    key={eq.id}
                    className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2.5">
                      {/* Top Bar with Thumbnail, Code and Condition Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 min-w-0">
                          {eq.imageUrl ? (
                            <img
                              src={eq.imageUrl}
                              alt={eq.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-black text-xs shrink-0">
                              <Camera className="w-5 h-5 text-amber-600" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-amber-300 font-mono">
                                {eq.code || 'S/C'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                                {eq.category}
                              </span>
                            </div>
                            <h5 className="text-xs font-black text-slate-950 mt-1 leading-snug line-clamp-2">
                              {eq.name}
                            </h5>
                          </div>
                        </div>

                        {/* Condition Badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black shrink-0 ${
                          eq.condition === 'Operativo' || eq.condition === 'Nuevo' || !eq.condition
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : eq.condition === 'En Mantenimiento'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {eq.condition || 'Operativo'}
                        </span>
                      </div>

                      {/* Technical Specs & Details */}
                      <div className="space-y-1 pt-1 border-t border-slate-100 text-[11px]">
                        {eq.serialNumber && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400 font-medium">N° Serie:</span>
                            <span className="font-mono font-bold text-slate-900">{eq.serialNumber}</span>
                          </div>
                        )}

                        {eq.features && (
                          <p className="text-[10px] text-slate-500 line-clamp-2 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {eq.features}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Registrado: {eq.registrationDate || '2025-01-15'}</span>
                          {eq.checkedOut ? (
                            <span className="font-bold text-amber-600">En Producción</span>
                          ) : (
                            <span className="font-bold text-emerald-600">Disponible</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEditEquipmentModal(eq)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                        title="Editar datos del equipo"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteEquipment(eq.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar equipo del inventario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredEquipment.length === 0 && (
                  <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-dashed border-slate-300 space-y-3">
                    <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                    <h5 className="font-black text-slate-800 text-sm">No se encontraron equipos</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No hay equipos registrados que coincidan con la búsqueda o filtros aplicados.
                    </p>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* HIDDEN PRINTABLE CONTAINER FOR PDF EXPORT                 */}
              {/* ========================================================= */}
              <div className="hidden">
                <div
                  id="tct-inventory-printable-document"
                  className="bg-white p-8 text-slate-900 font-sans"
                  style={{ width: '850px', minHeight: '1100px' }}
                >
                  {/* Corporate Header */}
                  <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xl">
                        TCT
                      </div>
                      <div>
                        <h2 className="text-base font-black uppercase tracking-wider text-slate-950">
                          {companyInfo.legalName || 'CORPORACIÓN TCT S.A.C.'}
                        </h2>
                        <p className="text-[10px] text-slate-600 font-bold">
                          RUC: {companyInfo.ruc} • {companyInfo.address} • Tel: {companyInfo.phone}
                        </p>
                        <p className="text-[9px] text-amber-700 font-mono">
                          DOCUMENTO TÉCNICO OFICIAL DE CONTROL DE ACTIVOS AUDIOVISUALES
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-600 font-mono">
                      <p className="font-black text-slate-950">INFORME DE INVENTARIO</p>
                      <p>Fecha: {new Date().toLocaleDateString('es-PE')}</p>
                      <p>Total Items: {rules.equipmentCatalog.length}</p>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="bg-slate-100 p-3 rounded-xl mb-4 flex justify-between text-xs font-bold border border-slate-300">
                    <span>Equipos Operativos: {rules.equipmentCatalog.filter(e => e.condition === 'Operativo' || e.condition === 'Nuevo' || !e.condition).length}</span>
                    <span>En Mantenimiento: {rules.equipmentCatalog.filter(e => e.condition === 'En Mantenimiento').length}</span>
                    <span>De Baja: {rules.equipmentCatalog.filter(e => e.condition === 'De Baja').length}</span>
                  </div>

                  {/* Equipment Table */}
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-black">
                        <th className="p-2 border border-slate-800">CÓDIGO</th>
                        <th className="p-2 border border-slate-800">NOMBRE DEL EQUIPO</th>
                        <th className="p-2 border border-slate-800">CATEGORÍA</th>
                        <th className="p-2 border border-slate-800">N° SERIE</th>
                        <th className="p-2 border border-slate-800">CARACTERÍSTICAS TÉCNICAS</th>
                        <th className="p-2 border border-slate-800">REGISTRO</th>
                        <th className="p-2 border border-slate-800">ESTADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.equipmentCatalog.map((eq, i) => (
                        <tr key={eq.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-2 border border-slate-300 font-mono font-black text-slate-950">
                            {eq.code || `EQ-${i + 1}`}
                          </td>
                          <td className="p-2 border border-slate-300 font-bold text-slate-900">
                            {eq.name}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-700">
                            {eq.category}
                          </td>
                          <td className="p-2 border border-slate-300 font-mono text-slate-600">
                            {eq.serialNumber || '---'}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-600">
                            {eq.features || 'Estándar institucional'}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-600">
                            {eq.registrationDate || '2025-01-15'}
                          </td>
                          <td className="p-2 border border-slate-300 font-bold">
                            <span className={
                              eq.condition === 'Operativo' || eq.condition === 'Nuevo' || !eq.condition
                                ? 'text-emerald-700'
                                : eq.condition === 'En Mantenimiento'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }>
                              {eq.condition || 'Operativo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Signatures & Seal */}
                  <div className="mt-12 pt-8 border-t border-slate-300 flex justify-between text-center text-xs">
                    <div className="w-56 border-t border-slate-700 pt-2">
                      <p className="font-black text-slate-900">ING. MICHAEL ROMEROREYES</p>
                      <p className="text-[10px] text-slate-500">Director General • Corporación TCT</p>
                    </div>
                    <div className="w-56 border-t border-slate-700 pt-2">
                      <p className="font-black text-slate-900">RESPONSABLE DE LOGÍSTICA</p>
                      <p className="text-[10px] text-slate-500">Control de Activos & Equipamiento</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL PARA AGREGAR / EDITAR EQUIPO (EVITAR DUPLICADOS)   */}
          {/* ========================================================= */}
          {isEquipmentModalOpen && (
            <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-300 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                      <Camera className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-950">
                        {editingEquipment ? 'Editar Datos del Equipo Audiovisual' : 'Dar de Alta Nuevo Equipo'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Los códigos y números de serie deben ser únicos para evitar duplicados.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEquipmentModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {formEqError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formEqError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Photo Upload & Preview */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center space-x-4">
                    {formEqImageUrl ? (
                      <div className="relative">
                        <img
                          src={formEqImageUrl}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-300 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setFormEqImageUrl('')}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shadow-xs hover:bg-red-700 cursor-pointer"
                          title="Eliminar foto"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-black text-slate-900 block mb-1">
                        Fotografía del Equipo (Opcional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEquipmentImageUpload}
                        className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Code & Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Código Único <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formEqCode}
                        onChange={(e) => setFormEqCode(e.target.value)}
                        placeholder="Ej: CAM-001"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Nombre del Equipo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formEqName}
                        onChange={(e) => setFormEqName(e.target.value)}
                        placeholder="Ej: Sony FX3 Cinema Line 4K #2"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Category, Serial & Condition */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Categoría</label>
                      <select
                        value={formEqCategory}
                        onChange={(e) => setFormEqCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Cámara">Cámara</option>
                        <option value="Lente">Lente</option>
                        <option value="Dron">Dron</option>
                        <option value="Audio">Audio / Micrófono</option>
                        <option value="Iluminación">Iluminación</option>
                        <option value="Estabilizador">Estabilizador / Gimbal</option>
                        <option value="Soporte">Soporte / Trípode</option>
                        <option value="Almacenamiento">Almacenamiento / SD Card</option>
                        <option value="Batería">Batería & Energía</option>
                        <option value="Accesorio">Accesorio General</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Número de Serie (S/N)
                      </label>
                      <input
                        type="text"
                        value={formEqSerial}
                        onChange={(e) => setFormEqSerial(e.target.value)}
                        placeholder="Ej: SN-998210-TCT"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Estado Operativo</label>
                      <select
                        value={formEqCondition}
                        onChange={(e) => setFormEqCondition(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Operativo">Operativo</option>
                        <option value="Nuevo">Nuevo</option>
                        <option value="En Mantenimiento">En Mantenimiento</option>
                        <option value="De Baja">De Baja</option>
                      </select>
                    </div>
                  </div>

                  {/* Features & Specs */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Características Técnicas / Observaciones
                    </label>
                    <textarea
                      rows={2}
                      value={formEqFeatures}
                      onChange={(e) => setFormEqFeatures(e.target.value)}
                      placeholder="Ej: Sensor Full-Frame 12.1 MP, 4K 120p, S-Cinetone, 10-bit 4:2:2, montura E."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Registration Date */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Fecha de Registro en Inventario
                    </label>
                    <input
                      type="date"
                      value={formEqDate}
                      onChange={(e) => setFormEqDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsEquipmentModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveEquipmentForm}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingEquipment ? 'Guardar Cambios' : 'Registrar Equipo'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PROFORMAS & PAQUETES */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'packages' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sidebar list of packages */}
              <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Paquetes Disponibles ({rules.packages.length})
                  </h4>
                  <button
                    onClick={handleCreateNewPackage}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {rules.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setEditingPackage(pkg)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                        editingPackage?.id === pkg.id
                          ? 'bg-amber-500/10 border-amber-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{pkg.name}</span>
                        <span className="text-xs font-black text-amber-600">S/. {pkg.basePrice ?? pkg.price}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                        <span>{pkg.eventType}</span>
                        <span>{pkg.includedServices.length} servicios</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package editor */}
              {editingPackage && (
                <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900">
                      Editar: {editingPackage.name}
                    </h3>
                    <button
                      onClick={() => handleDeletePackage(editingPackage.id)}
                      className="px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Paquete</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Nombre del Paquete</label>
                      <input
                        type="text"
                        value={editingPackage.name}
                        onChange={(e) => handleUpdateEditingPackage('name', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Precio Oficial (S/.)</label>
                      <input
                        type="number"
                        value={editingPackage.basePrice ?? editingPackage.price ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdateEditingPackage('basePrice', val);
                          handleUpdateEditingPackage('price', val);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Tipo de Evento Principal</label>
                      <select
                        value={editingPackage.eventType}
                        onChange={(e) => handleUpdateEditingPackage('eventType', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Boda">Boda</option>
                        <option value="XV Años">XV Años</option>
                        <option value="Evento Corporativo">Evento Corporativo</option>
                        <option value="Graduación">Graduación</option>
                        <option value="Concierto / Festival">Concierto / Festival</option>
                        <option value="Bautizo / Primera Comunión">Bautizo / Primera Comunión</option>
                        <option value="Spot Publicitario">Spot Publicitario</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Descripción Rápida</label>
                      <input
                        type="text"
                        value={editingPackage.description}
                        onChange={(e) => handleUpdateEditingPackage('description', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Proforma Attachment (Image or PDF) */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Archivo o Imagen Adjunta de la Proforma (Imagen / PDF)</span>
                        </label>
                        <p className="text-[10px] text-slate-500">
                          Sube un diagrama, fotografía o PDF ilustrativo para que los asesores y clientes comprendan esta proforma.
                        </p>
                      </div>

                      {editingPackage.attachmentUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateEditingPackage('attachmentUrl', undefined);
                            handleUpdateEditingPackage('attachmentType', undefined);
                            handleUpdateEditingPackage('attachmentName', undefined);
                          }}
                          className="text-red-600 hover:text-red-800 text-[10px] font-bold flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Quitar Archivo</span>
                        </button>
                      )}
                    </div>

                    {editingPackage.attachmentUrl ? (
                      <div className="p-3 bg-white rounded-xl border border-indigo-200 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                            {editingPackage.attachmentType === 'pdf' ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <Camera className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                              {editingPackage.attachmentName || 'Proforma_Adjunta'}
                            </p>
                            <span className="text-[10px] text-indigo-600 font-medium uppercase">
                              {editingPackage.attachmentType === 'pdf' ? 'Documento PDF' : 'Imagen Adjunta'}
                            </span>
                          </div>
                        </div>

                        <a
                          href={editingPackage.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                        <label className="flex flex-col items-center cursor-pointer">
                          <Upload className="w-6 h-6 text-indigo-500 mb-1" />
                          <span className="text-xs font-bold text-slate-700">Subir Imagen o PDF de la Proforma</span>
                          <span className="text-[10px] text-slate-400">PNG, JPG, WEBP o PDF (Hasta 5MB)</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  handleUpdateEditingPackage('attachmentUrl', result);
                                  handleUpdateEditingPackage('attachmentType', isPdf ? 'pdf' : 'image');
                                  handleUpdateEditingPackage('attachmentName', file.name);
                                  notifySuccess(`✓ Archivo adjuntado a la proforma: ${file.name}`);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Included services */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[11px] font-black text-slate-700 block">
                      Servicios Incluidos en la Proforma
                    </label>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newServiceInput}
                        onChange={(e) => setNewServiceInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddServiceToEditingPackage()}
                        placeholder="Ej: Cobertura de Drone 4K (2 vuelos)"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        onClick={handleAddServiceToEditingPackage}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black rounded-xl shrink-0"
                      >
                        + Incluir
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {editingPackage.includedServices.map((srv, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800">{srv}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteServiceFromEditingPackage(idx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: TARIFAS & PARÁMETROS */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial rules */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Parámetros Financieros & Comerciales</span>
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tarifa Estándar por Hora Extra (S/.)
                    </label>
                    <input
                      type="number"
                      value={standardExtraHourRate}
                      onChange={(e) => setStandardExtraHourRate(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Se aplica automáticamente en contratos y reportes al añadir horas extras.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Porcentaje Máximo de Descuento Permitido (%)
                    </label>
                    <input
                      type="number"
                      value={maxDiscountPercentage}
                      onChange={(e) => setMaxDiscountPercentage(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Alerta al supervisor si una cotización supera este margen comercial.
                    </p>
                  </div>
                </div>
              </div>

              {/* Informative notice regarding Commercial Advisors */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Asesores Comerciales & Representantes</span>
                </h4>

                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-emerald-900">
                    ✓ Gestión Automática por Usuarios
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Los asesores comerciales son automáticamente los <strong>usuarios registrados en el sistema</strong>. Al registrar una cotización o producción, el nombre del empleado activo se asigna inmediatamente como asesor comercial responsable.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Ir a pestaña de Usuarios & Roles</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: FORMATOS & ACTAS OFICIALES */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'formats' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rules.templateFormats.map((fmt) => (
                  <div key={fmt.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        {fmt.category}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mt-1">
                        {fmt.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {fmt.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">
                        v{fmt.version}
                      </span>
                      <button
                        onClick={() => handleDownloadFormat(fmt)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Formato</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: ADMINISTRAR USUARIOS (MOVIDO A REGLAS) */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'users' && (
            <div className="space-y-6">
              {/* Users Header & Actions */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Control y Credenciales de Usuarios TCT</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Crear nuevos administradores y técnicos, restablecer contraseñas y asignar cargos oficiales.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleResetUsersDefaults}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    title="Restaurar cuentas por defecto"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Restaurar Cuentas Base</span>
                  </button>

                  <button
                    onClick={handleOpenCreateUser}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Crear Nuevo Usuario</span>
                  </button>
                </div>
              </div>

              {/* Filter and search bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-2 flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Buscar por usuario, nombre, cargo o email..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-1.5 text-xs">
                  <button
                    onClick={() => setUserRoleFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      userRoleFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    Todos ({usersList.length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('admin')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      userRoleFilter === 'admin'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    Admins ({usersList.filter(u => u.role === 'admin').length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('employee')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      userRoleFilter === 'employee'
                        ? 'bg-blue-600 text-white font-black'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    Técnicos ({usersList.filter(u => u.role === 'employee').length})
                  </button>
                </div>
              </div>

              {/* Users Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md ${
                          u.role === 'admin'
                            ? 'bg-gradient-to-tr from-amber-600 to-amber-400'
                            : 'bg-gradient-to-tr from-blue-600 to-blue-400'
                        }`}>
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-black text-slate-900 text-sm">{u.fullName}</h5>
                            {u.username.toUpperCase() === 'TCT' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-black">
                                ROOT
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-mono">@{u.username}</span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}>
                        {u.role === 'admin' ? '🛡️ Administrador' : '🎬 Panel Técnico'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Cargo:</span>
                        <span className="font-bold text-slate-800">{u.jobTitle || 'No asignado'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Contraseña:</span>
                        <span className="font-mono font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                          {u.password}
                        </span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Teléfono:</span>
                          <span className="font-medium text-slate-700">{u.phone}</span>
                        </div>
                      )}
                      {u.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[180px]">{u.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`text-[11px] font-bold flex items-center gap-1 ${
                          u.isActive ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span>{u.isActive ? 'Cuenta Activa' : 'Cuenta Inactiva'}</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Editar usuario"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {u.username.toUpperCase() !== 'TCT' && (
                          <button
                            onClick={() => handleDeleteUserItem(u)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sub-modal Create / Edit User */}
              {isUserFormOpen && (
                <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-blue-600" />
                        <span>{editingUserId ? 'Editar Cuenta de Usuario' : 'Crear Nuevo Usuario TCT'}</span>
                      </h4>
                      <button
                        onClick={() => setIsUserFormOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {userFormError && (
                      <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{userFormError}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveUserForm} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={formFullName}
                          onChange={(e) => setFormFullName(e.target.value)}
                          placeholder="Ej: Marco Antonio Solís"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Usuario / Login *</label>
                          <input
                            type="text"
                            required
                            value={formUsername}
                            onChange={(e) => setFormUsername(e.target.value)}
                            placeholder="Ej: marco.solis"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Contraseña *</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={formPassword}
                              onChange={(e) => setFormPassword(e.target.value)}
                              placeholder="Clave de acceso"
                              className="w-full px-3 py-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Rol / Permisos *</label>
                          <select
                            value={formRole}
                            onChange={(e) => setFormRole(e.target.value as UserRole)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="employee">Panel Técnico (Staff)</option>
                            <option value="admin">Administrador General</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Cargo Oficial</label>
                          <select
                            value={formJobTitle}
                            onChange={(e) => setFormJobTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            {JOB_TITLE_PRESETS.map((preset) => (
                              <option key={preset} value={preset}>{preset}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Teléfono (WhatsApp)</label>
                          <input
                            type="text"
                            value={formPhone}
                            onChange={(e) => setFormPhone(e.target.value)}
                            placeholder="Ej: +51 987 654 321"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Correo Electrónico</label>
                          <input
                            type="email"
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                            placeholder="correo@tct.pe"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsUserFormOpen(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md"
                        >
                          {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: GESTOR DE ATAJOS DE TECLADO PERSONALIZADOS */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'shortcuts' && (
            <div className="space-y-6">
              
              {/* Header card for shortcuts */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Keyboard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black">
                          Gestor de Atajos de Teclado Globales (Shortcuts)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                          {shortcutsList.filter(s => s.enabled).length} Activos
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Presiona combinaciones de teclas desde cualquier pantalla para acceder velozmente a funciones del sistema.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetShortcuts}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restablecer Fábrica</span>
                    </button>
                  </div>
                </div>

                {/* Quick Add / Edit Custom Shortcut Banner */}
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                  <h5 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Personalizar o Asignar Nuevo Atajo</span>
                  </h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-6 space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Seleccionar Función del Sistema:</label>
                      <select
                        value={selectedShortcutAction}
                        onChange={(e) => setSelectedShortcutAction(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                      >
                        {SHORTCUT_ACTIONS.map(action => (
                          <option key={action.actionId} value={action.actionId}>
                            {action.name} ({action.category.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Combinación de Teclas:</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customShortcutKeys}
                          onChange={(e) => setCustomShortcutKeys(e.target.value)}
                          placeholder="Ej: ctrl+n, alt+c, ctrl+shift+p"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 uppercase focus:outline-none focus:border-amber-400"
                        />
                        <Command className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddCustomShortcut}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shortcuts Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h5 className="font-black text-slate-900 text-sm">
                      Lista de Atajos Configurados
                    </h5>
                    <p className="text-xs text-slate-500">
                      Marca para activar o desactiva cualquier atajo. Puedes editar directamente las teclas en la casilla.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {shortcutsList.length} funciones mapeadas
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {shortcutsList.map((sc) => (
                    <div key={sc.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={sc.enabled}
                          onChange={() => handleToggleShortcut(sc.id)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-black ${sc.enabled ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                              {sc.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                              {sc.category}
                            </span>
                            {sc.isCustom && (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold">
                                Personalizado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {sc.description}
                          </p>
                        </div>
                      </div>

                      {/* Keys input pill */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <input
                          type="text"
                          value={sc.keys}
                          onChange={(e) => handleUpdateShortcutKeys(sc.id, e.target.value)}
                          className={`w-32 px-2.5 py-1 text-center font-mono text-xs font-black rounded-lg border focus:outline-none transition-all uppercase ${
                            sc.enabled
                              ? 'bg-slate-900 text-amber-300 border-slate-700 focus:border-amber-400'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleToggleShortcut(sc.id)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            sc.enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                          }`}
                          title={sc.enabled ? 'Atajo activado' : 'Atajo desactivado'}
                        >
                          {sc.enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: SISTEMA, DEMO & AUTOGUARDADO LOCAL */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'system' && (
            <div className="space-y-6">
              
              {/* Storage & Autosave Status Card */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black">
                          Motor de Auto-Guardado Local & Sincronización
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Activo & Persistente
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Doble capa de almacenamiento: IndexedDB (fotos/archivos HD) + LocalStorage (respaldo rápido).
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Último Guardado Automático:</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {getLastSyncTime() || 'Tiempo real (Automático)'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                      Base de Datos
                    </span>
                    <span className="text-sm font-black text-white mt-1 block">
                      IndexedDB (tct_production_db_v2)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold mt-0.5 block">
                      ✓ Soporte ilimitado de adjuntos
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                      Respaldo Ligero
                    </span>
                    <span className="text-sm font-black text-white mt-1 block">
                      LocalStorage (Compacted)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold mt-0.5 block">
                      ✓ Protección contra cuotas
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                      Disponibilidad
                    </span>
                    <span className="text-sm font-black text-white mt-1 block">
                      Offline-First & Local
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold mt-0.5 block">
                      ✓ Funciona sin internet
                    </span>
                  </div>
                </div>
              </div>

              {/* Maintenance Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Reset Demo Data Card */}
                <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 text-sm">
                        Restablecer Proyectos Demo Oficiales
                      </h5>
                      <p className="text-xs text-slate-500">
                        Restaura los 5 proyectos de demostración oficiales con sus 12 pasos completados.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                    Esta acción regenera la base de datos con los datos de muestra de Corporación TCT (Matrimonio Rivera, XV Años Sofía, etc.).
                  </p>

                  <button
                    onClick={handleTriggerResetDemo}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restablecer Proyectos Demo Ahora</span>
                  </button>
                </div>

                {/* Reset Rules to Default Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 text-sm">
                        Restablecer Reglas a Valores de Fábrica
                      </h5>
                      <p className="text-xs text-slate-500">
                        Vuelve a cargar los checklists, catálogo de equipos y paquetes por defecto de TCT.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    Reemplaza las reglas actuales con la configuración original del manual de operaciones.
                  </p>

                  <button
                    onClick={handleResetToDefaults}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Restablecer Reglas por Defecto</span>
                  </button>
                </div>

                {/* Backup Export Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 text-sm">
                        Exportar Copia de Seguridad Total (JSON)
                      </h5>
                      <p className="text-xs text-slate-500">
                        Descarga un archivo seguro con todos tus proyectos, reglas y usuarios actuales.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleExportFullBackup}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Backup JSON Completo</span>
                  </button>
                </div>

                {/* Backup Import Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 text-sm">
                        Restaurar Copia de Seguridad (JSON)
                      </h5>
                      <p className="text-xs text-slate-500">
                        Carga un archivo de respaldo JSON generado previamente en el sistema.
                      </p>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportBackupFile}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir e Importar Respaldo JSON</span>
                  </button>
                </div>

              </div>

              {/* DANGER & SELECTIVE PURGE ZONE */}
              <div className="border-t-2 border-red-200 pt-6 space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                  <h4 className="text-sm font-black text-red-950 uppercase tracking-wider">
                    Herramientas de Limpieza de Registros & Borrado de Base de Datos
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Option 1: Eliminar Expediente Individual (Exclusivo en Ventana de Reglas) */}
                  <div className="bg-white p-4 rounded-3xl border-2 border-red-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-red-600">
                        <Trash2 className="w-4 h-4" />
                        <h5 className="font-black text-slate-900 text-xs sm:text-sm">
                          Eliminar Expediente Individual
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        Selecciona un expediente específico para eliminarlo de la base de datos con su contrato y 12 pasos:
                      </p>

                      <div className="pt-1">
                        <label className="text-[9.5px] font-black text-slate-500 uppercase block mb-1">
                          Seleccionar Expediente:
                        </label>
                        <select
                          value={selectedProjectIdToDelete}
                          onChange={(e) => setSelectedProjectIdToDelete(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        >
                          <option value="">-- Elegir Expediente / Contrato --</option>
                          {projectsList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.contractNumber || p.uniqueCode || 'S/N'} • {p.clientName} ({p.eventType})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDeleteSingleSelectedProject}
                      disabled={!selectedProjectIdToDelete}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Expediente</span>
                    </button>
                  </div>

                  {/* Option 2: Borrar Historial de Todos los Contratos */}
                  <div className="bg-red-50/50 p-4 rounded-3xl border border-red-200 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-red-700">
                        <Trash2 className="w-4 h-4" />
                        <h5 className="font-black text-slate-900 text-xs sm:text-sm">
                          Vaciar Todos los Contratos
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        Elimina el historial completo de contratos y eventos. Las cuentas de usuario y reglas no se alteran.
                      </p>
                    </div>

                    <button
                      onClick={handleDeleteAllContractsHistory}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vaciar Todos los Contratos</span>
                    </button>
                  </div>

                  {/* Option 3: Borrado Selectivo con Filtros */}
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-300 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-amber-700">
                        <Sliders className="w-4 h-4" />
                        <h5 className="font-black text-slate-900 text-xs sm:text-sm">
                          Borrado Selectivo
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Elimina elementos filtrados por criterio:
                      </p>

                      <div className="space-y-1.5 pt-0.5">
                        <select
                          value={deleteFilterDataType}
                          onChange={(e: any) => setDeleteFilterDataType(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1 text-xs font-bold text-slate-800"
                        >
                          <option value="contracts">Solo Contratos Firmados</option>
                          <option value="quotations">Solo Cotizaciones</option>
                          <option value="employees">Solo Cuentas de Empleados</option>
                          <option value="by_event_type">Por Tipo de Evento</option>
                          <option value="archived_only">Solo Archivados / 12 Pasos</option>
                        </select>

                        {deleteFilterDataType === 'by_event_type' && (
                          <select
                            value={deleteFilterEventType}
                            onChange={(e) => setDeleteFilterEventType(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1 text-xs font-bold text-slate-800"
                          >
                            <option value="all">Seleccionar Tipo...</option>
                            <option value="Boda">Bodas</option>
                            <option value="XV Años">XV Años</option>
                            <option value="Evento Corporativo">Corporativos</option>
                            <option value="Graduación">Graduaciones</option>
                            <option value="Concierto / Festival">Conciertos</option>
                          </select>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleExecuteSelectiveDeletion}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ejecutar Borrado</span>
                    </button>
                  </div>

                  {/* Option 4: Borrar TODOS los Datos (Factory Reset Total) */}
                  <div className="bg-gradient-to-br from-red-950 to-slate-950 text-white p-4 rounded-3xl border border-red-900 space-y-3 flex flex-col justify-between shadow-lg">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <h5 className="font-black text-white text-xs sm:text-sm">
                          Factory Reset Total
                        </h5>
                      </div>
                      <p className="text-[11px] text-red-200/80 leading-tight">
                        Purga total: perfiles, contratos, cotizaciones, cargos, reglas y adjuntos.
                      </p>
                    </div>

                    <button
                      onClick={handleFactoryResetAllData}
                      className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-white" />
                      <span>Reinicio de Fábrica</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
 
          {/* ========================================================= */}
          {/* TAB 12: MONITOR DE USUARIOS EN VIVO Y CONTROL DE SESIONES  */}
          {/* ========================================================= */}
          {!showButtonsMenu && activeTab === 'live_sessions' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Header Card with Real-Time Pulse & Stats */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 relative">
                      <Activity className="w-6 h-6 animate-pulse" />
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black">
                          Monitor de Usuarios Conectados en Tiempo Real
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          EN VIVO
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Supervisa quién está usando el aplicativo en este instante. Expulsa sesiones sospechosas o bloquea accesos no autorizados.
                      </p>
                    </div>
                  </div>

                  {/* Refresh and Metrics */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLiveSessionsList(getStoredLiveSessions());
                        notifySuccess('✓ Lista de sesiones activas actualizada');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Refrescar sesiones activas"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Refrescar</span>
                    </button>
                  </div>
                </div>

                {/* Live Stats Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">🟢 Conectados Online</span>
                    <span className="text-xl font-black text-emerald-400">
                      {liveSessionsList.filter(s => s.status === 'online').length}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">🟡 En Espera (Idle)</span>
                    <span className="text-xl font-black text-amber-400">
                      {liveSessionsList.filter(s => s.status === 'idle').length}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">👥 Total Registrados</span>
                    <span className="text-xl font-black text-blue-400">
                      {usersList.length}
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">🚫 Cuentas Bloqueadas</span>
                    <span className="text-xl font-black text-red-400">
                      {usersList.filter(u => !u.isActive).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
                  {(['all', 'online', 'idle', 'blocked'] as const).map((filterKey) => {
                    const labels: Record<string, string> = {
                      all: 'Todos los Accesos',
                      online: '🟢 En Vivo (Online)',
                      idle: '🟡 En Espera',
                      blocked: '🚫 Bloqueados'
                    };
                    const isActive = liveSessionsFilter === filterKey;
                    return (
                      <button
                        key={filterKey}
                        onClick={() => setLiveSessionsFilter(filterKey)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isActive 
                            ? 'bg-slate-900 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {labels[filterKey]}
                      </button>
                    );
                  })}
                </div>

                {/* Search box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={liveSessionsSearch}
                    onChange={(e) => setLiveSessionsSearch(e.target.value)}
                    placeholder="Buscar usuario o dispositivo..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Connected Users List */}
              <div className="space-y-3">
                {liveSessionsList
                  .filter((session) => {
                    if (liveSessionsFilter === 'online' && session.status !== 'online') return false;
                    if (liveSessionsFilter === 'idle' && session.status !== 'idle') return false;
                    if (liveSessionsFilter === 'blocked' && !session.isBlocked) return false;
                    if (liveSessionsSearch) {
                      const q = liveSessionsSearch.toLowerCase();
                      const matchName = (session.fullName || '').toLowerCase().includes(q);
                      const matchUser = (session.username || '').toLowerCase().includes(q);
                      const matchDev = (session.device || '').toLowerCase().includes(q);
                      const matchJob = (session.jobTitle || '').toLowerCase().includes(q);
                      return matchName || matchUser || matchDev || matchJob;
                    }
                    return true;
                  })
                  .map((session) => {
                    const isCurrentUser = currentUser?.id === session.userId;
                    const isOnline = session.status === 'online';
                    const isBlocked = session.isBlocked;
                    const secondsAgo = Math.round((Date.now() - (session.lastHeartbeat || 0)) / 1000);

                    return (
                      <div
                        key={session.sessionId}
                        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                          isBlocked
                            ? 'bg-red-50/70 border-red-200'
                            : isOnline
                            ? 'bg-white border-emerald-200 shadow-xs hover:border-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          
                          {/* Left user identity */}
                          <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                              session.role === 'admin'
                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                : 'bg-blue-600 text-white shadow-xs'
                            }`}>
                              {session.fullName ? session.fullName.charAt(0).toUpperCase() : 'U'}
                            </div>

                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-black text-slate-900 text-sm truncate">
                                  {session.fullName}
                                </h5>
                                <span className="font-mono text-xs text-slate-500 font-bold">
                                  @{session.username}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  session.role === 'admin'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                                }`}>
                                  {session.role === 'admin' ? 'Administrador' : 'Panel Técnico'}
                                </span>
                                {isCurrentUser && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                                    ★ Esta Sesión (Tú)
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1 font-semibold">
                                  <Briefcase className="w-3 h-3 text-slate-400" />
                                  {session.jobTitle}
                                </span>
                                <span className="flex items-center gap-1">
                                  {session.device?.includes('Móvil') || session.device?.includes('Android') || session.device?.includes('iOS') ? (
                                    <Smartphone className="w-3 h-3 text-slate-400" />
                                  ) : (
                                    <Laptop className="w-3 h-3 text-slate-400" />
                                  )}
                                  {session.device} ({session.browser})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Center Connection Status */}
                          <div className="flex items-center space-x-3 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100 shrink-0">
                            {isBlocked ? (
                              <div className="flex items-center space-x-1.5 text-red-600 font-black text-xs">
                                <Ban className="w-4 h-4" />
                                <span>CUENTA BLOQUEADA</span>
                              </div>
                            ) : isOnline ? (
                              <div className="flex items-center space-x-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                                <div>
                                  <span className="font-black text-emerald-700 text-xs block">ACTIVO AHORA</span>
                                  <span className="text-[10px] text-slate-400">Latido: hace {secondsAgo < 5 ? '1 seg' : `${secondsAgo}s`}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <div>
                                  <span className="font-black text-amber-800 text-xs block">EN ESPERA</span>
                                  <span className="text-[10px] text-slate-400">Inactivo hace {Math.round(secondsAgo / 60)} min</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Action Buttons */}
                          <div className="flex items-center space-x-2 shrink-0 flex-wrap">
                            {!isCurrentUser && (
                              <>
                                {/* Expel Active Session */}
                                <button
                                  type="button"
                                  onClick={() => handleExpelSession(session)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                                  title="Cerrar la sesión de este usuario en tiempo real"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Expulsar</span>
                                </button>

                                {/* Block or Unblock User */}
                                {isBlocked ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUnblockSessionUser(session.userId, session.fullName)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                                    title="Desbloquear cuenta para que pueda volver a iniciar sesión"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Desbloquear</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleBlockAndExpelUser(session)}
                                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-black text-xs rounded-xl border border-red-300 flex items-center gap-1 transition-all cursor-pointer"
                                    title="Bloquear cuenta y expulsar permanentemente"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>Bloquear</span>
                                  </button>
                                )}

                                {/* Delete Account */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUserAccount(session.userId, session.username, session.fullName)}
                                  className="p-1.5 bg-slate-100 hover:bg-red-600 hover:text-white text-slate-400 rounded-xl transition-colors cursor-pointer"
                                  title="Eliminar usuario definitivamente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}

                {liveSessionsList.length === 0 && (
                  <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-300 space-y-3">
                    <Activity className="w-10 h-10 text-slate-300 mx-auto" />
                    <h5 className="font-bold text-slate-700 text-sm">No se registran sesiones activas en este momento</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Las sesiones de los técnicos y administradores aparecerán automáticamente aquí al ingresar.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer with Icon Buttons & Tooltips */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Auto-guardado local activo y sincronizado en tiempo real.</span>
            <span className="sm:hidden font-bold text-emerald-700">Sincronizado</span>
          </div>

          {/* Action icon buttons with hover tooltips */}
          <div className="flex items-center space-x-2">
            {!showButtonsMenu && (
              <button
                onClick={() => setShowButtonsMenu(true)}
                className="p-2.5 rounded-2xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs transition-all flex items-center justify-center cursor-pointer group relative"
                title="Volver a los botones de Reglas"
                aria-label="Volver a los botones de Reglas"
              >
                <LayoutGrid className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </button>
            )}

            <button
              onClick={handleSaveAll}
              className="p-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer group relative"
              title="Guardar todos los cambios en las Reglas Maestras"
              aria-label="Guardar todos los cambios"
            >
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Guardar</span>
            </button>

            <button
              onClick={() => {
                if (isDirty) {
                  setShowSaveConfirmDialog(true);
                } else {
                  onClose();
                }
              }}
              className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white shadow-xs transition-all flex items-center justify-center cursor-pointer group relative"
              title="Cerrar ventana de Reglas"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Modal de confirmación de cambios pendientes al salir */}
        {showSaveConfirmDialog && (
          <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-300 text-slate-900 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-950">¿Guardar cambios realizados?</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Ha realizado modificaciones en las configuraciones. ¿Desea guardar los cambios antes de salir o descartarlos?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveConfirmDialog(false);
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Descartar y Salir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveAll();
                    setShowSaveConfirmDialog(false);
                    onClose();
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar y Salir</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
