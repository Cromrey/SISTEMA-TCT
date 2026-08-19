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
  StaffMember
} from '../types';
import { 
  getStoredRules, 
  saveMasterRules, 
  resetMasterRulesToDefault 
} from '../utils/rulesStorage';
import { 
  getStoredUsers, 
  createOrUpdateUser, 
  deleteUser, 
  resetUsersToDefaults 
} from '../utils/authStorage';
import { 
  resetToDemoData, 
  getStoredProjects, 
  saveProjects, 
  getLastSyncTime 
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
  Zap
} from 'lucide-react';

export type SettingsTab = 'checklists' | 'equipment' | 'packages' | 'services' | 'formats' | 'users' | 'shortcuts' | 'system';

interface AdminSettingsModalProps {
  onClose: () => void;
  onRulesUpdated?: () => void;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  currentUser?: AuthUser;
  onUsersChanged?: (users: AuthUser[]) => void;
  onResetDemoData?: () => void;
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
  initialTab = 'checklists',
  currentStaff,
  allStaff = [],
  onStaffChange
}) => {
  const [rules, setRules] = useState<TCTMasterRules>(getStoredRules());
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // File input ref for JSON restore
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
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

  const handleSaveAll = () => {
    const updatedRules: TCTMasterRules = {
      ...rules,
      standardExtraHourRate: Number(standardExtraHourRate),
      maxDiscountPercentageAllowed: Number(maxDiscountPercentage)
    };
    saveMasterRules(updatedRules);
    setRules(updatedRules);
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
    setEditingChecklistIdx(null);
    setEditingChecklistValue('');
  };

  // -------------------------------------------------------------
  // 2. EQUIPMENT MANAGEMENT
  // -------------------------------------------------------------
  const handleAddEquipment = () => {
    if (!newEquipmentName.trim()) return;
    const newEq: EquipmentItem = {
      id: `eq-custom-${Date.now()}`,
      name: newEquipmentName.trim(),
      category: newEquipmentCategory,
      serialNumber: newEquipmentSerial.trim() || undefined,
      checkedOut: false,
      isAvailable: true,
      condition: 'good',
      maintenanceRequired: false
    };
    const updatedRules = {
      ...rules,
      equipmentCatalog: [newEq, ...rules.equipmentCatalog]
    };
    setRules(updatedRules);
    setNewEquipmentName('');
    setNewEquipmentSerial('');
    notifySuccess(`✓ Equipo "${newEq.name}" agregado al catálogo`);
  };

  const handleDeleteEquipment = (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este equipo del catálogo institucional?')) {
      const updatedRules = {
        ...rules,
        equipmentCatalog: rules.equipmentCatalog.filter(e => e.id !== id)
      };
      setRules(updatedRules);
      notifySuccess('Equipo eliminado del catálogo');
    }
  };

  const filteredEquipment = rules.equipmentCatalog.filter(eq => {
    const matchesCat = equipmentFilterCat === 'all' || eq.category === equipmentFilterCat;
    const matchesSearch = !searchQuery || 
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eq.serialNumber && eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
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
    if (window.confirm(`¿Está seguro de eliminar al usuario "${u.fullName}" (@${u.username})?`)) {
      const result = deleteUser(u.id);
      if (result.success) {
        notifySuccess(`✓ Usuario "${u.username}" eliminado.`);
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
      resetToDemoData();
      if (onResetDemoData) {
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
          }
          if (parsed.rules) {
            saveMasterRules(parsed.rules);
            setRules(parsed.rules);
          }
          if (parsed.users && Array.isArray(parsed.users)) {
            localStorage.setItem('tct_auth_users_v1', JSON.stringify(parsed.users));
            refreshUsersList();
          }
          if (onResetDemoData) onResetDemoData();
          if (onRulesUpdated) onRulesUpdated();
          notifySuccess('✓ Respaldo restaurado exitosamente en el sistema local.');
        } catch (err) {
          alert('Error al leer el archivo JSON de respaldo. Verifique el formato.');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in">
      <div className="bg-white text-slate-900 rounded-3xl max-w-5xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <TCTLogo size="sm" variant="icon-only" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <span>Reglas Maestras & Configuración Institucional</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                  Oficial TCT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestión de Checklists, Inventario, Proformas, Tarifas, Formatos, Usuarios y Autoguardado
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <SyncStatusIndicator />
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
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

        {/* REQUERIMIENTO OFICIAL: Cuadro "Vista de Sistema" para conmutar Admin / Técnico o escoger cualquier empleado */}
        {onRoleChange && (
          <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-black text-white text-xs uppercase tracking-wider">
                    Vista de Sistema & Modo de Navegación
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    currentRole === 'admin'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-blue-500 text-white shadow-xs'
                  }`}>
                    {currentRole === 'admin' ? '🛡️ Administrador General' : `👷 Vista Empleado: ${currentStaff?.name || 'Técnico'}`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {currentRole === 'admin'
                    ? 'Supervisión global de todos los proyectos, balances financieros y asignación de personal.'
                    : `Visualización restringida a las tareas y expedientes asignados a ${currentStaff?.name}.`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-y-1.5 shrink-0 w-full md:w-auto">
              {/* Toggle Admin / Técnico */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onRoleChange('admin');
                    notifySuccess('Cambiando a Vista de Administrador General');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRole === 'admin'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRoleChange('employee');
                    notifySuccess(`Cambiando a Vista de Técnico (${currentStaff?.name || 'Personal'})`);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRole === 'employee'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Técnico</span>
                </button>
              </div>

              {/* Employee selector for viewing as any technician */}
              {onStaffChange && allStaff.length > 0 && (
                <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                  <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Ver como:</span>
                  <select
                    value={currentStaff?.id || allStaff[0]?.id}
                    onChange={(e) => {
                      const found = allStaff.find(s => s.id === e.target.value);
                      if (found) {
                        onStaffChange(found);
                        onRoleChange('employee');
                        notifySuccess(`✓ Viendo sistema como: ${found.name} (${found.role})`);
                      }
                    }}
                    className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer pr-1"
                  >
                    {allStaff.map(st => (
                      <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                        {st.name} ({st.role.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-4 sm:px-6 py-2 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('checklists')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'checklists'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>1. Checklists (12 Pasos)</span>
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'equipment'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>2. Inventario</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-amber-300">
              {rules.equipmentCatalog.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'packages'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>3. Proformas</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-amber-300">
              {rules.packages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'services'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>4. Tarifas & Asesores</span>
          </button>

          <button
            onClick={() => setActiveTab('formats')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'formats'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>5. Formatos</span>
          </button>

          {/* TAB 6: USUARIOS */}
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>6. Administrar Usuarios</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-900 text-[10px] text-blue-200">
              {usersList.length}
            </span>
          </button>

          {/* TAB 7: ATAJOS DE TECLADO */}
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'shortcuts'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>7. Atajos de Teclado</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-900 text-[10px] text-amber-200">
              {shortcutsList.filter(s => s.enabled).length} Activos
            </span>
          </button>

          {/* TAB 8: SISTEMA & AUTOGUARDADO */}
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'system'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>8. Sistema & Demo</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6">

          {/* ========================================================= */}
          {/* TAB 1: CHECKLISTS DE LOS 12 PASOS */}
          {/* ========================================================= */}
          {activeTab === 'checklists' && (
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
          {/* TAB 2: INVENTARIO DE EQUIPOS */}
          {/* ========================================================= */}
          {activeTab === 'equipment' && (
            <div className="space-y-5">
              {/* Add form */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>Dar de Alta Nuevo Equipo Institucional</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Nombre del Equipo</label>
                    <input
                      type="text"
                      value={newEquipmentName}
                      onChange={(e) => setNewEquipmentName(e.target.value)}
                      placeholder="Ej: Sony FX3 Cinema Line #3"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Categoría</label>
                    <select
                      value={newEquipmentCategory}
                      onChange={(e) => setNewEquipmentCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Número de Serie (Opcional)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newEquipmentSerial}
                        onChange={(e) => setNewEquipmentSerial(e.target.value)}
                        placeholder="Ej: SN-998231-TCT"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        onClick={handleAddEquipment}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 transition-all shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-2 flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar equipo o serie..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
                  {['all', 'Cámara', 'Lente', 'Dron', 'Audio', 'Iluminación', 'Estabilizador'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setEquipmentFilterCat(cat)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        equipmentFilterCat === cat
                          ? 'bg-slate-900 text-amber-400'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredEquipment.map((eq) => (
                  <div
                    key={eq.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                        {eq.category}
                      </span>
                      <h5 className="text-xs font-black text-slate-900 leading-tight">
                        {eq.name}
                      </h5>
                      {eq.serialNumber && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          SN: {eq.serialNumber}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteEquipment(eq.id)}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Eliminar equipo del inventario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PROFORMAS & PAQUETES */}
          {/* ========================================================= */}
          {activeTab === 'packages' && (
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
          {/* TAB 4: TARIFAS & ASESORES */}
          {/* ========================================================= */}
          {activeTab === 'services' && (
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

              {/* Advisors */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Asesores & Representantes Autorizados</span>
                </h4>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newAdvisorName}
                    onChange={(e) => setNewAdvisorName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAdvisor()}
                    placeholder="Nombre completo del asesor..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddAdvisor}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black rounded-xl shrink-0"
                  >
                    + Asesor
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {rules.authorizedContractHolders.map((advisor, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-800">{advisor}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAdvisor(advisor)}
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

          {/* ========================================================= */}
          {/* TAB 5: FORMATOS & ACTAS OFICIALES */}
          {/* ========================================================= */}
          {activeTab === 'formats' && (
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
          {activeTab === 'users' && (
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
          {activeTab === 'shortcuts' && (
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
          {activeTab === 'system' && (
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
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Auto-guardado local activo y sincronizado en tiempo real.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Reglas</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
