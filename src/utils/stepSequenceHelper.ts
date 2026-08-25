import { ProductionProject, StepData, StepAttachment } from '../types';
import { createAuditEntry, appendAuditLog } from './auditLogger';

export interface StepValidationResult {
  isUnlocked: boolean;
  isCompleted: boolean;
  canComplete: boolean;
  isReadOnly: boolean;
  reason?: string;
  requiredStepNumber?: number;
  requiredStepTitle?: string;
  missingRequirements: string[];
}

/**
 * Returns all 12 steps in flat order
 */
export const getFlatStepsList = (project: ProductionProject) => {
  const list: { phaseIdx: number; stepIdx: number; step: StepData }[] = [];
  if (!project.phases || !Array.isArray(project.phases)) return list;

  project.phases.forEach((p, pIdx) => {
    if (p.steps && Array.isArray(p.steps)) {
      p.steps.forEach((s, sIdx) => {
        list.push({ phaseIdx: pIdx, stepIdx: sIdx, step: s });
      });
    }
  });

  return list;
};

/**
 * Checks if a specific step is unlocked according to the strict sequential flow
 * Rule: Step 1 is always unlocked.
 * Step N requires Step N-1 to be 'completed' with its mandatory requirements.
 * No skipping or non-sequential jumps allowed.
 */
export const checkStepSequenceStatus = (
  project: ProductionProject,
  targetStepNumber: number
): StepValidationResult => {
  const allSteps = getFlatStepsList(project);
  const targetItem = allSteps.find(item => item.step.stepNumber === targetStepNumber);

  if (!targetItem) {
    return {
      isUnlocked: false,
      isCompleted: false,
      canComplete: false,
      isReadOnly: true,
      reason: 'Paso no encontrado en la estructura de fases',
      missingRequirements: ['Paso inexistente']
    };
  }

  const targetStep = targetItem.step;
  const isCompleted = targetStep.status === 'completed';

  // Step 1 is always unlocked
  if (targetStepNumber === 1) {
    return {
      isUnlocked: true,
      isCompleted,
      canComplete: true,
      isReadOnly: false,
      missingRequirements: []
    };
  }

  // Find previous step in sequence
  const targetGlobalIndex = allSteps.findIndex(item => item.step.stepNumber === targetStepNumber);
  const prevItem = targetGlobalIndex > 0 ? allSteps[targetGlobalIndex - 1] : null;

  if (!prevItem) {
    return {
      isUnlocked: true,
      isCompleted,
      canComplete: true,
      isReadOnly: false,
      missingRequirements: []
    };
  }

  const prevStep = prevItem.step;
  const isPrevCompleted = prevStep.status === 'completed';

  // Specific requirement check for previous step
  const missingRequirements: string[] = [];

  if (!isPrevCompleted) {
    missingRequirements.push(
      `El Paso ${prevStep.stepNumber} (${prevStep.title}) no está culminado.`
    );
  }

  // Step 4 unlocking rule: Step 3 must be completed
  if (targetStepNumber === 4) {
    const step3 = allSteps.find(item => item.step.stepNumber === 3)?.step;
    const isStep3Completed = step3?.status === 'completed' || isPrevCompleted || project.contractExported;

    if (!isStep3Completed) {
      missingRequirements.push('Debe culminar y formalizar la firma del contrato en el Paso 3 para continuar.');
    }
  }

  // Check if subsequent steps are completed (preventing backward modification of past completed steps for employees)
  const subsequentStepsCompleted = allSteps
    .slice(targetGlobalIndex + 1)
    .some(item => item.step.status === 'completed');

  // If this step is 1, 2, or 3 and contractPendingAttachment is active, allow editing to upload attachments
  const isInitialAttachmentPending = (targetStepNumber <= 3) && Boolean(project.contractPendingAttachment);

  const isUnlocked = isPrevCompleted && missingRequirements.length === 0;

  return {
    isUnlocked: targetStepNumber <= 3 && isInitialAttachmentPending ? true : isUnlocked,
    isCompleted,
    canComplete: (isUnlocked || isInitialAttachmentPending) && !subsequentStepsCompleted,
    isReadOnly: isCompleted && subsequentStepsCompleted && !isInitialAttachmentPending,
    reason: !isUnlocked && !isInitialAttachmentPending
      ? `🔒 Paso Bloqueado: Requiere culminar obligatoriamente el Paso ${prevStep.stepNumber} (${prevStep.title}) y registrar sus archivos adjuntos de sustento.`
      : undefined,
    requiredStepNumber: prevStep.stepNumber,
    requiredStepTitle: prevStep.title,
    missingRequirements
  };
};

/**
 * Validates whether a step has satisfied all mandatory checklist and attachment requirements to be marked completed
 */
