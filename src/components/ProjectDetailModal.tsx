import React, { useState, useRef } from 'react';
import { ProductionProject, StepData, AuthUser } from '../types';
import { PhaseSequenceBar } from './PhaseSequenceBar';
import { StepExecutionModal } from './StepExecutionModal';
import { ProjectAuditLogView } from './ProjectAuditLogView';
import { createAuditEntry, appendAuditLog } from '../utils/auditLogger';
import { getProjectProgressInfo } from '../utils/projectProgress';
import { TCTLogo } from './TCTLogo';
import { ProjectQrCheckinModal } from './ProjectQrCheckinModal';
import { 
  X, 
  Printer, 
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
  ChevronRight,
  ShieldCheck,
  Layers,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save,
  QrCode,
  Trash2,
  AlertTriangle,
  XCircle,
  CheckSquare,
  Zap
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: ProductionProject;
  currentUser?: AuthUser | null;
  currentRole?: 'admin' | 'employee';
  onClose: () => void;
  onUpdateProject: (updated: ProductionProject) => void;
  onOpenReportPrint: (project: ProductionProject) => void;
  onOpenContractExport?: (project: ProductionProject) => void;
  onDeleteProject?: (projectId: string) => void;
}

type ModalTab = 'flow_sequential' | 'phase_details' | 'commercial' | 'audit_logs' | 'staff_equipment';

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  currentUser,
  currentRole = 'admin',
  onClose,
  onUpdateProject,
  onOpenReportPrint,
  onOpenContractExport,
  onDeleteProject
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('flow_sequential');
  const [selectedStepCoord, setSelectedStepCoord] = useState<{ phaseIndex: number; stepIndex: number } | null>(null);
  const [isEditingCommercial, setIsEditingCommercial] = useState(false);
  const [showProformaPreview, setShowProformaPreview] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progressInfo = getProjectProgressInfo(project);

  // Edit Commercial State
  const [editClientName, setEditClientName] = useState(project.clientName || '');
  const [editClientDni, setEditClientDni] = useState(project.clientDniRuc || '');
  const [editClientPhone, setEditClientPhone] = useState(project.clientPhone || '');
  const [editClientEmail, setEditClientEmail] = useState(project.clientEmail || '');
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
  const progressPercent = Math.round((completedSteps / (totalSteps || 1)) * 100);

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
      case 1: return 'Subir Proforma Oficial TCT (PDF / Imagen) y Ficha de Datos del Cliente.';
      case 2: return 'Adjuntar Contrato Firmado (PDF/Foto) y Voucher de Adelanto Inicial.';
      case 3: return 'Asignar Hoja de Ruta de Transporte, Personal Técnico y Reserva de Equipos.';
      case 4: return 'Completar Hoja de Salida de Almacén y verificar Baterías/SDs al 100%.';
      case 5: return 'Verificación de Asistencia de Camarógrafos y Rodaje en Locación.';
      case 6: return 'Registrar Cobro Obligatorio de Saldo en Campo antes de las 7:00 PM.';
      case 7: return 'Resguardo Ingest de Tarjetas SD RAW en Servidor NAS dual con checksum MD5.';
      case 8: return 'Carga de Video Trailer Highlight 4K y Crónica Completa en 15 días.';
      case 9: return 'Maquetación de Fotolibro de Lujo y Aprobación de Pliegos (30 días).';
      case 10: return 'Publicación y Registro de Enlaces Oficiales (TikTok, YouTube, Facebook, Drive).';
      case 11: return 'Acta de Entrega de Estuche Grabado con USB 3.0 y Liquidación a S/. 0.00.';
      case 12: return 'Acta de Conformidad Final del Cliente y Autorización de Purga de Archivos RAW.';
      default: return 'Completar checklist y adjuntar evidencias técnicas.';
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

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-black text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
              title="Generar QR de Check-in y Asistencia en Sitio"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">QR Check-in</span>
            </button>

            {onOpenContractExport && (
              <button
                type="button"
                onClick={() => onOpenContractExport(project)}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md transition-all shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar Contrato</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenReportPrint(project)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reporte PDF</span>
            </button>

            {onDeleteProject && (
              <button
                type="button"
                onClick={() => onDeleteProject(project.id)}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold text-xs flex items-center gap-1 shadow-md transition-all shrink-0 cursor-pointer"
                title="Eliminar este contrato permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Borrar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs Navigation Bar */}
        <div className="bg-slate-900 px-2 sm:px-6 pt-1 border-b border-slate-800 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
          
          {/* Tab 1: Sequential 12-Step Flow */}
          <button
            type="button"
            onClick={() => setActiveTab('flow_sequential')}
            className={`px-2.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border-b-2 ${
              activeTab === 'flow_sequential'
                ? 'bg-slate-50 text-slate-900 border-amber-500 shadow-sm'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-slate-800/50'
            }`}
            title="Ver Flujo Secuencial Corporativo de 12 Pasos"
          >
            <Layers className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden md:inline">1. Flujo Secuencial</span>
            <span className="md:hidden">1. Flujo</span>
            {progressInfo.isValidated ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/20 text-amber-300 font-mono">
                {progressInfo.formattedPercentage}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-500/30 text-red-300 font-mono flex items-center gap-0.5" title="Avance bloqueado">
                <span className="line-through">{progressInfo.formattedPercentage}</span>
              </span>
            )}
          </button>

          {/* Tab 2: Detail and Phase Forms */}
          <button
            type="button"
            onClick={() => setActiveTab('phase_details')}
            className={`px-2.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border-b-2 ${
              activeTab === 'phase_details'
                ? 'bg-slate-50 text-slate-900 border-amber-500 shadow-sm'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-slate-800/50'
            }`}
            title="Ver Detalle y Formularios de las 6 Fases"
          >
            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">2. Detalle y Formulario</span>
            <span className="md:hidden">2. Fases</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
              {completedSteps}/12
            </span>
          </button>

          {/* Tab 3: Commercial Dossier */}
          <button
            type="button"
            onClick={() => setActiveTab('commercial')}
            className={`px-2.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border-b-2 ${
              activeTab === 'commercial'
                ? 'bg-slate-50 text-slate-900 border-amber-500 shadow-sm'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-slate-800/50'
            }`}
            title="Expediente Comercial, Cotización y Contrato"
          >
            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="hidden md:inline">3. Expediente Comercial</span>
            <span className="md:hidden">3. Comercial</span>
          </button>

          {/* Tab 4: Audit Logs */}
          <button
            type="button"
            onClick={() => setActiveTab('audit_logs')}
            className={`px-2.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border-b-2 ${
              activeTab === 'audit_logs'
                ? 'bg-slate-50 text-slate-900 border-amber-500 shadow-sm'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-slate-800/50'
            }`}
            title="Historial de Trazabilidad y Logs de Auditoría"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">4. Auditoría</span>
            <span className="md:hidden">4. Logs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
              {project.auditLogs?.length || 0}
            </span>
          </button>

          {/* Tab 5: Staff & Equipment */}
          <button
            type="button"
            onClick={() => setActiveTab('staff_equipment')}
            className={`px-2.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border-b-2 ${
              activeTab === 'staff_equipment'
                ? 'bg-slate-50 text-slate-900 border-amber-500 shadow-sm'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-slate-800/50'
            }`}
            title="Asignación de Personal Técnico y Equipamiento Audiovisual"
          >
            <Camera className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="hidden md:inline">5. Personal & Equipos</span>
            <span className="md:hidden">5. Equipos</span>
          </button>

        </div>

        {/* Modal Scrollable Content */}
        <div className="p-3 sm:p-5 lg:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          
          {/* TAB 1: SEQUENTIAL FLOW (1. Flujo Secuencial) */}
          {activeTab === 'flow_sequential' && (
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
                            {progressInfo.isValidated ? progressInfo.formattedPercentage : `${progressInfo.formattedPercentage} (Pendiente de Validación)`}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-white mt-1">
                          {activeStepObj.step.title}
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
                      <span>Abrir Checklist & Evidencia</span>
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
                    * El paso activo en seguimiento resalta con parpadeo y borde dorado
                  </span>
                </div>
                <PhaseSequenceBar
                  project={project}
                  onStepClick={(phaseIdx, stepIdx) => setSelectedStepCoord({ phaseIndex: phaseIdx, stepIndex: stepIdx })}
                />
              </div>

            </div>
          )}

          {/* TAB 2: PHASE DETAILS & FORMS (2. Detalle y Formulario por Fases) */}
          {activeTab === 'phase_details' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Detalle Operativo y Formularios por Fases</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Haga clic en cualquier paso para abrir su formulario de evidencias técnicas y checklist.
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-amber-400 text-xs font-mono font-bold">
                  Avance: {progressInfo.formattedPercentage}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {project.phases.map((phase, pIdx) => (
                  <div key={phase.phaseNumber} className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="w-7 h-7 rounded-xl text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0"
                          style={{ backgroundColor: phase.color }}
                        >
                          {phase.phaseNumber}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {phase.name}
                        </h4>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {phase.description}
                    </p>

                    <div className="space-y-2">
                      {phase.steps.map((step, sIdx) => {
                        const globalIdx = allSteps.findIndex(item => item.step.stepNumber === step.stepNumber);
                        const isFirstStep = globalIdx === 0;
                        const prevStep = !isFirstStep ? allSteps[globalIdx - 1] : null;
                        const isLocked = !isFirstStep && prevStep && prevStep.step.status !== 'completed';

                        const isComplete = step.status === 'completed';
                        const isActive = step.stepNumber === activeStepNumber && !isComplete;
                        const hasAttachments = step.attachments && step.attachments.length > 0;

                        return (
                          <div
                            key={step.id}
                            onClick={() => setSelectedStepCoord({ phaseIndex: pIdx, stepIndex: sIdx })}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                              isComplete
                                ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400'
                                : isActive
                                ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                                : isLocked
                                ? 'bg-slate-50 border-slate-200 opacity-70'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start space-x-2.5">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                                  isComplete
                                    ? 'bg-emerald-600 text-white'
                                    : isActive
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {isComplete ? <Check className="w-3.5 h-3.5" /> : step.stepNumber}
                                </div>

                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-black text-slate-900">
                                      {step.title}
                                    </span>
                                    {step.status === 'completed' && (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                        ✓ Completado
                                      </span>
                                    )}
                                    {isActive && (
                                      <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-1.5 py-0.2 rounded animate-pulse">
                                        ⚡ En curso
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                    {step.description}
                                  </p>
                                </div>
                              </div>

                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                            </div>

                            {/* Ingest or field payment indicators */}
                            {step.ingestData && (
                              <div className="mt-2 bg-yellow-100/70 p-1.5 rounded-lg text-[10px] font-bold text-yellow-900 flex justify-between">
                                <span>Ingest: {step.ingestData.sdCardsCount} Tarjetas ({step.ingestData.totalGigabytes} GB)</span>
                                <span>{step.ingestData.backupVerified ? '✅ RAID OK' : '⏳ Pendiente'}</span>
                              </div>
                            )}

                            {step.fieldPaymentData && (
                              <div className="mt-2 bg-red-100/70 p-1.5 rounded-lg text-[10px] font-bold text-red-900 flex justify-between">
                                <span>Cobro 7PM: {step.fieldPaymentData.paymentStatus === 'paid' ? `Cancelado (S/. ${step.fieldPaymentData.amountCollected.toLocaleString()})` : 'Pendiente'}</span>
                                <span>{step.fieldPaymentData.paymentMethod}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: COMMERCIAL DOSSIER & PRICING */}
          {activeTab === 'commercial' && (
            <div className="space-y-4">
              
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-5">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                        Expediente Comercial: Datos del Contrato, Cotización & Proforma
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        Registro de cliente, locación, desglose de descuentos, horas extras y proforma oficial
                      </span>
                    </div>
                  </div>

                  {currentRole === 'admin' ? (
                    !isEditingCommercial ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingCommercial(true)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Datos Comerciales</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingCommercial(false)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCommercialChanges}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar Cambios</span>
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Solo lectura (Admin)</span>
                    </div>
                  )}
                </div>

                {/* Edit Mode vs Display Mode */}
                {isEditingCommercial ? (
                  <div className="space-y-4 text-xs font-semibold text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Nombre Completo del Cliente:</label>
                        <input
                          type="text"
                          value={editClientName}
                          onChange={e => setEditClientName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">DNI / RUC del Cliente:</label>
                        <input
                          type="text"
                          value={editClientDni}
                          onChange={e => setEditClientDni(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Teléfono / WhatsApp:</label>
                        <input
                          type="text"
                          value={editClientPhone}
                          onChange={e => setEditClientPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Correo Electrónico:</label>
                        <input
                          type="email"
                          value={editClientEmail}
                          onChange={e => setEditClientEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Locación del Evento:</label>
                        <input
                          type="text"
                          value={editEventLocation}
                          onChange={e => setEditEventLocation(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Dirección Exacta:</label>
                        <input
                          type="text"
                          value={editEventAddress}
                          onChange={e => setEditEventAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Fecha del Evento:</label>
                        <input
                          type="date"
                          value={editEventDate}
                          onChange={e => setEditEventDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Horario Acordado:</label>
                        <input
                          type="text"
                          value={editEventTime}
                          onChange={e => setEditEventTime(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Asesor Responsable / Titular:</label>
                        <input
                          type="text"
                          value={editContractHolder}
                          onChange={e => setEditContractHolder(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                      <h4 className="font-black text-slate-900 text-xs uppercase">Desglose Financiero & Tarifario (S/.)</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Precio de Lista (S/.):</label>
                          <input
                            type="number"
                            value={editListPrice}
                            onChange={e => setEditListPrice(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Descuento (S/.):</label>
                          <input
                            type="number"
                            value={editDiscountAmount}
                            onChange={e => setEditDiscountAmount(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Horas Extras:</label>
                          <input
                            type="number"
                            value={editExtraHoursCount}
                            onChange={e => setEditExtraHoursCount(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Tarifa Hora Extra (S/.):</label>
                          <input
                            type="number"
                            value={editExtraHourRate}
                            onChange={e => setEditExtraHourRate(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Adelanto Inicial (S/.):</label>
                          <input
                            type="number"
                            value={editInitialDeposit}
                            onChange={e => setEditInitialDeposit(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Medio de Pago Adelanto:</label>
                          <input
                            type="text"
                            value={editDepositMethod}
                            onChange={e => setEditDepositMethod(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Cobro en Campo (7PM) S/.:</label>
                          <input
                            type="number"
                            value={editFieldPayment}
                            onChange={e => setEditFieldPayment(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-slate-900"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <div className="p-2 bg-slate-900 text-amber-400 rounded-xl text-center font-mono font-black text-xs">
                            Total: S/. {(editListPrice - editDiscountAmount + (editExtraHoursCount * editExtraHourRate)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Col 1: Datos del Cliente */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1 border-b border-slate-200 pb-1.5">
                        <User className="w-3.5 h-3.5 text-amber-600" />
                        Cliente & Locación
                      </span>
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-slate-900">{project.clientName}</p>
                        <p className="text-slate-600 flex items-center gap-1">
                          <span className="font-medium text-[11px]">DNI:</span> {project.clientDniRuc || 'No registrado'}
                        </p>
                        <p className="text-slate-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {project.clientPhone}
                        </p>
                        <p className="text-slate-600 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-slate-400" /> {project.clientEmail || '---'}
                        </p>
                        <p className="text-slate-600 flex items-center gap-1 pt-1 border-t border-slate-200/60">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{project.eventLocation}</span>
                        </p>
                      </div>
                    </div>

                    {/* Col 2: Desglose Financiero */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1 border-b border-slate-200 pb-1.5">
                        <Coins className="w-3.5 h-3.5 text-emerald-600" />
                        Desglose Financiero (S/.)
                      </span>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between text-slate-600">
                          <span>Precio Lista:</span>
                          <span>S/. {(project.listPrice || project.totalBudget).toLocaleString()}</span>
                        </div>
                        {project.discountAmount ? (
                          <div className="flex justify-between text-emerald-700">
                            <span>Descuento ({project.discountReason || 'Promoción'}):</span>
                            <span>- S/. {project.discountAmount.toLocaleString()}</span>
                          </div>
                        ) : null}
                        {project.extraHoursCount ? (
                          <div className="flex justify-between text-amber-700">
                            <span>Horas Extras ({project.extraHoursCount}h @ S/.{project.extraHourRate}):</span>
                            <span>+ S/. {(project.extraHoursCount * (project.extraHourRate || 150)).toLocaleString()}</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-200">
                          <span>Total Pactado:</span>
                          <span>S/. {project.totalBudget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-blue-700 text-[11px]">
                          <span>Adelanto Inicial:</span>
                          <span>S/. {project.initialDeposit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-purple-700 text-[11px]">
                          <span>Cobro Campo (7PM):</span>
                          <span>S/. {project.fieldPayment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-black pt-1 border-t border-slate-200">
                          <span>Saldo Pendiente:</span>
                          <span className={pendingBalance === 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                            {pendingBalance === 0 ? 'S/. 0.00 (Liquidado)' : `S/. ${pendingBalance.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Col 3: Proforma Enviada al Cliente */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                            Proforma Oficial Enviada
                          </span>
                          {project.proformaAttachmentUrl ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                              ✓ Adjunta
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                              Pendiente
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-slate-700">
                          {project.proformaAttachmentUrl ? (
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900 truncate text-[11px]">
                                    {project.proformaAttachmentName || `Proforma_${project.quotationCode || 'TCT'}.pdf`}
                                  </p>
                                  <span className="text-[10px] text-slate-500">Documento de cotización oficial</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setShowProformaPreview(true)}
                                  className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Ver Proforma</span>
                                </button>
                                <a
                                  href={project.proformaAttachmentUrl}
                                  download={project.proformaAttachmentName || `Proforma_${project.quotationCode}.pdf`}
                                  className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold border border-slate-300"
                                >
                                  Descargar
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-amber-50/70 border border-dashed border-amber-300 rounded-xl text-center space-y-1">
                              <p className="text-[11px] text-amber-900 font-medium">
                                No se ha adjuntado la imagen o PDF de la proforma enviada.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload button for Proforma */}
                      <div className="pt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleProformaFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-600" />
                          <span>{project.proformaAttachmentUrl ? 'Reemplazar Proforma' : 'Subir Proforma (PDF / Imagen)'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 3: AUDIT LOGS VIEW */}
          {activeTab === 'audit_logs' && (
            <ProjectAuditLogView 
              project={project}
              onUpdateProject={onUpdateProject}
            />
          )}

          {/* TAB 4: TECHNICAL STAFF & EQUIPMENT */}
          {activeTab === 'staff_equipment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Technical Staff */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-500" />
                  Personal Técnico Asignado
                </h4>
                <div className="space-y-1.5 text-xs">
                  {project.assignedStaff && project.assignedStaff.length > 0 ? (
                    project.assignedStaff.map(staff => (
                      <div key={staff.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <div>
                          <span className="font-bold text-slate-900">{staff.name}</span>
                          <span className="block text-[10px] text-slate-500">{staff.role}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-600">{staff.phone}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic p-2">Sin técnicos asignados aún</p>
                  )}
                </div>
              </div>

              {/* Equipment checklist */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-amber-500" />
                  Equipos y Cuerpos Asignados
                </h4>
                <div className="space-y-1.5 text-xs">
                  {project.equipmentList && project.equipmentList.length > 0 ? (
                    project.equipmentList.map(eq => (
                      <div key={eq.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <div>
                          <span className="font-bold text-slate-900">{eq.name}</span>
                          <span className="block text-[10px] text-slate-500">{eq.category} {eq.serialNumber ? `• ${eq.serialNumber}` : ''}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${eq.checkedOut ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {eq.checkedOut ? 'Asignado' : 'Disponible'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic p-2">Sin equipos asignados aún</p>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <span className="text-[11px] text-slate-500 font-medium">
            Última actualización: {new Date(project.updatedAt).toLocaleString()}
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onOpenReportPrint(project)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-amber-400 hover:bg-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exportar PDF Oficial</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
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
                className="p-1 rounded text-slate-400 hover:text-white"
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
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Check-in Modal */}
      {isQrModalOpen && (
        <ProjectQrCheckinModal
          project={project}
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          onUpdateProject={(updated) => {
            onUpdateProject(updated);
          }}
        />
      )}

      {/* Embedded Step Execution Modal if a step is clicked */}
      {selectedStepCoord && (
        <StepExecutionModal
          project={project}
          phaseIndex={selectedStepCoord.phaseIndex}
          stepIndex={selectedStepCoord.stepIndex}
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
