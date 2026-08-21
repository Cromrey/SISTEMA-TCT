import { ProductionProject } from '../types';

export interface ProjectProgressInfo {
  totalSteps: number;
  completedSteps: number;
  rawPercentage: number;
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
  const hasContractOrProforma = Boolean(project.proformaAttachmentUrl || project.contractNumber);
  const hasUploadedFiles = hasAttachmentsInSteps > 0 || Boolean(project.proformaAttachmentUrl) || Boolean(project.depositReceiptUrl);

  // A project is considered validated if at least essential attachments or step attachments are present
  // when progress > 0
  const isValidated = completedSteps === 0 || (completedStepsWithoutAttachments === 0 && (hasUploadedFiles || hasContractOrProforma));
  
  const pendingAttachmentsCount = completedStepsWithoutAttachments;

  let validationMessage = '';
  if (!isValidated) {
    validationMessage = '⚠️ ATENCIÓN: Se debe añadir los archivos adjuntos obligatorios de sustento técnico y marcar la tarea como culminada para validar el avance.';
  }

  return {
    totalSteps: total,
    completedSteps,
    rawPercentage,
    formattedPercentage,
    hasMandatoryAttachments: hasUploadedFiles,
    isValidated,
    pendingAttachmentsCount,
    validationMessage
  };
};
