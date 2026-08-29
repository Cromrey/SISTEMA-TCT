import React, { useState, useRef, useEffect } from 'react';
import { ProductionProject, StepData, AuthUser, StaffMember, EquipmentItem } from '../types';
import { PhaseSequenceBar } from './PhaseSequenceBar';
import { StepExecutionModal } from './StepExecutionModal';
import { createAuditEntry, appendAuditLog } from '../utils/auditLogger';
import { getProjectProgressInfo } from '../utils/projectProgress';
import { getStoredUsers } from '../utils/authStorage';
import { TCTLogo } from './TCTLogo';
import { 
  X, 
  Calendar, 
  Coins,
  Banknote,
  Receipt,
  User, 
  Camera, 
  HardDrive, 
  FileText,
  Paperclip,
  Lock,
  FileCheck,
  Edit3,
  Upload,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save,
  Trash2,
  AlertTriangle,
  XCircle,
  CheckSquare,
  Zap,
  UserPlus,
  Plus,
  ShieldAlert
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: ProductionProject;
  currentUser?: AuthUser | null;
  currentRole?: 'admin' | 'employee';
  onClose: () => void;
  onUpdateProject: (updated: ProductionProject) => void;
  onOpenContractExport?: (project: ProductionProject) => void;
  onOpenProgressReport?: (project: ProductionProject) => void;
  onDeleteProject?: (projectId: string) => void;
}

