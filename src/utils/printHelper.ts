import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ProductionProject } from '../types';

/**
 * High-reliability PDF & Printable Document Handler for Corporación TCT
 * Works seamlessly in desktop browsers (PC/Mac), mobile devices, and inside sandboxed environments.
 * Strictly includes "TCT" watermark across all generated documents.
 */

export async function exportElementToPdf(
  elementId: string, 
  filename: string = 'TCT-Documento.pdf',
  docTitle: string = 'Corporación TCT'
): Promise<boolean> {
  const targetEl = document.getElementById(elementId);
  if (!targetEl) {
    printElement(elementId, docTitle);
    return false;
  }

  try {
    // Ensure element scroll position doesn't clip content on desktop
    const prevScrollTop = targetEl.scrollTop;
    targetEl.scrollTop = 0;

    // Render the DOM node to canvas using high-DPI scaling
    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(targetEl.scrollWidth, 900)
    });

    targetEl.scrollTop = prevScrollTop;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const marginX = 6;
    const marginY = 6;
    const contentWidth = pdfWidth - (marginX * 2);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = marginY;

    // Add first page content
    pdf.addImage(imgData, 'JPEG', marginX, position, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - (marginY * 2));

    // Subsequent pages if document exceeds 1 page
    while (heightLeft > 0) {
      position = heightLeft - contentHeight + marginY;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', marginX, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - (marginY * 2));
    }

    const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    
    // Inject "TCT" Watermark and Page Numbers across all pages (autonumerado 1/n páginas)
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      // Watermark "TCT" centered and rotated in subtle tone
      pdf.saveGraphicsState();
      pdf.setTextColor(220, 226, 235);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(85);
      pdf.text('TCT', pdfWidth / 2, pdfHeight / 2 + 10, {
        align: 'center',
        angle: 45
      });
      pdf.restoreGraphicsState();

      // Footer numbering (1/n páginas)
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `Corporación TCT • Lima, Perú • Documento Oficial (${i}/${totalPages} páginas)`,
        pdfWidth / 2,
        pdfHeight - 4,
        { align: 'center' }
      );
    }

    pdf.save(safeFilename);
    return true;
  } catch (error) {
    console.error('jsPDF/html2canvas export error, executing print fallback:', error);
    printElement(elementId, docTitle);
    return false;
  }
}

