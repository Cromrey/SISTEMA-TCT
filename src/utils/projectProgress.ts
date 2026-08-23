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
  const ratio = (completedSteps / total) * 100;
  const rawPercentage = Number(ratio.toFixed(2));
  const formattedPercentage = `${rawPercentage.toFixed(2)}%`;

  // Validation requirement: if there are completed steps or contract emitted,
  // there must be proforma / contract or step attachments uploaded
  const hasUploadedFiles = 
    hasAttachmentsInSteps > 0 || 
    Boolean(project.proformaAttachmentUrl) || 
    Boolean(project.depositReceiptUrl) || 
    Boolean(project.contractExported);

  // A project is considered validated if all completed steps have their corresponding
  // mandatory attachments uploaded and verified, or contract is formally exported
  const isValidated = 
    completedSteps === 0 || 
    (Boolean(project.contractExported) && completedSteps <= 3) ||
    (completedStepsWithoutAttachments === 0 && (hasAttachmentsInSteps >= completedSteps || Boolean(project.contractExported)));
  
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