type ModalTab = 'phase_details' | 'commercial' | 'staff_equipment';

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  currentUser,
  currentRole = 'admin',
  onClose,
  onUpdateProject,
  onOpenContractExport,
  onOpenProgressReport,
  onDeleteProject
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('phase_details');
  const [selectedStepCoord, setSelectedStepCoord] = useState<{ phaseIndex: number; stepIndex: number } | null>(null);
  const [isEditingCommercial, setIsEditingCommercial] = useState(false);
  const [showProformaPreview, setShowProformaPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staff and equipment editing sub-states for admin
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffUserSelect, setNewStaffUserSelect] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Director de Cámara');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipCategory, setNewEquipCategory] = useState<'Cámara' | 'Audio' | 'Iluminación' | 'Dron' | 'Gimbal / Soporte' | 'Lentes' | 'Otro'>('Cámara');
  const [newEquipSerial, setNewEquipSerial] = useState('');

  const [availableUsers, setAvailableUsers] = useState<AuthUser[]>(getStoredUsers());

  useEffect(() => {
    const handleUsersUpdate = () => {
      setAvailableUsers(getStoredUsers());
    };
    window.addEventListener('tct_users_updated', handleUsersUpdate);
    window.addEventListener('storage', handleUsersUpdate);
    return () => {
      window.removeEventListener('tct_users_updated', handleUsersUpdate);
      window.removeEventListener('storage', handleUsersUpdate);
    };
  }, []);

  const progressInfo = getProjectProgressInfo(project);

  // Edit Commercial State
  const [editClientName, setEditClientName] = useState(project.clientName || '');
  const [editClientDni, setEditClientDni] = useState(project.clientDniRuc || '');
  const [editClientPhone, setEditClientPhone] = useState(project.clientPhone || '');
  const [editClientEmail, setEditClientEmail] = useState(project.clientEmail || '');
  const [editClientAddress, setEditClientAddress] = useState(project.clientAddress || '');
  const [editEventLocation, setEditEventLocation] = useState(project.eventLocation || '');
  const [editEventAddress, setEditEventAddress] = useState(project.eventAddress || '');
  const [editEventDate, setEditEventDate] = useState(project.eventDate || '');
  const [editEventTime, setEditEventTime] = useState(project.eventTime || '');
  const [editQuotationCode, setEditQuotationCode] = useState(project.quotationCode || '');
  const [editContractNumber, setEditContractNumber] = useState(project.contractNumber || '');
  const [editContractHolder, setEditContractHolder] = useState(project.contractHolder || '');
  const [editPackageName, setEditPackageName] = useState(project.selectedPackageName || '');
  const [editListPrice, setEditListPrice] = useState<number>(project.listPrice || project.totalBudget || 3500);
  const [editDiscountAmount, setEditDiscountAmount] = useState<number>(project.discountAmount || 0);
  const [editDiscountReason, setEditDiscountReason] = useState(project.discountReason || '');
  const [editExtraHoursCount, setEditExtraHoursCount] = useState<number>(project.extraHoursCount || 0);
  const [editExtraHourRate, setEditExtraHourRate] = useState<number>(project.extraHourRate || 150);
  const [editInitialDeposit, setEditInitialDeposit] = useState<number>(project.initialDeposit || 0);
  const [editDepositMethod, setEditDepositMethod] = useState(project.paymentMethodDeposit || 'Transferencia BCP');
  const [editFieldPayment, setEditFieldPayment] = useState<number>(project.fieldPayment || 0);
  const [editAdditionalEquipment, setEditAdditionalEquipment] = useState(project.additionalEquipmentNotes || '');

  // Flatten steps for sequential checking and active step discovery
  const allSteps: { phaseIdx: number; stepIdx: number; step: StepData }[] = [];
  project.phases.forEach((p, pI) => {
    p.steps.forEach((s, sI) => {
      allSteps.push({ phaseIdx: pI, stepIdx: sI, step: s });
    });
  });

  const totalSteps = allSteps.length;
  const completedSteps = allSteps.filter(item => item.step.status === 'completed').length;

  // Active step in sequence
  const activeStepObj = allSteps.find(item => item.step.status === 'in_progress') 
    || allSteps.find(item => item.step.status !== 'completed')
    || allSteps[allSteps.length - 1];

  const activeStepNumber = activeStepObj ? activeStepObj.step.stepNumber : 1;

  // Financial balance calculations in Soles (S/.)
  const totalPaid = project.initialDeposit + project.fieldPayment;
  const pendingBalance = Math.max(0, project.totalBudget - totalPaid);

  const getStepRequirementHint = (num: number) => {
    switch (num) {
      case 1: return 'Recepción de proforma/cotización formal aprobada, ficha del cliente y acuerdos iniciales.';
      case 2: return 'Recepción y validación de voucher de depósito del adelanto inicial (50%) en tesorería.';
      case 3: return 'Suscripción y firma formal del contrato de prestación de servicios y entrega de copia legal al cliente.';
      case 4: return 'Diseño del arte gráfico del flyer publicitario del evento y aprobación del cliente.';
      case 5: return 'Asignación del Director General, Camarógrafos, Fotógrafo, Piloto Dron y transporte técnico.';
      case 6: return 'Llegada a locación, chequeo técnico de cámaras, audio inalámbrico y baterías al 100%.';
      case 7: return 'Rodaje audiovisual y cobro obligatorio del saldo pendiente en campo antes de las 7:00 PM.';
      case 8: return 'Ingesta dual de tarjetas SD RAW en servidor NAS con checksum MD5 y verificación técnica.';
      case 9: return 'Montaje y edición de Video Trailer Highlight 4K, Crónica Documental y grabación de USB (15 días).';
      case 10: return 'Publicación y registro de enlaces oficiales en redes sociales (TikTok, YouTube, Facebook, Drive).';
      case 11: return 'Diagramación, aprobación e impresión premium de fotolibro de lujo 30x30 (30 días).';
      case 12: return 'Acta de conformidad final del cliente, liquidación contable a saldo S/. 0.00 y cierre de expediente.';
      default: return 'Completar checklist y adjuntar evidencias técnicas del paso.';
    }
  };

  // Handle Proforma PDF / Image upload with Audit Log
  const handleProformaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      const auditLog = createAuditEntry({
        userName: project.contractHolder || 'Ing. Roberto Acuña (Admin)',
        userRole: 'admin',
        action: 'attachment_uploaded',
        title: 'Proforma Oficial TCT Adjuntada',
        description: `Se adjuntó el documento de proforma ${file.name} al expediente comercial.`
      });

      let updated: ProductionProject = {
        ...project,
        proformaAttachmentUrl: dataUrl,
        proformaAttachmentName: file.name,
        updatedAt: new Date().toISOString()
      };

      updated = appendAuditLog(updated, auditLog);
      onUpdateProject(updated);
    };
    reader.readAsDataURL(file);
  };

  // Save commercial data with Audit Log
  const handleSaveCommercialChanges = () => {
    const computedTotal = Math.max(0, editListPrice - editDiscountAmount + (editExtraHoursCount * editExtraHourRate));
    const computedBalance = Math.max(0, computedTotal - editInitialDeposit - editFieldPayment);

    const auditLog = createAuditEntry({
      userName: project.contractHolder || 'Ing. Roberto Acuña (Admin)',
      userRole: 'admin',
      action: 'commercial_edited',
      title: 'Expediente Comercial Actualizado',
      description: `Se modificaron datos del cliente (${editClientName}), presupuesto (S/. ${computedTotal.toLocaleString()}) y adelanto (S/. ${editInitialDeposit.toLocaleString()}).`,
      metadata: {
        totalPresupuesto: `S/. ${computedTotal}`,
        adelanto: `S/. ${editInitialDeposit}`,
        saldoFinal: `S/. ${computedBalance}`
      }
    });

    let updated: ProductionProject = {
      ...project,
      clientName: editClientName.trim() || project.clientName,
      clientDniRuc: editClientDni.trim(),
      clientPhone: editClientPhone.trim(),
      clientEmail: editClientEmail.trim(),
      clientAddress: editClientAddress.trim(),
      eventLocation: editEventLocation.trim() || project.eventLocation,
      eventAddress: editEventAddress.trim(),
      eventDate: editEventDate,
      eventTime: editEventTime.trim(),
      quotationCode: editQuotationCode.trim() || project.quotationCode,
      contractNumber: editContractNumber.trim() || project.contractNumber,
      contractHolder: editContractHolder.trim() || project.contractHolder,
      selectedPackageName: editPackageName.trim() || project.selectedPackageName,
      listPrice: Number(editListPrice),
      discountAmount: Number(editDiscountAmount),
      discountReason: editDiscountReason.trim(),
      extraHoursCount: Number(editExtraHoursCount),
      extraHourRate: Number(editExtraHourRate),
      initialDeposit: Number(editInitialDeposit),
      paymentMethodDeposit: editDepositMethod,
      fieldPayment: Number(editFieldPayment),
      totalBudget: computedTotal,
      finalBalance: computedBalance,
      additionalEquipmentNotes: editAdditionalEquipment.trim(),
      updatedAt: new Date().toISOString()
    };

    updated = appendAuditLog(updated, auditLog);
    onUpdateProject(updated);
    setIsEditingCommercial(false);
  };

  // Staff Assignment Handlers (Admin Only)
  const handleAddStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole !== 'admin') return;

    let staffName = newStaffName.trim();
    let staffPhone = newStaffPhone.trim();
    let staffRole = newStaffRole.trim();

    if (newStaffUserSelect) {
      const selectedUser = availableUsers.find(u => u.id === newStaffUserSelect);
      if (selectedUser) {
        staffName = selectedUser.fullName || selectedUser.username;
        staffPhone = selectedUser.phone || staffPhone;
        staffRole = selectedUser.jobTitle || staffRole;
      }
    }

    if (!staffName) return;

    const newStaff: StaffMember = {
      id: `st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: staffName,
      role: staffRole,
      phone: staffPhone || '+51 900 000 000',
      confirmed: true
    };

    const currentStaffList = project.assignedStaff || [];
    const updatedStaffList = [...currentStaffList, newStaff];

    const auditLog = createAuditEntry({
      userName: currentUser?.fullName || 'Administrador TCT',
      userRole: 'admin',
      action: 'staff_assigned',
      title: 'Personal Técnico Asignado',
      description: `Se asignó a ${staffName} como ${staffRole} al proyecto.`
    });

    let updated: ProductionProject = {
      ...project,
      assignedStaff: updatedStaffList,
      updatedAt: new Date().toISOString()
    };

    updated = appendAuditLog(updated, auditLog);
    onUpdateProject(updated);

    // Reset form
    setNewStaffUserSelect('');
    setNewStaffName('');
    setNewStaffRole('Director de Cámara');
    setNewStaffPhone('');
    setIsAddingStaff(false);
  };

  const handleRemoveStaffMember = (staffId: string) => {
    if (currentRole !== 'admin') return;
    const currentStaffList = project.assignedStaff || [];
    const targetStaff = currentStaffList.find(s => s.id === staffId);
    const updatedStaffList = currentStaffList.filter(s => s.id !== staffId);

    const auditLog = createAuditEntry({
      userName: currentUser?.fullName || 'Administrador TCT',
      userRole: 'admin',
      action: 'staff_assigned',
      title: 'Personal Técnico Removido',
      description: `Se removió a ${targetStaff?.name || 'técnico'} de la asignación del proyecto.`
    });

    let updated: ProductionProject = {
      ...project,
      assignedStaff: updatedStaffList,
      updatedAt: new Date().toISOString()
    };

    updated = appendAuditLog(updated, auditLog);
    onUpdateProject(updated);
  };

  // Equipment Assignment Handlers (Admin Only)
  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole !== 'admin') return;
    if (!newEquipName.trim()) return;

    const newEquip: EquipmentItem = {
      id: `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newEquipName.trim(),
      category: newEquipCategory,
      serialNumber: newEquipSerial.trim() || undefined,
      checkedOut: true
    };

    const currentEquipList = project.equipmentList || [];
    const updatedEquipList = [...currentEquipList, newEquip];

    let updated: ProductionProject = {
      ...project,
      equipmentList: updatedEquipList,
      updatedAt: new Date().toISOString()
    };

    onUpdateProject(updated);
    setNewEquipName('');
    setNewEquipSerial('');
    setIsAddingEquipment(false);
  };

  const handleToggleEquipmentStatus = (equipId: string) => {
    if (currentRole !== 'admin') return;
    const currentEquipList = project.equipmentList || [];
    const updatedEquipList = currentEquipList.map(eq => {
      if (eq.id === equipId) {
        return { ...eq, checkedOut: !eq.checkedOut };
      }
      return eq;
    });

    let updated: ProductionProject = {
      ...project,
      equipmentList: updatedEquipList,
      updatedAt: new Date().toISOString()
    };

    onUpdateProject(updated);
  };

  const handleRemoveEquipment = (equipId: string) => {
    if (currentRole !== 'admin') return;
    const currentEquipList = project.equipmentList || [];
    const updatedEquipList = currentEquipList.filter(eq => eq.id !== equipId);

    let updated: ProductionProject = {
      ...project,
      equipmentList: updatedEquipList,
      updatedAt: new Date().toISOString()
    };

    onUpdateProject(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] text-slate-900">
        
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-wrap gap-2.5 shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <TCTLogo size="sm" variant="icon-only" />
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1">
                <span className="font-mono text-[11px] sm:text-xs font-black bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  {project.uniqueCode}
                </span>
                {project.quotationCode && (
                  <span className="font-mono text-[10px] sm:text-xs font-bold bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded border border-slate-700 hidden sm:inline">
                    Cotiz: {project.quotationCode}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {project.eventType}
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-black text-white mt-0.5 truncate">
                {project.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Atrás Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-400/50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Volver a la vista principal"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Atrás</span>
            </button>

            {/* Adelante Button (Avanza al paso activo / formulario) */}
            {activeStepObj && (
              <button
                type="button"
                onClick={() => setSelectedStepCoord({ phaseIndex: activeStepObj.phaseIdx, stepIndex: activeStepObj.stepIdx })}
                className="px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-400/50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                title={`Ir al hito en curso: Paso ${activeStepObj.step.stepNumber}`}
              >
                <span className="hidden sm:inline">Adelante</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {onOpenContractExport && (
              <button
                type="button"
                onClick={() => onOpenContractExport(project)}
                className="px-2 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md transition-all shrink-0 cursor-pointer"
                title="Exportar Contrato Oficial"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Exportar Contrato</span>
              </button>
            )}

            {onOpenProgressReport && (
              <button
                type="button"
                onClick={() => onOpenProgressReport(project)}
                className="px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-400/50 font-black text-xs flex items-center gap-1 shadow-md transition-all shrink-0 cursor-pointer"
                title="Descargar Ficha Técnica Oficial de 12 Pasos en PDF"
              >
                <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Reporte 12 Pasos</span>
              </button>
            )}

            {onDeleteProject && currentRole === 'admin' && (
              <button
                type="button"
                onClick={() => onDeleteProject(project.id)}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold text-xs flex items-center gap-1 shadow-md transition-all shrink-0 cursor-pointer"
                title="Eliminar este contrato permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Borrar</span>
              </button>
            )}

            {/* Salir Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-300 border border-slate-700 hover:border-red-500/50 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
              title="Salir / Cerrar ventana"
            >
              <span className="hidden sm:inline">Salir</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content: Unified 12 Steps Command Center */}
        <div className="p-3 sm:p-5 lg:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          
          <div className="space-y-5">
            {/* Active Step Hero Alert Banner */}
            {activeStepObj && (
              <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-0.5 rounded-2xl shadow-md animate-subtle-pulse">
                <div className="bg-slate-950 text-white p-3.5 sm:p-4 rounded-[14px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black text-lg sm:text-xl flex items-center justify-center shadow-md shrink-0">
                      {activeStepObj.step.stepNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] sm:text-[11px] uppercase tracking-wider">
                          ⚡ Hito en Seguimiento • Paso {activeStepObj.step.stepNumber} de 12
                        </span>
                        <span className="text-xs font-bold text-amber-300 font-mono">
                          {progressInfo.formattedPercentage}
                        </span>
                        {(activeStepObj.step.stepNumber === 3 || progressInfo.formattedPercentage === '25.00%') && (
                          <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full border border-amber-200 animate-bounce">
                            ★ FIRMA DE CONTRATO
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-white mt-1">
                        {(activeStepObj.step.stepNumber === 3 || progressInfo.formattedPercentage === '25.00%')
                          ? 'Firma de Contrato'
                          : activeStepObj.step.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium flex items-center gap-1">
                        <span className="text-amber-400 font-bold">📄 Requerido:</span> {getStepRequirementHint(activeStepObj.step.stepNumber)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedStepCoord({ phaseIndex: activeStepObj.phaseIdx, stepIndex: activeStepObj.stepIdx })}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Abrir Formulario & Adjuntos</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Key Facts / Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              
              <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block uppercase">Fecha & Horario</span>
                <div className="flex items-center space-x-1.5 mt-1 font-black text-slate-900 text-xs sm:text-sm">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">{project.eventDate}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 block mt-0.5 truncate">{project.eventTime}</span>
              </div>

              <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block uppercase">Presupuesto en Soles</span>
                <div className="flex items-center space-x-1.5 mt-1 font-black text-slate-900 text-xs sm:text-sm">
                  <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-mono">S/. {project.totalBudget.toLocaleString()}</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 block mt-0.5 truncate">
                  Adelanto: S/. {project.initialDeposit.toLocaleString()}
                </span>
              </div>

              <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block uppercase">Cobro en Campo (7:00 PM)</span>
                <div className="flex items-center space-x-1.5 mt-1 font-black text-slate-900 text-xs sm:text-sm">
                  <Banknote className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-mono">S/. {project.fieldPayment.toLocaleString()}</span>
                </div>
                <span className={`text-[10px] sm:text-[11px] font-bold block mt-0.5 truncate ${
                  pendingBalance === 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {pendingBalance === 0 ? '✓ Saldo S/. 0.00' : `Saldo: S/. ${pendingBalance.toLocaleString()}`}
                </span>
              </div>

              <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 block uppercase">Entregables SLA</span>
                <div className="flex items-center space-x-1 mt-1 text-[10px] font-bold text-slate-800 flex-wrap gap-1">
                  {project.includesPhotobook && <span className="px-1.5 py-0.2 rounded bg-pink-100 text-pink-800">Libro 30d</span>}
                  {project.includesDrone && <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">Dron 4K</span>}
                  <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">USB 15d</span>
                </div>
                <span className="text-[10px] text-blue-700 font-bold block mt-1 truncate">
                  👤 {project.contractHolder || 'Corporación TCT'}
                </span>
              </div>

            </div>

            {/* Interactive Phase Sequence Bar */}
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Flujo Secuencial Corporación TCT (12 Pasos)</span>
                </h3>
                <span className="text-[11px] text-slate-500 italic hidden sm:inline">
                  * Haga clic en los hitos habilitados para abrir formularios y adjuntos
                </span>
              </div>
              <PhaseSequenceBar
                project={project}
                onStepClick={(phaseIdx, stepIdx) => setSelectedStepCoord({ phaseIndex: phaseIdx, stepIndex: stepIdx })}
              />
            </div>

            {/* TECHNICAL STAFF & EQUIPMENT (Directly accessible at the bottom) */}
              <div className="pt-2 space-y-4">
              
              {/* Permission Banner for Non-Admins */}
              {currentRole !== 'admin' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-900 text-xs font-bold">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>🔒 Solo el Administrador General puede editar o modificar la asignación de personal técnico y equipamiento.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Technical Staff Panel */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-500" />
                      Personal Técnico Asignado ({project.assignedStaff?.length || 0})
                    </h4>
                    {currentRole === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setIsAddingStaff(!isAddingStaff)}
                        className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-blue-200"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isAddingStaff ? 'Cancelar' : 'Asignar Técnico'}</span>
                      </button>
                    )}
                  </div>

                  {/* Add Staff Form (Admin Only) */}
                  {isAddingStaff && currentRole === 'admin' && (
                    <form onSubmit={handleAddStaffMember} className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2.5 text-xs">
                      <span className="font-bold text-blue-900 block text-[11px]">Asignar Usuario del Sistema o Nuevo Técnico:</span>
                      
                      {/* Pick from existing users */}
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Seleccionar Empleado Registrado:</label>
                        <select
                          value={newStaffUserSelect}
                          onChange={(e) => {
                            setNewStaffUserSelect(e.target.value);
                            const user = availableUsers.find(u => u.id === e.target.value);
                            if (user) {
                              setNewStaffName(user.fullName || user.username);
                              setNewStaffPhone(user.phone || '');
                              setNewStaffRole(user.jobTitle || 'Director de Cámara');
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs"
                        >
                          <option value="">-- Seleccionar de la lista de usuarios --</option>
                          {availableUsers.map((u, uIdx) => (
                            <option key={u.id || `usr-${uIdx}`} value={u.id}>
                              {u.fullName} ({u.jobTitle || u.role}) - {u.phone}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Nombre Completo:</label>
                          <input
                            type="text"
                            value={newStaffName}
                            onChange={e => setNewStaffName(e.target.value)}
                            placeholder="Ej. Juan Pérez"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Rol / Especialidad:</label>
                          <input
                            type="text"
                            value={newStaffRole}
                            onChange={e => setNewStaffRole(e.target.value)}
                            placeholder="Ej. Fotógrafo Principal"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Teléfono / WhatsApp:</label>
                        <input
                          type="text"
                          value={newStaffPhone}
                          onChange={e => setNewStaffPhone(e.target.value)}
                          placeholder="+51 987654321"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        ✓ Guardar Asignación de Técnico
                      </button>
                    </form>
                  )}

                  {/* Staff List */}
                  <div className="space-y-1.5 text-xs">
                    {project.assignedStaff && project.assignedStaff.length > 0 ? (
                      project.assignedStaff.map((staff, stIdx) => (
                        <div key={staff.id || `staff-${staff.name}-${stIdx}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                          <div>
                            <span className="font-bold text-slate-900">{staff.name}</span>
                            <span className="block text-[10px] text-slate-500">{staff.role}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-mono text-slate-600">{staff.phone}</span>
                            {currentRole === 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveStaffMember(staff.id)}
                                className="p-1 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                title="Remover técnico asignado"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic p-2 text-center">Sin técnicos asignados aún</p>
                    )}
                  </div>
                </div>

                {/* Equipment checklist */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-amber-500" />
                      Equipos y Cuerpos Asignados ({project.equipmentList?.length || 0})
                    </h4>
                    {currentRole === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setIsAddingEquipment(!isAddingEquipment)}
                        className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-amber-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAddingEquipment ? 'Cancelar' : 'Agregar Equipo'}</span>
                      </button>
                    )}
                  </div>

                  {/* Add Equipment Form (Admin Only) */}
                  {isAddingEquipment && currentRole === 'admin' && (
                    <form onSubmit={handleAddEquipment} className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2.5 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Nombre / Modelo:</label>
                          <input
                            type="text"
                            value={newEquipName}
                            onChange={e => setNewEquipName(e.target.value)}
                            placeholder="Ej. Sony FX3 Cinema"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Categoría:</label>
                          <select
                            value={newEquipCategory}
                            onChange={e => setNewEquipCategory(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                          >
                            <option value="Cámara">Cámara</option>
                            <option value="Audio">Audio</option>
                            <option value="Iluminación">Iluminación</option>
                            <option value="Dron">Dron</option>
                            <option value="Gimbal / Soporte">Gimbal / Soporte</option>
                            <option value="Lentes">Lentes</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Nro de Serie / Código:</label>
                        <input
                          type="text"
                          value={newEquipSerial}
                          onChange={e => setNewEquipSerial(e.target.value)}
                          placeholder="Ej. SN-FX3-9921"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        ✓ Asignar Equipo a Producción
                      </button>
                    </form>
                  )}

                  {/* Equipment List */}
                  <div className="space-y-1.5 text-xs">
                    {project.equipmentList && project.equipmentList.length > 0 ? (
                      project.equipmentList.map((eq, eqIdx) => (
                        <div key={eq.id || `eq-${eq.name}-${eqIdx}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                          <div>
                            <span className="font-bold text-slate-900">{eq.name}</span>
                            <span className="block text-[10px] text-slate-500">{eq.category} {eq.serialNumber ? `• ${eq.serialNumber}` : ''}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleToggleEquipmentStatus(eq.id)}
                              disabled={currentRole !== 'admin'}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                                eq.checkedOut 
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                            >
                              {eq.checkedOut ? 'Asignado' : 'Disponible'}
                            </button>

                            {currentRole === 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleRemoveEquipment(eq.id)}
                                className="p-1 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                title="Eliminar equipo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic p-2 text-center">Sin equipos asignados aún</p>
                    )}
                  </div>
                </div>
              </div>
              </div>

            </div>

        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] text-slate-500 font-medium">
              Última actualización: {new Date(project.updatedAt).toLocaleString()}
            </span>
            {onDeleteProject && currentRole === 'admin' && (
              <button
                type="button"
                onClick={() => onDeleteProject(project.id)}
                className="px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-red-300 cursor-pointer"
                title="Eliminar este expediente de forma justificada"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Eliminar Expediente</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>

      {/* Proforma PDF / Image Preview Modal */}
      {showProformaPreview && project.proformaAttachmentUrl && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs">{project.proformaAttachmentName || 'Proforma Enviada al Cliente'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowProformaPreview(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100">
              {project.proformaAttachmentUrl.startsWith('data:image/') || project.proformaAttachmentUrl.includes('.jpg') || project.proformaAttachmentUrl.includes('.png') ? (
                <img
                  src={project.proformaAttachmentUrl}
                  alt="Proforma"
                  className="max-h-[75vh] object-contain rounded border border-slate-300 shadow-md"
                />
              ) : (
                <iframe
                  src={project.proformaAttachmentUrl}
                  title="Proforma PDF"
                  className="w-full h-[70vh] rounded border border-slate-300"
                />
              )}
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProformaPreview(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Step Execution Modal if a step is clicked */}
      {selectedStepCoord && (
        <StepExecutionModal
          project={project}
          phaseIndex={selectedStepCoord.phaseIndex}
          stepIndex={selectedStepCoord.stepIndex}
          currentRole={currentRole}
          onClose={() => setSelectedStepCoord(null)}
          onSaveStep={(updated) => {
            onUpdateProject(updated);
            setSelectedStepCoord(null);
          }}
        />
      )}
    </div>
  );
};
