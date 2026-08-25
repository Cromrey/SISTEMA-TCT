import { ProductionProject } from '../types';

export interface ProjectProgressInfo {
  totalSteps: number;
  completedSteps: number;
  totalChecklistCount: number;
  checkedChecklistCount: number;
  totalAttachmentsCount: number;
  rawPercentage: number;
  percentage: number;
  formattedPercentage: string;
  hasMandatoryAttachments: boolean;
  isValidated: boolean;
  pendingAttachmentsCount: number;
  validationMessage: string;
  isStrikethrough: boolean;
  isStep3Blinking: boolean;
  needsStep123Attachments: boolean;
  isContractSigned: boolean;
}

export const getProjectProgressInfo = (project: ProductionProject): ProjectProgressInfo => {
  let totalSteps = 0;
  let completedSteps = 0;
  let totalChecklistCount = 0;
  let checkedChecklistCount = 0;
  let totalAttachmentsCount = 0;
  let completedStepsWithoutAttachments = 0;

  // Track attachments specifically for steps 1, 2, 3
  let step1HasAttachment = Boolean(project.proformaAttachmentUrl);
  let step2HasAttachment = Boolean(project.depositReceiptUrl);
  let step3HasAttachment = false;
  let step3Status = 'pending';

  if (project.phases && Array.isArray(project.phases)) {
    project.phases.forEach(phase => {
      if (phase.steps && Array.isArray(phase.steps)) {
        phase.steps.forEach(step => {
          totalSteps += 1;
          const hasAtt = Boolean(step.attachments && step.attachments.length > 0);
          const attCount = step.attachments ? step.attachments.length : 0;
          totalAttachmentsCount += attCount;

          if (step.stepNumber === 1 && (hasAtt || project.proformaAttachmentUrl)) step1HasAttachment = true;
          if (step.stepNumber === 2 && (hasAtt || project.depositReceiptUrl)) step2HasAttachment = true;
          if (step.stepNumber === 3) {
            step3Status = step.status;
            if (hasAtt || project.contractExported) step3HasAttachment = true;
          }

          if (step.checklist && Array.isArray(step.checklist)) {
            step.checklist.forEach(item => {
              totalChecklistCount += 1;
              if (item.completed) {
                checkedChecklistCount += 1;
              }
            });
          }

          if (step.status === 'completed') {
            completedSteps += 1;
            if (!hasAtt && step.stepNumber <= 3) {
              completedStepsWithoutAttachments += 1;
            }
          }
        });
      }
    });
  }

  // Include project-level attachments in count
  if (project.proformaAttachmentUrl) totalAttachmentsCount += 1;
  if (project.depositReceiptUrl) totalAttachmentsCount += 1;

  // If there are no steps defined, default to 12
  const total = totalSteps > 0 ? totalSteps : 12;
  const effectiveTotalChecklist = totalChecklistCount > 0 ? totalChecklistCount : 36;
  
  // Is Step 3 (Firma de Contrato) finalized?
  const isContractSigned = Boolean(
    (step3Status === 'completed' || completedSteps >= 3) && 
    (step3HasAttachment || project.contractExported)
  );

  // Dynamic progress calculation based on:
  // - Checklist items completed (50% weight)
  // - Step status completions (35% weight)
  // - Required attachments uploaded (15% weight)
  const checklistRatio = effectiveTotalChecklist > 0 ? checkedChecklistCount / effectiveTotalChecklist : 0;
  const stepRatio = total > 0 ? completedSteps / total : 0;
  const initialAttRatio = (Number(step1HasAttachment) + Number(step2HasAttachment) + Number(step3HasAttachment)) / 3;

  let calculatedPercentage = 0;
  if (completedSteps === 0 && checkedChecklistCount === 0 && totalAttachmentsCount === 0) {
    calculatedPercentage = 0;
  } else {
    // Weighted progress
    const weighted = (checklistRatio * 50) + (stepRatio * 35) + (Math.min(1, totalAttachmentsCount / 6) * 15);
    calculatedPercentage = Math.min(100, Math.max(0, weighted));

    // Cap progress according to milestone bounds
    if (!isContractSigned) {
      // Before contract signing is finalized, progress is bounded between 0% and 25.00%
      const preSigningRatio = (checkedChecklistCount + totalAttachmentsCount + completedSteps) / (effectiveTotalChecklist * 0.25 + 3 + 3);
      calculatedPercentage = Math.min(25.00, Number((preSigningRatio * 25.00).toFixed(2)));
    } else {
      // After contract signing, ensure at least 25.00% and scale up to 100%
      const postRatio = (checkedChecklistCount + totalAttachmentsCount + (completedSteps * 2)) / (effectiveTotalChecklist + 10 + (total * 2));
      calculatedPercentage = Math.min(100, Math.max(25.00, Number((25.00 + postRatio * 75.00).toFixed(2))));
      if (completedSteps >= 12) {
        calculatedPercentage = 100.00;
      }
    }
  }

  // Strikethrough rule:
  // Shows 0% or calculated % crossed out (tachado) until contract is signed
  const isStrikethrough = !isContractSigned;
  const isStep3Blinking = isStrikethrough && (completedSteps >= 2 || checkedChecklistCount >= 3);
  const needsStep123Attachments = isStrikethrough;

  const rawPercentage = calculatedPercentage;
  const formattedPercentage = `${rawPercentage.toFixed(2)}%`;

  const isValidated = isContractSigned && completedStepsWithoutAttachments === 0;
  const pendingAttachmentsCount = isValidated ? 0 : completedStepsWithoutAttachments;

  let validationMessage = '';
  if (isStrikethrough) {
    validationMessage = `⚠️ AVANCE ${formattedPercentage} EN REVISIÓN (TACHADO): Comenzará a habilitarse el avance oficial sin tachar una vez se complete la firma del contrato y se adjunten las evidencias iniciales.`;
  } else if (!isValidated) {
    validationMessage = '⚠️ ATENCIÓN: Se debe añadir los archivos adjuntos obligatorios en los pasos completados para validar el porcentaje de avance real.';
  } else {
    validationMessage = '✓ Avance validado con contrato firmado y evidencias de soporte.';
  }

  return {
    totalSteps: total,
    completedSteps,
    totalChecklistCount: effectiveTotalChecklist,
    checkedChecklistCount,
    totalAttachmentsCount,
    rawPercentage,
    percentage: rawPercentage,
    formattedPercentage,
    hasMandatoryAttachments: totalAttachmentsCount > 0,
    isValidated,
    pendingAttachmentsCount,
    validationMessage,
    isStrikethrough,
    isStep3Blinking,
    needsStep123Attachments,
    isContractSigned
  };
};
