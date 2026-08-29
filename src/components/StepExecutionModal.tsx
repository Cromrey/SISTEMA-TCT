import React, { useState, useRef, useMemo } from 'react';
import { 
  ProductionProject, 
  StepData, 
  StepAttachment, 
  SocialLinksPublishing, 
  ClientConformityAcceptance 
} from '../types';
import { createAuditEntry, appendAuditLog } from '../utils/auditLogger';
import { compressImageFile } from '../utils/imageCompressor';
import { checkStepSequenceStatus, validateStepCompletion, finalizeContractExportStep3 } from '../utils/stepSequenceHelper';
import { getActiveSession } from '../utils/authStorage';
import confetti from 'canvas-confetti';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  ShieldAlert, 
  Save, 
  ExternalLink, 
  HardDrive, 
  Coins,
  Banknote,
  Receipt,
  FileCheck, 
  Sparkles,
  Layers,
  Calendar,
  User,
  Paperclip,
  Upload,
  Trash2,
  Eye,
  Download,
  Lock,
  Unlock,
  AlertTriangle,
  FileText,
  Share2,
  Video,
  Globe,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface StepExecutionModalProps {
  project: ProductionProject;
  phaseIndex: number;
  stepIndex: number;
  currentRole?: 'admin' | 'employee';
  onClose: () => void;
  onSaveStep: (updatedProject: ProductionProject) => void;
}