export function printElement(elementId: string, docTitle: string = 'Documento Corporación TCT'): void {
  try {
    const targetEl = document.getElementById(elementId);
    
    // Inject optimized media print stylesheet with TCT watermark
    const printStyleId = 'tct-dynamic-print-style';
    let styleTag = document.getElementById(printStyleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = printStyleId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        body * {
          visibility: hidden !important;
        }
        #${elementId}, #${elementId} * {
          visibility: visible !important;
        }
        #${elementId} {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 8px !important;
          background: white !important;
          color: #0f172a !important;
          display: block !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #${elementId}::before {
          content: "TCT";
          position: fixed;
          top: 40%;
          left: 30%;
          font-size: 110px;
          font-weight: 900;
          color: rgba(200, 210, 225, 0.12);
          transform: rotate(-35deg);
          pointer-events: none;
          z-index: 0;
        }
        .print\\:hidden, button, .no-print {
          display: none !important;
        }
        .page-break-inside-avoid {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `;

    // Attempt direct window.print()
    try {
      window.print();
      return;
    } catch (directPrintErr) {
      console.warn('Direct window.print failed, attempting iframe print...', directPrintErr);
    }

    // Fallback: hidden iframe print
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    printFrame.style.zIndex = '-9999';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (!frameDoc) {
      downloadPrintableHtml(elementId, `${docTitle}.html`, docTitle);
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const contentHtml = targetEl ? targetEl.innerHTML : document.body.innerHTML;

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${docTitle}</title>
        ${styles}
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 11px;
            line-height: 1.35;
            position: relative;
          }
          body::before {
            content: "TCT";
            position: fixed;
            top: 40%;
            left: 30%;
            font-size: 110px;
            font-weight: 900;
            color: rgba(200, 210, 225, 0.12);
            transform: rotate(-35deg);
            pointer-events: none;
            z-index: 0;
          }
          .print\\:hidden, button, .no-print {
            display: none !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="p-2 sm:p-4 bg-white text-slate-900">
          ${contentHtml}
        </div>
      </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 3000);
      } catch (err) {
        console.warn('Iframe print failed, falling back to downloadPrintableHtml', err);
        downloadPrintableHtml(elementId, `${docTitle}.html`, docTitle);
      }
    }, 400);

  } catch (e) {
    console.warn('Print helper error, downloading file fallback...', e);
    downloadPrintableHtml(elementId, `${docTitle}.html`, docTitle);
  }
}

/**
 * Sends a structured WhatsApp message to Peru phone 990010020
 */
export function sendToWhatsAppPeru(phoneNumber: string = '990010020', message: string): void {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const internationalPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://wa.me/${internationalPhone}?text=${encodedText}`;
  window.open(waUrl, '_blank');
}

/**
 * Builds the standard Report WhatsApp text from the 12-step flow
 */
export function buildReportWhatsAppText(project: ProductionProject): string {
  let completedCount = 0;
  let totalCount = 0;
  const stepSummary: string[] = [];

  project.phases.forEach(ph => {
    ph.steps.forEach(st => {
      totalCount++;
      const isDone = st.status === 'completed';
      if (isDone) completedCount++;
      const statusIcon = isDone ? '✅' : st.status === 'in_progress' ? '⚡' : '⏳';
      const attInfo = st.attachments && st.attachments.length > 0 ? ` (${st.attachments.length} adjunto/s)` : '';
      const auditInfo = st.completedBy ? ` - Resp: ${st.completedBy} [${st.completedAt || 'Auditado'}]` : '';
      stepSummary.push(`${statusIcon} Paso ${st.stepNumber}. ${st.title}${attInfo}${auditInfo}`);
    });
  });

  const percent = Math.round((completedCount / (totalCount || 12)) * 100);

  return `*CORPORACIÓN TCT - INFORME OFICIAL DE AUDITORÍA & ESTADO DE PRODUCCIÓN* 🎬
━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *Expediente:* ${project.uniqueCode}
📋 *Contrato:* ${project.contractNumber}
👤 *Cliente:* ${project.clientName} (DNI/RUC: ${project.clientDniRuc || 'N/D'})
🎉 *Evento:* ${project.eventType} - ${project.title}
📅 *Fecha:* ${project.eventDate} | ⏰ *Hora:* ${project.eventTime}
📍 *Locación:* ${project.eventLocation}
👤 *Asesor/Responsable:* ${project.contractHolder || 'Corporación TCT'}

💰 *INFORMACIÓN ECONÓMICA (PEN S/.)*
• Presupuesto Total: S/. ${project.totalBudget?.toLocaleString()}
• Adelanto Inicial: S/. ${project.initialDeposit?.toLocaleString()}
• Saldo Pendiente: S/. ${project.finalBalance?.toLocaleString()}

📊 *SEGUIMIENTO DE 12 PASOS (${completedCount}/${totalCount} - ${percent}%)*
${stepSummary.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 *Corporación TCT S.A.C.* - Calidad Cinematográfica & Control de Entregables.`;
}

/**
 * Builds the official Contract WhatsApp text
 */
export function buildContractWhatsAppText(project: ProductionProject): string {
  return `*CORPORACIÓN TCT - CONTRATO OFICIAL DE PRESTACIÓN DE SERVICIOS AUDIOVISUALES* 📜
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *N° de Contrato:* ${project.contractNumber}
📄 *Cotización Vinculada:* ${project.quotationCode || 'COT-OFICIAL'}
👤 *Contratante:* ${project.clientName}
🆔 *DNI / RUC:* ${project.clientDniRuc || 'N/D'}
📞 *Teléfono:* ${project.clientPhone || 'N/D'}
🏠 *Dirección:* ${project.clientAddress || 'N/D'}

🎉 *DETALLES DEL EVENTO*
• Tipo: ${project.eventType} - ${project.title}
• Fecha Programada: ${project.eventDate}
• Horario: ${project.eventTime}
• Locación: ${project.eventLocation}

💵 *CONDICIONES ECONÓMICAS (S/.)*
• Paquete: ${project.selectedPackageName || 'Servicio Profesional TCT'}
• Presupuesto Total Pactado: S/. ${project.totalBudget?.toLocaleString()}
• Adelanto Inicial (50%): S/. ${project.initialDeposit?.toLocaleString()}
• Cobro en Campo (Límite 7PM): S/. ${project.fieldPayment?.toLocaleString() || '0.00'}
• Saldo al Cierre: S/. ${project.finalBalance?.toLocaleString()}

📁 *ENTREGABLES & PLAZOS OFICIALES*
• Video Master 4K & USB Corporativo: 15 días hábiles
• Fotolibro Impreso de Lujo: 30 días hábiles (tras aprobación)
• Resguardo de Archivos RAW: 30 días calendario tras entrega

━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 *Firma y Validez:* Contrato formalmente suscrito con Corporación TCT S.A.C.`;
}

/**
 * Downloads a standalone printable HTML/PDF file directly to the device
 */
export function downloadPrintableHtml(elementId: string, filename: string = 'TCT-Documento.html', title: string = 'Corporación TCT'): void {
  const targetEl = document.getElementById(elementId);
  const contentHtml = targetEl ? targetEl.innerHTML : document.body.innerHTML;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(node => node.outerHTML)
    .join('\n');

  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${styles}
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    * { box-sizing: border-box; }
    body { background: white !important; color: #0f172a !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 11px; line-height: 1.35; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print\\:hidden, button, .no-print { display: none !important; }
    .page-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>
<body>
  <div style="max-width: 820px; margin: 0 auto; padding: 10px;">
    ${contentHtml}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads an editable Microsoft Word document (.doc) with complete formatted styling and tables
 * Compatible with Microsoft Word, Google Docs, LibreOffice, and WPS Office.
 */
export function downloadEditableDoc(elementId: string, filename: string = 'TCT-Contrato-Editable.doc', title: string = 'Contrato Oficial Corporación TCT'): void {
  const targetEl = document.getElementById(elementId);
  const contentHtml = targetEl ? targetEl.innerHTML : document.body.innerHTML;

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        @page {
          size: 21cm 29.7cm;
          margin: 2cm 2cm 2cm 2cm;
          mso-page-orientation: portrait;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #0f172a;
          background-color: #ffffff;
        }
        h1, h2, h3, h4 {
          color: #020617;
          margin-top: 12pt;
          margin-bottom: 4pt;
        }
        h2 {
          font-size: 14pt;
          border-bottom: 1.5pt solid #d97706;
          padding-bottom: 3pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8pt;
          margin-bottom: 8pt;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 6pt 8pt;
          font-size: 10pt;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: left;
        }
        .signature-box {
          margin-top: 30pt;
          border-top: 1px solid #000;
          padding-top: 6pt;
          text-align: center;
          font-weight: bold;
        }
        .print\\:hidden, button, .no-print {
          display: none !important;
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 16pt;">
        <h1 style="color: #b45309; font-size: 18pt; margin: 0; font-weight: 900;">CORPORACIÓN TCT</h1>
        <p style="color: #64748b; font-size: 9pt; margin: 2pt 0 10pt 0;">PRODUCCIÓN AUDIOVISUAL & TRANSMISIONES EN VIVO</p>
      </div>
      <div>
        ${contentHtml}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordHtml], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

