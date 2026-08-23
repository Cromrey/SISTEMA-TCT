import { ProductionProject } from '../types';

export interface ProjectProgressInfo {
  totalSteps: number;
  completedSteps: number;
  rawPercentage: number;
  percentage: number;
  formattedPercentage: string;
  hasMandatoryAttachments: boolean;
  isValidated: boolean;
  pendingAttachmentsCount: number;
  validationMessage: string;
}

export const getProjectProgressInfo = (project: ProductionProject): ProjectProgressInfo => {
  let totalSteps = 0;
  let completedSteps = 0;
  let hasAttachmentsInSteps = 0;
  let completedStepsWithoutAttachments = 0;

  if (project.phases && Array.isArray(project.phases)) {
    project.phases.forEach(phase => {
      if (phase.steps && Array.isArray(phase.steps)) {
        phase.steps.forEach(step => {
          totalSteps += 1;
          if (step.status === 'completed') {
            completedSteps += 1;
            const hasAtt = Boolean(step.attachments && step.attachments.length > 0);
            if (hasAtt) {
              hasAttachmentsInSteps += 1;
            } else {
              completedStepsWithoutAttachments += 1;
            }
          }
        });
      }
    });
  }

  // If there are no steps defined, default to 12
  const total = totalSteps > 0 ? totalSteps : 12;
  
  // Custom milestone mapping:
  // Step 3 completed (Contract Generation & Formalization Phase 1) = exactly 25.00%
  let rawPercentage = 0;
  if (completedSteps === 0) {
    rawPercentage = 0.0;
  } else if (completedSteps === 1) {
    rawPercentage = 8.33;
  } else if (completedSteps === 2) {
    rawPercentage = 16.67;
  } else if (completedSteps === 3 || (project.contractExported && completedSteps <= 3)) {
    rawPercentage = 25.00;
  } else {
    // 4 to 12 steps
    const remainingSteps = completedSteps - 3;
    const remainingRatio = 25.00 + (remainingSteps / 9) * 75.00;
    rawPercentage = Number(Math.min(100, remainingRatio).toFixed(2));
  }

  const formattedPercentage = `${rawPercentage.toFixed(2)}%`;

  // Validation requirement: check if attachments are present or contract exported
  const hasUploadedFiles = 
    hasAttachmentsInSteps > 0 || 
    Boolean(project.proformaAttachmentUrl) || 
    Boolean(project.depositReceiptUrl) || 
    Boolean(project.contractExported);

  // A project is considered validated if steps have their corresponding attachments or contract is exported
  const isValidated = 
    completedSteps === 0 || 
    Boolean(project.contractExported) ||
    hasUploadedFiles ||
    completedStepsWithoutAttachments === 0;
  
  const pendingAttachmentsCount = isValidated ? 0 : completedStepsWithoutAttachments;

  let validationMessage = '';
  if (!isValidated) {
    validationMessage = '⚠️ ATENCIÓN OBLIGATORIA: Se debe añadir los archivos adjuntos obligatorios (documentos/sustentos técnicos) en los pasos completados y marcar la respectiva tarea como culminada para validar el porcentaje de avance real.';
  }

  return {
    totalSteps: total,
    completedSteps,
    rawPercentage,
    percentage: rawPercentage,
    formattedPercentage,
    hasMandatoryAttachments: hasUploadedFiles,
    isValidated,
    pendingAttachmentsCount,
    validationMessage
  };
};