export const validateStepCompletion = (
  step: StepData,
  project: ProductionProject
): { canComplete: boolean; errorMessages: string[] } => {
  const errorMessages: string[] = [];

  // 1. Checklist completeness check
  if (step.checklist && step.checklist.length > 0) {
    const pendingChecks = step.checklist.filter(c => !c.completed);
    if (pendingChecks.length > 0) {
      errorMessages.push(
        `Faltan ${pendingChecks.length} ítems obligatorios en el checklist: "${pendingChecks[0].text}".`
      );
    }
  }

  // 2. Specific step validations
  switch (step.stepNumber) {
    case 1:
      // Quotation code or proforma required
      if (!project.quotationCode && (!step.attachments || step.attachments.length === 0)) {
        errorMessages.push('Debe asignar el código de cotización o adjuntar la proforma oficial.');
      }
      break;

    case 2:
      // Deposit required
      if (project.initialDeposit <= 0 && (!step.attachments || step.attachments.length === 0)) {
        errorMessages.push('Debe registrar el monto de adelanto inicial o adjuntar voucher de caja.');
      }
      break;

    case 3:
      // Contract export / signed document required
      if (!project.contractNumber) {
        errorMessages.push('Debe contar con N° de contrato oficial generado.');
      }
      break;

    case 4:
      // Flyer design
      const hasFlyer = (step.attachments && step.attachments.length > 0) || (step.links && step.links.length > 0);
      if (!hasFlyer) {
        errorMessages.push('Debe adjuntar el arte del flyer o registrar el enlace en alta resolución.');
      }
      break;

    case 7:
      // Field payment verification
      if (!step.fieldPaymentData || step.fieldPaymentData.paymentStatus === 'pending') {
        if (project.finalBalance > 0) {
          errorMessages.push('Debe registrar el estado del cobro en campo (Pagado o Acuerdo de prórroga) antes de las 7:00 PM.');
        }
      }
      break;

    case 8:
      // Ingest verification
      if (!step.ingestData || !step.ingestData.backupVerified) {
        errorMessages.push('Debe marcar la casilla de "Respaldo y verificación de checksum en servidor NAS".');
      }
      break;

    case 10:
      // Social links
      const hasSocial = Boolean(
        step.socialLinks?.tiktok ||
        step.socialLinks?.youtube ||
        step.socialLinks?.facebook ||
        step.socialLinks?.googleDrive ||
        (step.links && step.links.length > 0)
      );
      if (!hasSocial && project.authorizeInternetPublishing !== false) {
        errorMessages.push('Debe ingresar al menos un enlace oficial de publicación o Drive.');
      }
      break;

    case 12:
      // Client conformity
      if (!step.conformityAcceptance?.accepted) {
        errorMessages.push('Debe registrar la Aceptación del Acta de Conformidad Final firmada por el cliente.');
      }
      break;
  }

  return {
    canComplete: errorMessages.length === 0,
    errorMessages
  };
};

/**
 * Finalizes contract export (Step 3 culmination)
 * Locks initial commercial data, marks Steps 1, 2, 3 as completed,
 * ensures progress is set to exactly 25.00%, and unlocks Step 4.
 */
export const finalizeContractExportStep3 = (
  project: ProductionProject,
  userName = 'Administrador TCT'
): ProductionProject => {
  const updatedPhases = [...project.phases];

  // In Phase 1: Steps 1 & 2 completed, Step 3 is Firma de Contrato in_progress
  if (updatedPhases[0] && updatedPhases[0].steps) {
    const phase1Steps = updatedPhases[0].steps.map((st) => {
      if (st.stepNumber === 1 || st.stepNumber === 2) {
        const allChecklistCompleted = st.checklist
          ? st.checklist.map(c => ({ ...c, completed: true, completedAt: c.completedAt || new Date().toLocaleTimeString() }))
          : [];

        return {
          ...st,
          status: 'completed' as const,
          completedAt: st.completedAt || new Date().toLocaleTimeString(),
          checklist: allChecklistCompleted
        };
      }
      if (st.stepNumber === 3) {
        if (st.status === 'completed') {
          return st;
        }
        return {
          ...st,
          title: 'Firma de Contrato',
          status: 'in_progress' as const,
          checklist: st.checklist
            ? st.checklist.map((c, idx) => ({ ...c, completed: idx < 2 }))
            : []
        };
      }
      return st;
    });
    updatedPhases[0] = { ...updatedPhases[0], steps: phase1Steps };
  }

  // Ensure Step 4 (Flyer) stays pending until Step 3 is completed
  if (updatedPhases[1] && updatedPhases[1].steps && updatedPhases[1].steps[0]) {
    if (updatedPhases[1].steps[0].status === 'in_progress') {
      const step4 = { ...updatedPhases[1].steps[0], status: 'pending' as const };
      const updatedPhase2Steps = [...updatedPhases[1].steps];
      updatedPhase2Steps[0] = step4;
      updatedPhases[1] = { ...updatedPhases[1], steps: updatedPhase2Steps };
    }
  }

  // Audit Log Entry
  const auditLog = createAuditEntry({
    userName,
    userRole: 'admin',
    action: 'contract_exported',
    title: 'Exportación de Contrato Generada (Hito: Firma de Contrato 25.00%)',
    description: `Se generó la exportación oficial del contrato ${project.contractNumber}. Se estableció el hito activo en el Paso 3 (Firma de Contrato 25.00%) para la suscripción y registro de firmas.`,
    metadata: {
      contractNumber: project.contractNumber,
      clientName: project.clientName,
      totalBudget: `S/. ${project.totalBudget}`,
      percentage: '25.00%'
    }
  });

  let updated: ProductionProject = {
    ...project,
    phases: updatedPhases,
    contractExported: true,
    contractExportDate: new Date().toISOString(),
    initialCommercialLocked: true,
    updatedAt: new Date().toISOString()
  };

  updated = appendAuditLog(updated, auditLog);
  return updated;
};
