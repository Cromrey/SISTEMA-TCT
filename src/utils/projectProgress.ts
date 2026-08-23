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
  isStrikethrough: boolean;
  isStep3Blinking: boolean;
  needsStep123Attachments: boolean;
}

export const getProjectProgressInfo = (project: ProductionProject): ProjectProgressInfo => {
  let totalSteps = 0;
  let completedSteps = 0;
  let hasAttachmentsInSteps = 0;
  let completedStepsWithoutAttachments = 0;

  // Track attachments specifically for steps 1, 2, 3
  let step1HasAttachment = Boolean(project.proformaAttachmentUrl);
  let step2HasAttachment = Boolean(project.depositReceiptUrl);
  let step3HasAttachment = false;

  if (project.phases && Array.isArray(project.phases)) {
    project.phases.forEach(phase => {
      if (phase.steps && Array.isArray(phase.steps)) {
        phase.steps.forEach(step => {
          totalSteps += 1;
          const hasAtt = Boolean(step.attachments && step.attachments.length > 0);
          
          if (step.stepNumber === 1 && hasAtt) step1HasAttachment = true;
          if (step.stepNumber === 2 && hasAtt) step2HasAttachment = true;
          if (step.stepNumber === 3 && hasAtt) step3HasAttachment = true;

          if (step.status === 'completed') {
            completedSteps += 1;
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
  // Step 3 active or completed (Contract Generation & Formalization Phase 1) = exactly 25.00%
  let rawPercentage = 0;
  if (completedSteps === 0) {
    rawPercentage = 0.0;
  } else if (completedSteps === 1) {
    rawPercentage = 8.33;
  } else if (completedSteps === 2 || completedSteps === 3 || project.contractExported) {
    rawPercentage = 25.00;
  } else {
    // 4 to 12 steps
    const remainingSteps = completedSteps - 3;
    const remainingRatio = 25.00 + (remainingSteps / 9) * 75.00;
    rawPercentage = Number(Math.min(100, remainingRatio).toFixed(2));
  }

  const formattedPercentage = `${rawPercentage.toFixed(2)}%`;

  // Check if steps 1, 2, 3 have their supporting proof attachments
  const allInitialThreeHaveAttachments = step1HasAttachment && step2HasAttachment && step3HasAttachment;

  // Strikethrough condition:
  // When contract is generated from Nueva Producción or step 3 is pending proof/attachments
  const isStrikethrough = Boolean(
    project.contractPendingAttachment ||
    (completedSteps >= 3 && !allInitialThreeHaveAttachments && completedSteps <= 4)
  );

  const isStep3Blinking = isStrikethrough || (completedSteps === 3 && !allInitialThreeHaveAttachments);
  const needsStep123Attachments = isStrikethrough;

  // Validation requirement: check if attachments are present
  const hasUploadedFiles = 
    hasAttachmentsInSteps > 0 || 
    Boolean(project.proformaAttachmentUrl) || 
    Boolean(project.depositReceiptUrl) || 
    Boolean(project.contractExported);

  const isValidated = !isStrikethrough && (
    completedSteps === 0 || 
    Boolean(project.contractExported && allInitialThreeHaveAttachments) ||
    completedStepsWithoutAttachments === 0
  );
  
  const pendingAttachmentsCount = isValidated ? 0 : completedStepsWithoutAttachments;

  let validationMessage = '';
  if (isStrikethrough) {
    validationMessage = '⚠️ AVANCE AL 25.00% EN REVISIÓN (TACHADO): Se debe adjuntar por única vez en los Pasos 1, 2 y 3 los archivos de sustento (Proforma, Voucher de Adelanto y Contrato Firmado) para validar formalmente el cumplimiento y habilitar el Paso 4.';
  } else if (!isValidated) {
    validationMessage = '⚠️ ATENCIÓN: Se debe añadir los archivos adjuntos obligatorios en los pasos completados para validar el porcentaje de avance real.';
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
    validationMessage,
    isStrikethrough,
    isStep3Blinking,
    needsStep123Attachments
  };
};
