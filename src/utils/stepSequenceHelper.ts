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

  // Step 4 unlocking rule: Step 3 must be completed AND contract exported/registered with mandatory attachments (25.00%)
  if (targetStepNumber === 4) {
    const step3 = allSteps.find(item => item.step.stepNumber === 3)?.step;
    const hasAttachments = Boolean(
      (step3?.attachments && step3.attachments.length > 0) ||
      project.proformaAttachmentUrl ||
      project.depositReceiptUrl ||
      project.contractExported
    );

    if (!isPrevCompleted) {
      missingRequirements.push('Debe culminar y registrar la exportación del contrato en el Paso 3.');
    }
    if (!hasAttachments && !project.contractExported) {
      missingRequirements.push('Debe registrar los sustentos o adjuntos del contrato en el Paso 3.');
    }
  }

  // Check if subsequent steps are completed (preventing backward modification of past completed steps)
  const subsequentStepsCompleted = allSteps
    .slice(targetGlobalIndex + 1)
    .some(item => item.step.status === 'completed');

  const isUnlocked = isPrevCompleted && missingRequirements.length === 0;

  return {
    isUnlocked,
    isCompleted,
    canComplete: isUnlocked && !subsequentStepsCompleted,
    isReadOnly: isCompleted && subsequentStepsCompleted,
    reason: !isUnlocked
      ? `🔒 Paso Bloqueado: Requiere culminar obligatoriamente el Paso ${prevStep.stepNumber} (${prevStep.title}) y registrar sus archivos adjuntos.`
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

  // Mark Phase 1 (Steps 1, 2, 3) as completed
  if (updatedPhases[0] && updatedPhases[0].steps) {
    const phase1Steps = updatedPhases[0].steps.map((st, idx) => {
      const allChecklistCompleted = st.checklist
        ? st.checklist.map(c => ({ ...c, completed: true, completedAt: c.completedAt || new Date().toLocaleTimeString() }))
        : [];

      return {
        ...st,
        status: 'completed' as const,
        completedAt: st.completedAt || new Date().toLocaleTimeString(),
        checklist: allChecklistCompleted
      };
    });
    updatedPhases[0] = { ...updatedPhases[0], steps: phase1Steps };
  }

  // Set Step 4 (Flyer) to in_progress if currently pending
  if (updatedPhases[1] && updatedPhases[1].steps && updatedPhases[1].steps[0]) {
    if (updatedPhases[1].steps[0].status === 'pending') {
      const step4 = { ...updatedPhases[1].steps[0], status: 'in_progress' as const };
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
    title: 'Exportación de Contrato Culminada (Avance: 25.00%)',
    description: `Se culminó la exportación y formalización del contrato ${project.contractNumber}. Se validó el 25.00% de avance (Paso 3 completado), se bloquearon los datos contractuales iniciales y se habilitó el Paso 4 (Diseño del Flyer).`,
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
