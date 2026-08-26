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

  // Check step 12 attachment specifically
  let step12HasAttachment = false;
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
          if (step.stepNumber === 12) {
            if (hasAtt || step.conformityAcceptance?.signedDocAttachmentUrl) {
              step12HasAttachment = true;
            }
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
  
  // Is Step 3 (Firma de Contrato) finalized with uploaded attachment?
  const isContractSigned = Boolean(
    (step3Status === 'completed' || completedSteps >= 3) && 
    (step3HasAttachment || project.contractExported)
  );

  let calculatedPercentage = 0;
  if (completedSteps === 0 && checkedChecklistCount === 0 && totalAttachmentsCount === 0) {
    calculatedPercentage = 0;
  } else {
    if (!isContractSigned) {
      // Before contract signing with attachment, progress advances through steps 1, 2, 3 but remains bounded up to 25.00%
      const step1Weight = (completedSteps >= 1 ? 8.33 : (checkedChecklistCount >= 1 ? 4.16 : 0)) + (step1HasAttachment ? 2.0 : 0);
      const step2Weight = (completedSteps >= 2 ? 8.33 : (checkedChecklistCount >= 3 ? 4.16 : 0)) + (step2HasAttachment ? 2.0 : 0);
      const step3Weight = (step3HasAttachment ? 4.34 : 0);
      calculatedPercentage = Math.min(25.00, Number((step1Weight + step2Weight + step3Weight).toFixed(2)));
    } else {
      // Step 3 is completed & signed: Progress begins from at least 25.00% and scales sequentially up to 100.00%
      const subsequentSteps = Math.max(0, completedSteps - 3);
      const postStepWeight = (subsequentSteps / 9) * 75.00;
      calculatedPercentage = Math.min(100.00, Math.max(25.00, Number((25.00 + postStepWeight).toFixed(2))));

      // Step 12 reach 100.00% only after Step 12 has its attachment uploaded
      if (completedSteps >= 12) {
        if (step12HasAttachment) {
          calculatedPercentage = 100.00;
        } else {
          calculatedPercentage = 95.00;
        }
      }
    }
  }

  // Strikethrough rule: percentage is strikethrough (tachado) until Step 3 is signed with attachment
  const isStrikethrough = !isContractSigned;
  const isStep3Blinking = isStrikethrough && (completedSteps >= 2 || checkedChecklistCount >= 3);
  const needsStep123Attachments = isStrikethrough;

  const rawPercentage = calculatedPercentage;
  const formattedPercentage = `${rawPercentage.toFixed(2)}%`;

  const isValidated = isContractSigned && completedStepsWithoutAttachments === 0;
  const pendingAttachmentsCount = isValidated ? 0 : completedStepsWithoutAttachments;

  let validationMessage = '';
  if (isStrikethrough) {
    validationMessage = `⚠️ AVANCE ${formattedPercentage} EN REVISIÓN (TACHADO): Se habilitará el avance oficial sin tachar una vez se complete la firma del contrato (Paso 3) y se adjunte el documento firmado.`;
  } else if (completedSteps >= 12 && !step12HasAttachment) {
    validationMessage = '⚠️ PASO 12 PENDIENTE DE ADJUNTO: Para alcanzar el 100.00%, adjunte el Acta de Conformidad o comprobante de entrega.';
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