export const StepExecutionModal: React.FC<StepExecutionModalProps> = ({
  project,
  phaseIndex,
  stepIndex,
  currentRole = 'admin',
  onClose,
  onSaveStep
}) => {
  // Current active step coordinates for navigation
  const [currPhaseIdx, setCurrPhaseIdx] = useState(phaseIndex);
  const [currStepIdx, setCurrStepIdx] = useState(stepIndex);

  // Flatten all 12 steps to check sequential prerequisite and facilitate navigation
  const allSteps: { phaseIdx: number; stepIdx: number; step: StepData }[] = [];
  project.phases.forEach((p, pI) => {
    p.steps.forEach((s, sI) => {
      allSteps.push({ phaseIdx: pI, stepIdx: sI, step: s });
    });
  });

  const currentPhase = project.phases[currPhaseIdx] || project.phases[0];
  const activeStepFromProject = currentPhase?.steps[currStepIdx] || currentPhase?.steps[0];

  const currentStepGlobalIndex = allSteps.findIndex(
    item => item.phaseIdx === currPhaseIdx && item.stepIdx === currStepIdx
  );

  // Check strict sequential status
  const sequenceStatus = checkStepSequenceStatus(project, activeStepFromProject?.stepNumber || 1);
  const isPrerequisiteMet = sequenceStatus.isUnlocked;

  // State for interactive editing
  const [stepData, setStepData] = useState<StepData>({ ...activeStepFromProject });
  const [notes, setNotes] = useState(stepData.notes || '');
  const [adminOverrideLock, setAdminOverrideLock] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Attachments state
  const [attachments, setAttachments] = useState<StepAttachment[]>(stepData.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment state for Step 7 (Cobro 7:00 PM)
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'agreed_extension' | 'unpaid_alert' | 'pending'>(
    stepData.fieldPaymentData?.paymentStatus || 'pending'
  );
  const [amountCollected, setAmountCollected] = useState(
    stepData.fieldPaymentData?.amountCollected || project.finalBalance || 0
  );
  const [paymentMethod, setPaymentMethod] = useState(
    stepData.fieldPaymentData?.paymentMethod || 'Efectivo'
  );
  const [receiptNumber, setReceiptNumber] = useState(
    stepData.fieldPaymentData?.receiptNumber || `REC-TCT-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Ingest state for Step 8 (Resguardo)
  const [sdCardsCount, setSdCardsCount] = useState(stepData.ingestData?.sdCardsCount || 6);
  const [totalGigabytes, setTotalGigabytes] = useState(stepData.ingestData?.totalGigabytes || 380);
  const [serverLocation, setServerLocation] = useState(stepData.ingestData?.serverLocation || `NAS-TCT-STORAGE / ${project.uniqueCode}`);
  const [backupVerified, setBackupVerified] = useState(stepData.ingestData?.backupVerified || false);

  // Social Links state for Step 10 (TikTok, YouTube, Facebook, Dailymotion)
  const [socialTikTok, setSocialTikTok] = useState(stepData.socialLinks?.tiktok || '');
  const [socialYouTube, setSocialYouTube] = useState(stepData.socialLinks?.youtube || '');
  const [socialFacebook, setSocialFacebook] = useState(stepData.socialLinks?.facebook || '');
  const [socialDailymotion, setSocialDailymotion] = useState(stepData.socialLinks?.dailymotion || '');
  const [socialGoogleDrive, setSocialGoogleDrive] = useState(stepData.socialLinks?.googleDrive || '');
  const [socialNotes, setSocialNotes] = useState(stepData.socialLinks?.notes || '');

  // Step 12: Client Conformity Acceptance Form State
  const [conformityAccepted, setConformityAccepted] = useState(
    stepData.conformityAcceptance?.accepted ?? false
  );
  const [clientFullName, setClientFullName] = useState(
    stepData.conformityAcceptance?.clientFullName || project.clientName
  );
  const [clientDni, setClientDni] = useState(
    stepData.conformityAcceptance?.clientDni || ''
  );
  const [acceptanceDate, setAcceptanceDate] = useState(
    stepData.conformityAcceptance?.acceptanceDate || new Date().toISOString().split('T')[0]
  );
  const [purgingAuthorized, setPurgingAuthorized] = useState(
    stepData.conformityAcceptance?.purgingAuthorized ?? false
  );
  const [conformityNotes, setConformityNotes] = useState(
    stepData.conformityAcceptance?.verificationNotes || ''
  );

  // General Links state
  const [linksList, setLinksList] = useState(stepData.links || []);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Synchronize local states when switching steps via Atrás/Adelante
  const syncStepData = (newPhaseIdx: number, newStepIdx: number) => {
    const targetPhase = project.phases[newPhaseIdx];
    const targetStep = targetPhase?.steps[newStepIdx];
    if (!targetPhase || !targetStep) return;

    setCurrPhaseIdx(newPhaseIdx);
    setCurrStepIdx(newStepIdx);
    setStepData({ ...targetStep });
    setNotes(targetStep.notes || '');
    setAttachments(targetStep.attachments || []);
    setValidationError(null);

    // Sync Step 7 Payment
    setPaymentStatus(targetStep.fieldPaymentData?.paymentStatus || 'pending');
    setAmountCollected(targetStep.fieldPaymentData?.amountCollected || project.finalBalance || 0);
    setPaymentMethod(targetStep.fieldPaymentData?.paymentMethod || 'Efectivo');
    setReceiptNumber(targetStep.fieldPaymentData?.receiptNumber || `REC-TCT-${Math.floor(1000 + Math.random() * 9000)}`);

    // Sync Step 8 Ingest
    setSdCardsCount(targetStep.ingestData?.sdCardsCount || 6);
    setTotalGigabytes(targetStep.ingestData?.totalGigabytes || 380);
    setServerLocation(targetStep.ingestData?.serverLocation || `NAS-TCT-STORAGE / ${project.uniqueCode}`);
    setBackupVerified(targetStep.ingestData?.backupVerified || false);

    // Sync Step 10 Social
    setSocialTikTok(targetStep.socialLinks?.tiktok || '');
    setSocialYouTube(targetStep.socialLinks?.youtube || '');
    setSocialFacebook(targetStep.socialLinks?.facebook || '');
    setSocialDailymotion(targetStep.socialLinks?.dailymotion || '');
    setSocialGoogleDrive(targetStep.socialLinks?.googleDrive || '');
    setSocialNotes(targetStep.socialLinks?.notes || '');

    // Sync Step 12 Conformity
    setConformityAccepted(targetStep.conformityAcceptance?.accepted ?? false);
    setClientFullName(targetStep.conformityAcceptance?.clientFullName || project.clientName);
    setClientDni(targetStep.conformityAcceptance?.clientDni || '');
    setAcceptanceDate(targetStep.conformityAcceptance?.acceptanceDate || new Date().toISOString().split('T')[0]);
    setPurgingAuthorized(targetStep.conformityAcceptance?.purgingAuthorized ?? false);
    setConformityNotes(targetStep.conformityAcceptance?.verificationNotes || '');

    // Sync Links
    setLinksList(targetStep.links || []);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const handleNavigatePrevStep = () => {
    if (currentStepGlobalIndex > 0) {
      const prev = allSteps[currentStepGlobalIndex - 1];
      syncStepData(prev.phaseIdx, prev.stepIdx);
    }
  };

  const handleNavigateNextStep = () => {
    if (currentStepGlobalIndex < allSteps.length - 1) {
      const next = allSteps[currentStepGlobalIndex + 1];
      syncStepData(next.phaseIdx, next.stepIdx);
    }
  };

  const isLocked = !isPrerequisiteMet && !adminOverrideLock;
  const isReadOnly = sequenceStatus.isReadOnly && !adminOverrideLock;
  const prevStepItem = currentStepGlobalIndex > 0 ? allSteps[currentStepGlobalIndex - 1] : null;
  const isEarlyStep = stepData.stepNumber === 1 || stepData.stepNumber === 2 || stepData.stepNumber === 3;
  const isEmployeeUploadLocked = isEarlyStep && attachments.length > 0 && currentRole !== 'admin';
  const isAdmin = currentRole === 'admin';

  const handleToggleChecklist = (checkId: string) => {
    if (isLocked) return;
    if (!stepData.checklist) return;
    const updated = stepData.checklist.map(c => {
      if (c.id === checkId) {
        return {
          ...c,
          completed: !c.completed,
          completedAt: !c.completed ? new Date().toLocaleTimeString() : undefined
        };
      }
      return c;
    });

    const allDone = updated.every(c => c.completed);
    setStepData({
      ...stepData,
      checklist: updated,
      status: allDone ? 'completed' : 'in_progress'
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachmentsList: StepAttachment[] = [];
    const activeSession = getActiveSession();
    const currentUploader = activeSession?.fullName || (currentRole === 'admin' ? 'Michael Romero (Administrador TCT)' : 'Técnico de Producción TCT');
    const now = new Date();
    const formattedDateTime = now.toLocaleDateString('es-PE') + ' ' + now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { dataUrl, sizeFormatted } = await compressImageFile(file, 1200, 0.75);
        if (dataUrl) {
          newAttachmentsList.push({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${i}`,
            name: file.name,
            type: file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document',
            size: sizeFormatted,
            dataUrl: dataUrl,
            uploadedAt: formattedDateTime,
            uploadedBy: currentUploader
          });
        }
      } catch (err) {
        console.warn('Error processing attachment:', err);
      }
    }

    if (newAttachmentsList.length > 0) {
      setAttachments(prev => [...prev, ...newAttachmentsList]);
    }
    setIsUploading(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    const newLink = {
      label: newLinkLabel.trim() || 'Enlace Corporación TCT',
      url: newLinkUrl.trim(),
      platform: (newLinkUrl.includes('youtube') ? 'youtube' : newLinkUrl.includes('tiktok') ? 'tiktok' : newLinkUrl.includes('facebook') ? 'facebook' : newLinkUrl.includes('dailymotion') ? 'dailymotion' : newLinkUrl.includes('drive') ? 'drive' : 'other') as any
    };
    setLinksList([...linksList, newLink]);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  // Download Printable Acta de Conformidad (Step 12)
  const handleDownloadActaConformidad = () => {
    const textActa = `
================================================================================
CORPORACIÓN TCT - ACTA OFICIAL DE CONFORMIDAD Y AUTORIZACIÓN DE DEPURACIÓN
================================================================================
CÓDIGO DE PRODUCCIÓN: ${project.uniqueCode}
CÓDIGO DE COTIZACIÓN: ${project.quotationCode || 'N/A'}
N° DE CONTRATO:       ${project.contractNumber}
CLIENTE:              ${clientFullName || project.clientName}
DNI / RUC:            ${clientDni || '__________________'}
EVENTO:               ${project.eventType} - ${project.title}
FECHA DEL EVENTO:     ${project.eventDate}
FECHA DE RECEPCIÓN:   ${acceptanceDate}
ASESOR RESPONSABLE:   ${project.contractHolder || 'Corporación TCT'}

DECLARACIÓN DEL CLIENTE:
1. El suscrito declara haber recibido a entera y total satisfacción la entrega final de 
   los materiales audiovisuales correspondientes al contrato (Memoria USB con Video Final,
   Trailers en Alta Resolución, y Fotolibro Impreso si corresponde).
2. Se deja constancia de que el saldo económico se encuentra cancelado en S/. 0.00.
3. Transcurridos los 30 días calendarios de resguardo técnico de seguridad, el cliente 
   AUTORIZA EXPRESAMENTE a Corporación TCT a proceder con la eliminación y depuración 
   definitiva del material RAW/bruto de sus servidores centrales para liberar almacenamiento.

FIRMA DEL CLIENTE: _________________________       FIRMA TCT: _________________________
DNI: ${clientDni || '__________________'}                 CORPORACIÓN TCT
FECHA: ${acceptanceDate}
================================================================================
    `.trim();

    const blob = new Blob([textActa], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACTA-CONFORMIDAD-TCT-${project.uniqueCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    // 1. Check sequence lock
    if (isLocked && !adminOverrideLock) {
      setValidationError('Este paso está bloqueado. Debe culminar el paso anterior según la secuencia obligatoria.');
      return;
    }

    let finalStatus: 'pending' | 'in_progress' | 'completed' = stepData.status;
    let resolvedChecklist = stepData.checklist ? [...stepData.checklist] : [];

    const allChecklistDone = resolvedChecklist.length > 0 
      ? resolvedChecklist.every(c => c.completed) 
      : false;

    if (allChecklistDone) {
      finalStatus = 'completed';
    }

    // Step 3: if attachment is uploaded or checklist is filled, allow completing
    if (stepData.stepNumber === 3 && (attachments.length > 0 || allChecklistDone || project.contractExported)) {
      resolvedChecklist = resolvedChecklist.map(c => ({
        ...c,
        completed: true,
        completedAt: c.completedAt || new Date().toLocaleTimeString()
      }));
      finalStatus = 'completed';
    }

    // Step 7: if paymentStatus is paid or agreed_extension or balance is 0, allow completing
    if (stepData.stepNumber === 7 && (paymentStatus === 'paid' || paymentStatus === 'agreed_extension' || project.finalBalance === 0)) {
      resolvedChecklist = resolvedChecklist.map(c => ({
        ...c,
        completed: true,
        completedAt: c.completedAt || new Date().toLocaleTimeString()
      }));
      finalStatus = 'completed';
    }

    // Prepare Step 10 Social Links Object
    const socialLinksData: SocialLinksPublishing = {
      tiktok: socialTikTok.trim() || undefined,
      youtube: socialYouTube.trim() || undefined,
      facebook: socialFacebook.trim() || undefined,
      dailymotion: socialDailymotion.trim() || undefined,
      googleDrive: socialGoogleDrive.trim() || undefined,
      notes: socialNotes.trim() || undefined
    };

    // Prepare Step 12 Conformity Acceptance Object with Audit Log
    const auditId = stepData.conformityAcceptance?.auditRecordId || 
      `AUDIT-TCT-${new Date().getFullYear()}-CONF-${Math.floor(1000 + Math.random() * 9000)}`;

    const conformityData: ClientConformityAcceptance = {
      accepted: conformityAccepted,
      clientFullName: clientFullName.trim(),
      clientDni: clientDni.trim(),
      acceptanceDate: acceptanceDate,
      purgingAuthorized: purgingAuthorized,
      verificationNotes: conformityNotes.trim(),
      auditRecordId: auditId,
      auditTimestamp: stepData.conformityAcceptance?.auditTimestamp || new Date().toISOString(),
      auditOfficerName: project.contractHolder || 'Oficial de Entrega TCT',
      serverFilesPurged: purgingAuthorized,
      deliverablesConfirmed: {
        usbDelivered: true,
        photobookDelivered: project.includesPhotobook,
        digitalGalleryDelivered: true,
        rawPurgeAuthorized: purgingAuthorized
      }
    };

    const currentFieldPaymentData = stepData.stepNumber === 7 ? {
      paymentStatus,
      amountCollected: Number(amountCollected) || 0,
      paymentMethod: paymentMethod as any,
      receiptNumber: receiptNumber || `REC-TCT-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      technicianInCharge: project.contractHolder || 'Carlos Mendoza (Director TCT)'
    } : stepData.fieldPaymentData;

    const currentIngestData = stepData.stepNumber === 8 ? {
      sdCardsCount: Number(sdCardsCount) || 1,
      totalGigabytes: Number(totalGigabytes) || 100,
      serverLocation: serverLocation || `NAS-TCT-STORAGE / ${project.uniqueCode}`,
      backupVerified: Boolean(backupVerified),
      technicianName: 'Pedro Alva (Técnico Ingest TCT)',
      backupDate: new Date().toISOString().split('T')[0]
    } : stepData.ingestData;

    const activeSession = getActiveSession();
    const currentUserName = activeSession?.fullName || (currentRole === 'admin' ? 'Michael Romero (Administrador TCT)' : 'Técnico de Producción TCT');
    const nowFormatted = new Date().toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const candidateStep: StepData = {
      ...stepData,
      status: finalStatus,
      checklist: resolvedChecklist,
      notes,
      attachments,
      links: linksList,
      socialLinks: stepData.stepNumber === 10 ? socialLinksData : stepData.socialLinks,
      conformityAcceptance: stepData.stepNumber === 12 ? conformityData : stepData.conformityAcceptance,
      fieldPaymentData: currentFieldPaymentData,
      ingestData: currentIngestData,
      completedAt: finalStatus === 'completed' ? (stepData.completedAt || nowFormatted) : undefined,
      completedBy: finalStatus === 'completed' ? (stepData.completedBy || currentUserName) : undefined,
      lastUpdatedAt: nowFormatted,
      lastUpdatedBy: currentUserName,
      responsibleStaff: stepData.responsibleStaff || currentUserName
    };

    // 2. Validate step requirements if trying to mark completed
    if (finalStatus === 'completed' && !adminOverrideLock) {
      const validation = validateStepCompletion(candidateStep, project);
      if (!validation.canComplete && validation.errorMessages.length > 0) {
        setValidationError(`Requisitos pendientes: ${validation.errorMessages.join(' | ')}`);
        return;
      }
    }

    setValidationError(null);

    const updatedPhases = [...project.phases];
    const targetPhase = { ...updatedPhases[currPhaseIdx] };
    const targetSteps = [...targetPhase.steps];

    targetSteps[currStepIdx] = candidateStep;
    targetPhase.steps = targetSteps;
    updatedPhases[currPhaseIdx] = targetPhase;

    // Synchronize overall project state if step 7 was paid
    let updatedFieldPayment = project.fieldPayment;
    let updatedFinalBalance = project.finalBalance;
    if (stepData.stepNumber === 7 && (paymentStatus === 'paid' || paymentStatus === 'agreed_extension')) {
      updatedFieldPayment = Number(amountCollected) || project.finalBalance || 0;
      updatedFinalBalance = Math.max(0, project.totalBudget - project.initialDeposit - updatedFieldPayment);
    }

    // If step 12 conformity is accepted and purging authorized, mark server deleted
    let updatedIsDeleted = project.isDeletedFromServers;
    let updatedPurgedAt = project.purgedAt;
    if (stepData.stepNumber === 12 && conformityAccepted && purgingAuthorized) {
      updatedIsDeleted = true;
      updatedPurgedAt = new Date().toISOString().split('T')[0];
    }

    // Automatically enable next step in sequence if current step is completed
    if (finalStatus === 'completed' && currentStepGlobalIndex + 1 < allSteps.length) {
      const nextStepInfo = allSteps[currentStepGlobalIndex + 1];
      const nextPhase = updatedPhases[nextStepInfo.phaseIdx];
      if (nextPhase && nextPhase.steps[nextStepInfo.stepIdx]) {
        if (nextPhase.steps[nextStepInfo.stepIdx].status === 'pending') {
          const nextStepsList = [...nextPhase.steps];
          nextStepsList[nextStepInfo.stepIdx] = {
            ...nextStepsList[nextStepInfo.stepIdx],
            status: 'in_progress'
          };
          updatedPhases[nextStepInfo.phaseIdx] = {
            ...nextPhase,
            steps: nextStepsList
          };
        }
      }
    }

    let updatedProject: ProductionProject = {
      ...project,
      phases: updatedPhases,
      fieldPayment: updatedFieldPayment,
      finalBalance: updatedFinalBalance,
      isDeletedFromServers: updatedIsDeleted,
      purgedAt: updatedPurgedAt,
      updatedAt: new Date().toISOString()
    };

    // Check if steps 1, 2, 3 all have attachments uploaded to clear contractPendingAttachment
    const step1Obj = updatedPhases[0]?.steps?.find(s => s.stepNumber === 1);
    const step2Obj = updatedPhases[0]?.steps?.find(s => s.stepNumber === 2);
    const step3Obj = updatedPhases[0]?.steps?.find(s => s.stepNumber === 3);

    const s1Has = Boolean((step1Obj?.attachments && step1Obj.attachments.length > 0) || project.proformaAttachmentUrl || (stepData.stepNumber === 1 && attachments.length > 0));
    const s2Has = Boolean((step2Obj?.attachments && step2Obj.attachments.length > 0) || project.depositReceiptUrl || (stepData.stepNumber === 2 && attachments.length > 0));
    const s3Has = Boolean((step3Obj?.attachments && step3Obj.attachments.length > 0) || (stepData.stepNumber === 3 && attachments.length > 0) || project.contractExported);

    if (s1Has && s2Has && s3Has) {
      updatedProject.contractPendingAttachment = false;
    }

    // Step 3 completion special flow: finalize contract export, lock initial commercial, unlock step 4, set exactly 25.00%
    if (stepData.stepNumber === 3 && finalStatus === 'completed') {
      updatedProject.contractExported = true;
      updatedProject.contractExportDate = updatedProject.contractExportDate || new Date().toISOString();
      updatedProject.initialCommercialLocked = true;
      if (s1Has && s2Has && s3Has) {
        updatedProject.contractPendingAttachment = false;
      }
    }

    // Generate Audit Log Entry
    const actionType = finalStatus === 'completed' ? 'step_completed' : 'step_updated';
    const auditTitle = finalStatus === 'completed'
      ? `Paso ${stepData.stepNumber} Completado: ${stepData.title}`
      : `Paso ${stepData.stepNumber} Actualizado: ${stepData.title}`;
    
    let auditDesc = `Se guardaron cambios en el flujo de trabajo (Estado: ${finalStatus.toUpperCase()}).`;
    if (stepData.stepNumber === 3 && finalStatus === 'completed') {
      auditDesc = `Paso 3 culminado. Contrato formalizado y avance establecido en 25.00%. Paso 4 habilitado.`;
    } else if (stepData.stepNumber === 7 && paymentStatus === 'paid') {
      auditDesc = `Cobro obligatorio de campo registrado: S/. ${amountCollected.toLocaleString()} (${paymentMethod}) - Recibo: ${receiptNumber}`;
    } else if (stepData.stepNumber === 8 && backupVerified) {
      auditDesc = `Ingest verificado en NAS: ${sdCardsCount} tarjetas SD (${totalGigabytes} GB) respaldadas con éxito.`;
    } else if (stepData.stepNumber === 10 && (socialTikTok || socialYouTube || socialFacebook)) {
      auditDesc = `Enlaces oficiales de difusión en redes sociales publicados y verificados.`;
    } else if (stepData.stepNumber === 12 && conformityAccepted) {
      auditDesc = `Acta de Conformidad Final firmada por ${clientFullName} (DNI: ${clientDni}). Depuración de RAWs ${purgingAuthorized ? 'Autorizada' : 'No autorizada'}.`;
    }

    const newAuditLog = createAuditEntry({
      userName: project.contractHolder || 'Ing. Roberto Acuña (Admin)',
      userRole: 'admin',
      action: stepData.stepNumber === 7 && paymentStatus === 'paid' 
        ? 'field_payment_registered' 
        : stepData.stepNumber === 8 && backupVerified
        ? 'ingest_logged'
        : stepData.stepNumber === 12 && conformityAccepted
        ? 'conformity_signed'
        : actionType,
      title: auditTitle,
      description: auditDesc,
      stepNumber: stepData.stepNumber,
      phaseNumber: currentPhase.phaseNumber,
      metadata: {
        estado: finalStatus,
        adjuntos: attachments.length,
        itemsCompletados: stepData.checklist 
          ? `${stepData.checklist.filter(c => c.completed).length}/${stepData.checklist.length}`
          : 'N/A'
      }
    });

    updatedProject = appendAuditLog(updatedProject, newAuditLog);

    if (finalStatus === 'completed') {
      try {
        confetti({ particleCount: 50, spread: 50 });
      } catch (e) {}
    }

    onSaveStep(updatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
        
        {/* Header with Navigation Icons (Atrás, Adelante, Salir) in top-right */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base shadow-md shrink-0 ${
              stepData.status === 'completed' 
                ? 'bg-emerald-500 text-slate-950' 
                : stepData.status === 'in_progress' 
                ? 'bg-amber-500 text-slate-950' 
                : 'bg-slate-700 text-slate-300'
            }`}>
              {stepData.stepNumber}
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide truncate">
                  Fase {currentPhase.phaseNumber}: {currentPhase.name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                  stepData.status === 'completed' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : stepData.status === 'in_progress' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {stepData.status === 'completed' ? 'Completado' : stepData.status === 'in_progress' ? 'En Ejecución' : 'Pendiente'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white mt-0.5 truncate">
                {stepData.title}
              </h2>
            </div>
          </div>

          {/* Navigation Controls in Top-Right Header */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Atrás Button */}
            <button
              type="button"
              onClick={handleNavigatePrevStep}
              disabled={currentStepGlobalIndex === 0}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1 transition-all ${
                currentStepGlobalIndex > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 hover:border-amber-400/50 cursor-pointer shadow-xs active:scale-95'
                  : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
              }`}
              title={currentStepGlobalIndex > 0 ? `Paso anterior: Paso ${allSteps[currentStepGlobalIndex - 1].step.stepNumber}` : 'Primer paso'}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Atrás</span>
            </button>

            {/* Adelante Button */}
            <button
              type="button"
              onClick={handleNavigateNextStep}
              disabled={currentStepGlobalIndex >= allSteps.length - 1}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1 transition-all ${
                currentStepGlobalIndex < allSteps.length - 1
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 hover:border-amber-400/50 cursor-pointer shadow-xs active:scale-95'
                  : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
              }`}
              title={currentStepGlobalIndex < allSteps.length - 1 ? `Paso siguiente: Paso ${allSteps[currentStepGlobalIndex + 1].step.stepNumber}` : 'Último paso'}
            >
              <span className="hidden sm:inline">Adelante</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Salir / Cerrar Button */}
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

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          
          {/* Validation Error Alert */}
          {validationError && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-900 shadow-sm animate-shake">
              <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-black block text-red-950">Validación de Secuencia Didáctica Requerida:</strong>
                <span>{validationError}</span>
              </div>
            </div>
          )}

          {/* Read Only Notice for Completed Prior Steps */}
          {isReadOnly && (
            <div className="bg-slate-100 border border-slate-300 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Paso completado previamente y formalizado en la secuencia de producción.</span>
              </div>
              <button
                type="button"
                onClick={() => setAdminOverrideLock(true)}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
              >
                Habilitar edición excepcional
              </button>
            </div>
          )}
          
          {/* Prerequisite Sequential Warning */}
          {isLocked && prevStepItem && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-amber-950 text-xs sm:text-sm">
                    Paso Bloqueado por Secuencia Didáctica TCT
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Para habilitar el <strong>Paso {stepData.stepNumber}</strong>, primero se debe haber completado y registrado con éxito el <strong>Paso {prevStepItem.step.stepNumber} ({prevStepItem.step.title})</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between">
                <span className="text-[11px] text-amber-800 italic">
                  Estado previo: <strong>{prevStepItem.step.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setAdminOverrideLock(true)}
                  className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Desbloqueo de Emergencia (Admin)</span>
                </button>
              </div>
            </div>
          )}

          {adminOverrideLock && (
            <div className="bg-blue-50 border border-blue-300 p-2.5 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <span>🔓 Desbloqueo manual activo por Dirección TCT.</span>
              <button 
                onClick={() => setAdminOverrideLock(false)}
                className="text-[10px] text-blue-700 underline font-bold"
              >
                Re-aplicar bloqueo
              </button>
            </div>
          )}

          {/* Project Quick Info Strip */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-500 font-medium">Producción: </span>
              <span className="font-extrabold text-slate-900">{project.title}</span>
              <div className="flex items-center gap-2 mt-1">
                {project.quotationCode && (
                  <span className="font-mono text-[10px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                    {project.quotationCode}
                  </span>
                )}
                <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                  {project.contractNumber}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium block">Fecha & Asesor:</span>
              <span className="font-bold text-slate-800">{project.eventDate}</span>
              <span className="text-[10px] text-blue-700 block font-semibold">{project.contractHolder || 'TCT'}</span>
            </div>
          </div>

          {/* STEP 7 SPECIAL: REGLA DE COBRO EN CAMPO (LÍMITE 7:00 PM) */}
          {stepData.stepNumber === 7 && (
            <div className="rounded-2xl border-2 border-red-500 bg-red-50/50 p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-red-600 text-white shrink-0 shadow-md">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-red-950 text-sm tracking-wide flex items-center gap-1.5">
                    CLÁUSULA ESTRICTA DE COBRO EN CAMPO (Límite: 7:00 PM)
                  </h4>
                  <p className="text-xs text-red-800 mt-1">
                    Regla de oro de Corporación TCT: Todo evento debe liquidar el saldo acordado en Soles (S/.) antes de las 7:00 PM del día del evento.
                  </p>
                </div>
              </div>

              {/* Strict Decision Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setPaymentStatus('paid')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    paymentStatus === 'paid'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                      : 'bg-white text-slate-800 border-slate-300 hover:border-emerald-500'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2 font-black text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✔ SI CANCELA / ACUERDA</span>
                  </div>
                  <p className={`text-[11px] mt-1 ${paymentStatus === 'paid' ? 'text-emerald-100' : 'text-slate-500'}`}>
                    El equipo continúa la filmación hasta culminar todo el evento contratado.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setPaymentStatus('unpaid_alert')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    paymentStatus === 'unpaid_alert'
                      ? 'bg-red-700 text-white border-red-800 shadow-md'
                      : 'bg-white text-slate-800 border-slate-300 hover:border-red-500'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-2 font-black text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>✖ SI NO CANCELA SIN ACUERDO</span>
                  </div>
                  <p className={`text-[11px] mt-1 ${paymentStatus === 'unpaid_alert' ? 'text-red-100' : 'text-slate-500'}`}>
                    Retiro inmediato del personal técnico de Corporación TCT con acta y reporte a Dirección.
                  </p>
                </button>
              </div>

              {/* Payment Details Form */}
              {paymentStatus === 'paid' && (
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Monto Cobrado en Soles (S/.)</label>
                    <input
                      type="number"
                      disabled={isLocked}
                      value={amountCollected}
                      onChange={(e) => setAmountCollected(Number(e.target.value))}
                      className="w-full p-2 border rounded-lg bg-emerald-50/50 font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Medio de Pago</label>
                    <select
                      disabled={isLocked}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full p-2 border rounded-lg bg-white font-medium"
                    >
                      <option value="Efectivo">Efectivo en mano</option>
                      <option value="Transferencia">Transferencia Bancaria (BCP/BBVA)</option>
                      <option value="Yape/Plin">Yape / Plin</option>
                      <option value="Tarjeta">Tarjeta POS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">N° Comprobante / Recibo</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 8 SPECIAL: RESGUARDO DE MATERIAL (INGEST EN SERVIDOR) */}
          {stepData.stepNumber === 8 && (
            <div className="rounded-2xl border-2 border-yellow-400 bg-yellow-50/50 p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-yellow-500 text-slate-950 shrink-0 shadow-md">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    RESGUARDO DE MATERIAL (INGEST EN SERVIDORES TCT)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Retorno inmediato a oficinas y respaldo seguro de tarjetas SD de video 4K y fotos en el Storage RAID.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-yellow-300">
                  <label className="block text-slate-600 font-bold mb-1">Tarjetas SD Respaldadas</label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={sdCardsCount}
                    onChange={(e) => setSdCardsCount(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-black text-slate-900"
                    placeholder="Ej: 6 tarjetas"
                  />
                </div>
                <div className="bg-white p-3 rounded-xl border border-yellow-300">
                  <label className="block text-slate-600 font-bold mb-1">Total Gigabytes (GB)</label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={totalGigabytes}
                    onChange={(e) => setTotalGigabytes(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-black text-slate-900"
                    placeholder="Ej: 480 GB"
                  />
                </div>
                <div className="bg-white p-3 rounded-xl border border-yellow-300 flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isLocked}
                      checked={backupVerified}
                      onChange={(e) => setBackupVerified(e.target.checked)}
                      className="w-4 h-4 text-yellow-600 rounded"
                    />
                    <span className="font-bold text-slate-900 text-xs">Copia Verificada 100% en RAID</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9 SPECIAL: EDICIÓN Y ENTREGA EN USB (15 DÍAS HÁBILES - SALDO EN S/. 0.00) */}
          {stepData.stepNumber === 9 && (
            <div className="rounded-2xl border-2 border-purple-400 bg-purple-50/50 p-4 space-y-2">
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 font-black text-xs">
                  PLAZO: 15 DÍAS HÁBILES
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                  project.finalBalance === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {project.finalBalance === 0 ? '✅ SALDO VERIFICADO EN S/. 0.00' : `⚠️ SALDO PENDIENTE: S/. ${project.finalBalance.toLocaleString()}`}
                </span>
              </div>
              <p className="text-xs text-purple-900 font-medium">
                Regla Corporación TCT: No se autoriza la entrega física del USB en estuche corporativo si existe algún saldo pendiente mayor a S/. 0.00.
              </p>
            </div>
          )}

          {/* STEP 10 SPECIAL: REDES SOCIALES (TIKTOK, YOUTUBE, FACEBOOK, DAILYMOTION) */}
          {stepData.stepNumber === 10 && (
            <div className="rounded-2xl border-2 border-indigo-400 bg-indigo-50/50 p-4 sm:p-5 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-md">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-indigo-950 text-sm">
                    PUBLICACIÓN EN INTERNET & REDES SOCIALES OFICIALES TCT
                  </h4>
                  <p className="text-xs text-indigo-800 mt-0.5">
                    Habilita y registra los enlaces oficiales de difusión multimedia para TikTok, YouTube, Facebook, Dailymotion y la nube del cliente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                {/* TikTok Link */}
                <div className="bg-white p-3 rounded-xl border border-slate-300">
                  <label className="block text-slate-700 font-black mb-1 flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-black text-white text-[9px] flex items-center justify-center font-bold">TT</span>
                    Link de TikTok (@corporaciontct)
                  </label>
                  <input
                    type="url"
                    disabled={isLocked}
                    value={socialTikTok}
                    onChange={(e) => setSocialTikTok(e.target.value)}
                    placeholder="https://www.tiktok.com/@corporaciontct/video/..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                  {socialTikTok && (
                    <a href={socialTikTok} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 mt-1 font-bold">
                      <ExternalLink className="w-3 h-3" /> Probar enlace TikTok
                    </a>
                  )}
                </div>

                {/* YouTube Link */}
                <div className="bg-white p-3 rounded-xl border border-slate-300">
                  <label className="block text-slate-700 font-black mb-1 flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-red-600 text-white text-[9px] flex items-center justify-center font-bold">YT</span>
                    Link de YouTube (Trailer / 4K)
                  </label>
                  <input
                    type="url"
                    disabled={isLocked}
                    value={socialYouTube}
                    onChange={(e) => setSocialYouTube(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                  {socialYouTube && (
                    <a href={socialYouTube} target="_blank" rel="noopener noreferrer" className="text-[11px] text-red-600 hover:underline flex items-center gap-1 mt-1 font-bold">
                      <ExternalLink className="w-3 h-3" /> Probar enlace YouTube
                    </a>
                  )}
                </div>

                {/* Facebook Link */}
                <div className="bg-white p-3 rounded-xl border border-slate-300">
                  <label className="block text-slate-700 font-black mb-1 flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">FB</span>
                    Link de Facebook (Post Oficial)
                  </label>
                  <input
                    type="url"
                    disabled={isLocked}
                    value={socialFacebook}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                    placeholder="https://www.facebook.com/CorporacionTCT/posts/..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                  {socialFacebook && (
                    <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-bold">
                      <ExternalLink className="w-3 h-3" /> Probar enlace Facebook
                    </a>
                  )}
                </div>

                {/* DailyMotion Link */}
                <div className="bg-white p-3 rounded-xl border border-slate-300">
                  <label className="block text-slate-700 font-black mb-1 flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-sky-600 text-white text-[9px] flex items-center justify-center font-bold">DM</span>
                    Link de Dailymotion (Canal Corporativo)
                  </label>
                  <input
                    type="url"
                    disabled={isLocked}
                    value={socialDailymotion}
                    onChange={(e) => setSocialDailymotion(e.target.value)}
                    placeholder="https://www.dailymotion.com/video/..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                  {socialDailymotion && (
                    <a href={socialDailymotion} target="_blank" rel="noopener noreferrer" className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 mt-1 font-bold">
                      <ExternalLink className="w-3 h-3" /> Probar enlace Dailymotion
                    </a>
                  )}
                </div>
              </div>

              {/* Cloud Drive folder */}
              <div className="bg-white p-3 rounded-xl border border-slate-300 text-xs">
                <label className="block text-slate-700 font-bold mb-1">
                  Enlace de Carpeta Cloud / Google Drive (Entrega Digital al Cliente)
                </label>
                <input
                  type="url"
                  disabled={isLocked}
                  value={socialGoogleDrive}
                  onChange={(e) => setSocialGoogleDrive(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

            </div>
          )}

          {/* STEP 12 SPECIAL: FORMATO DE CONFORMIDAD DEL CLIENTE & AUTORIZACIÓN DE DEPURACIÓN */}
          {stepData.stepNumber === 12 && (
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-md">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 uppercase">
                      Paso 12 • Cierre Técnico Definitivo
                    </span>
                    <h4 className="font-black text-emerald-950 text-sm sm:text-base mt-0.5">
                      ACTA DE CONFORMIDAD DE ENTREGA & AUTORIZACIÓN DE DEPURACIÓN
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      El cliente acepta formalmente la entrega final de USB, fotolibro y videos, y autoriza la eliminación de los archivos RAW del servidor tras los 30 días reglamentarios.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadActaConformidad}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Acta (.txt/pdf)</span>
                </button>
              </div>

              {/* Formal Confirmation Checkboxes */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-300 space-y-3 text-xs">
                
                <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/50 transition-colors">
                  <input
                    type="checkbox"
                    disabled={isLocked}
                    checked={conformityAccepted}
                    onChange={(e) => setConformityAccepted(e.target.checked)}
                    className="mt-0.5 w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-extrabold text-emerald-950 block">
                      1. Conformidad Total de Entrega de Trabajos Finales
                    </span>
                    <span className="text-slate-600 text-[11px] block mt-0.5">
                      El cliente manifiesta su completa satisfacción con los videos editados, memorias USB corporativas y fotolibro físico recibido. Saldo verificado en S/. 0.00.
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-xl bg-amber-50/60 hover:bg-amber-100/50 transition-colors">
                  <input
                    type="checkbox"
                    disabled={isLocked}
                    checked={purgingAuthorized}
                    onChange={(e) => setPurgingAuthorized(e.target.checked)}
                    className="mt-0.5 w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-extrabold text-amber-950 block">
                      2. Autorización Expresa para Eliminación / Depuración de Servidores
                    </span>
                    <span className="text-slate-600 text-[11px] block mt-0.5">
                      El cliente autoriza a Corporación TCT a purgar y eliminar definitivamente el material RAW/bruto de los servidores NAS tras cumplir los 30 días de resguardo.
                    </span>
                  </div>
                </label>

                {/* Signee Identification */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nombre Completo del Cliente / Firmante</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={clientFullName}
                      onChange={(e) => setClientFullName(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">DNI / RUC del Cliente</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={clientDni}
                      onChange={(e) => setClientDni(e.target.value)}
                      placeholder="Ej: 47891234"
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Fecha de Conformidad</label>
                    <input
                      type="date"
                      disabled={isLocked}
                      value={acceptanceDate}
                      onChange={(e) => setAcceptanceDate(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Observaciones del Acta de Conformidad</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={conformityNotes}
                    onChange={(e) => setConformityNotes(e.target.value)}
                    placeholder="Ej. Firmó acta física y recibió estuche con USB y 2 fotolibros..."
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Audit Record Summary Box */}
                {(conformityAccepted || stepData.conformityAcceptance?.accepted) && (
                  <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Registro de Auditoría de Conformidad Generado
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {stepData.conformityAcceptance?.auditRecordId || 'ID AUDITORÍA PENDIENTE DE GUARDAR'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Oficial Responsable:</span>
                        <span className="font-bold">{project.contractHolder || 'Carlos Mendoza (Director TCT)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Autorización Purga NAS:</span>
                        <span className={`font-bold ${purgingAuthorized ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {purgingAuthorized ? '✓ Autorizada (30 días cumplidos)' : '⏳ No autorizada aún'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Saldo Verificado:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          S/. {project.finalBalance.toLocaleString()} (Liquidado)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Checklist Section */}
          {stepData.checklist && stepData.checklist.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Checklist Obligatorio del Paso {stepData.stepNumber}
                </h4>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  {stepData.checklist.filter(c => c.completed).length} de {stepData.checklist.length} verificados ({Math.round((stepData.checklist.filter(c => c.completed).length / stepData.checklist.length) * 100)}%)
                </span>
              </div>
              <div className="space-y-2">
                {stepData.checklist.map((item, idx) => (
                  <label
                    key={item.id || `chk-${stepData.stepNumber}-${idx}`}
                    className={`flex items-start space-x-3 p-3 rounded-xl border transition-all ${
                      item.completed 
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2 mt-0.5 shrink-0">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                        item.completed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <input
                        type="checkbox"
                        disabled={isLocked}
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(item.id)}
                        className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 text-xs">
                      <span className={`font-semibold block ${item.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {item.text}
                      </span>
                      {item.completed && (
                        <span className="block text-[10px] text-emerald-700 font-medium mt-0.5">
                          ✓ Verificado {item.completedAt ? `a las ${item.completedAt}` : ''}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ATTACHMENTS SECTION (Files / Proof / Photos / Receipts / Signed Formats) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-amber-500" />
                Archivos Adjuntos & Evidencias del Paso ({attachments.length})
              </h4>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple={!isEarlyStep}
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  id={`file-upload-${stepData.stepNumber}`}
                  disabled={isLocked || isEmployeeUploadLocked}
                />
                {isEmployeeUploadLocked ? (
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Archivo Adjuntado (Subida Única Completada)</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isLocked || isEmployeeUploadLocked}
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                      isLocked || isEmployeeUploadLocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {isEarlyStep ? 'Subir Archivo / Sustento (Subida Única)' : 'Subir Archivo / Foto / Acta Firmada'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {attachments.length === 0 ? (
              <div 
                onClick={() => !isLocked && !isEmployeeUploadLocked && fileInputRef.current?.click()}
                className={`p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1 ${
                  isLocked || isEmployeeUploadLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/30'
                }`}
              >
                <Upload className="w-5 h-5 text-slate-300" />
                <span>Arrastra o haz clic para adjuntar comprobantes, contratos o fotos de este paso</span>
                <span className="text-[10px] text-slate-400">
                  {isEarlyStep 
                    ? '(Habilitado para empleados: 1 sola subida permitida. Formatos: JPG, PNG, PDF)' 
                    : '(Formatos soportados: JPG, PNG, PDF, DOCX)'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att, attIdx) => (
                  <div key={att.id || `att-${att.name}-${attIdx}`} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center space-x-2 truncate pr-2">
                      {att.type === 'image' ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-300">
                          <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-bold text-slate-800 block truncate">{att.name}</span>
                        <span className="text-[10px] text-slate-500">{att.size} • {att.uploadedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <a
                        href={att.dataUrl}
                        download={att.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                        title="Ver / Descargar"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1 rounded bg-white hover:bg-red-100 text-red-600 border border-slate-200"
                          title="Eliminar (Solo Administrador)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-indigo-600" />
              Enlaces & Entregables Digitales
            </h4>
            <div className="space-y-2">
              {linksList.map((l, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-bold text-slate-800">{l.label}:</span>
                    <a 
                      href={l.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline truncate"
                    >
                      {l.url}
                    </a>
                  </div>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold shrink-0 text-[11px] flex items-center gap-1"
                  >
                    Abrir <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="Etiqueta (ej: Video YouTube TCT)"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  className="w-1/3 p-2 text-xs border rounded-lg bg-white"
                />
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="URL (https://...)"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="flex-1 p-2 text-xs border rounded-lg bg-white"
                />
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={handleAddLink}
                  className={`px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0 ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Notes / Registro Tecnico */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registro Técnico / Observaciones de Campo
            </label>
            <textarea
              rows={2}
              disabled={isLocked}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe comentarios de seguimiento o incidencias en campo..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                const updated = {
                  ...stepData,
                  status: stepData.status === 'completed' ? 'in_progress' : 'completed',
                  checklist: stepData.checklist?.map(c => ({ ...c, completed: stepData.status !== 'completed' }))
                };
                setStepData(updated as StepData);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                stepData.status === 'completed' 
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
                  : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {stepData.status === 'completed' ? 'Marcar En Proceso' : '✓ Marcar Todo Completado'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
