import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ProductionProject } from '../types';

/**
 * High-reliability PDF & Printable Document Handler for Corporación TCT
 * Strict A4 Vertical format (210mm x 297mm) with multi-page slicing,
 * TCT Watermark, dynamic compagination (1/n páginas), and full signature rendering.
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
    // Preserve scroll position and make sure content is unclipped
    const prevScrollTop = targetEl.scrollTop;
    targetEl.scrollTop = 0;

    // Render DOM node to high-DPI canvas
    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(targetEl.scrollWidth, 960)
    });

    targetEl.scrollTop = prevScrollTop;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210; // A4 width mm
    const pdfHeight = 297; // A4 height mm
    const marginX = 8;
    const marginY = 10;
    const contentWidthMm = pdfWidth - (marginX * 2); // 194mm
    const contentHeightMm = pdfHeight - (marginY * 2); // 277mm

    // Calculate canvas pixels per page
    const pxPerMm = canvas.width / contentWidthMm;
    const pageSlicePx = contentHeightMm * pxPerMm;
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageSlicePx));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Slice the canvas for the current page
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      const currentSliceHeight = Math.min(pageSlicePx, canvas.height - (page * pageSlicePx));
      pageCanvas.height = currentSliceHeight;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0, page * pageSlicePx, canvas.width, currentSliceHeight,
          0, 0, canvas.width, currentSliceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
        const sliceHeightMm = (currentSliceHeight * contentWidthMm) / canvas.width;
        pdf.addImage(pageImgData, 'JPEG', marginX, marginY, contentWidthMm, sliceHeightMm);
      }

      // Background Watermark "TCT" centered and rotated on every page
      pdf.saveGraphicsState();
      pdf.setTextColor(230, 235, 243);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(80);
      pdf.text('TCT', pdfWidth / 2, pdfHeight / 2 + 5, {
        align: 'center',
        angle: 45
      });
      pdf.restoreGraphicsState();

      // Footer compagination (Página 1/n)
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Corporación TCT • Lima, Perú • Documento Oficial (Página ${page + 1}/${totalPages})`,
        pdfWidth / 2,
        pdfHeight - 4,
        { align: 'center' }
      );
    }

    const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);
    return true;
  } catch (error) {
    console.error('jsPDF/html2canvas export error, executing print fallback:', error);
    printElement(elementId, docTitle);
    return false;
  }
}

export function printElement(elementId: string, docTitle: string = 'Documento Corporación TCT'): void {
  const targetEl = document.getElementById(elementId);
  if (!targetEl) {
    console.error(`Target print element #${elementId} not found in DOM`);
    window.print();
    return;
  }

  try {
    // 1. Inject or update the global high-compatibility print styles
    const styleId = 'tct-universal-print-stylesheet';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 10mm 10mm;
        }
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          box-sizing: border-box !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          overflow: visible !important;
          height: auto !important;
          min-height: 100% !important;
        }
        /* Hide all UI navigation, controls, headers and modal backdrops */
        .print\\:hidden, button, nav, header, .no-print {
          display: none !important;
        }
        /* Make modal backdrop completely transparent and static during print */
        .fixed.inset-0 {
          position: static !important;
          background: transparent !important;
          backdrop-filter: none !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          display: block !important;
          height: auto !important;
          max-height: none !important;
          width: 100% !important;
          max-width: 100% !important;
          box-shadow: none !important;
          border: none !important;
        }
        .max-h-\\[96vh\\], .max-h-\\[90vh\\] {
          max-height: none !important;
          height: auto !important;
          overflow: visible !important;
          box-shadow: none !important;
          border: none !important;
        }
        #${elementId} {
          display: block !important;
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
          padding: 0 !important;
          margin: 0 !important;
          background: #ffffff !important;
        }
        .page-break-after, .break-after-page {
          page-break-after: always !important;
          break-after: page !important;
        }
        .page-break-before, .break-before-page {
          page-break-before: always !important;
          break-before: page !important;
        }
        .page-break-inside-avoid, .break-inside-avoid {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        svg {
          shape-rendering: geometricPrecision !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;

    // 2. Set document title for clean print header/filename
    const prevTitle = document.title;
    document.title = docTitle;

    // 3. Trigger native window.print() directly
    window.focus();
    setTimeout(() => {
      window.print();
      // Restore title after print dialog closes
      setTimeout(() => {
        document.title = prevTitle;
      }, 1000);
    }, 50);

  } catch (err) {
    console.error('Direct print execution error:', err);
    window.print();
  }
}

function fallbackWindowPrint(contentHtml: string, docTitle: string, styleTags: string): void {
  try {
    const printWin = window.open('', '_blank', 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${docTitle}</title>
        ${styleTags}
        <style>
          @page { size: A4 portrait; margin: 8mm 10mm 10mm 10mm; }
          body { background: white !important; color: #0f172a !important; font-size: 11px; }
          .print\\:hidden, button, .no-print { display: none !important; }
        </style>
      </head>
      <body>
        ${contentHtml}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  } catch (e) {
    window.print();
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

