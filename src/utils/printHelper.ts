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
    // Preserve scroll position
    const prevScrollTop = targetEl.scrollTop;
    targetEl.scrollTop = 0;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = 210; // A4 width mm
    const pdfHeight = 297; // A4 height mm
    const marginX = 8;
    const marginY = 8;
    const contentWidthMm = pdfWidth - (marginX * 2); // 194mm
    const contentHeightMm = pdfHeight - (marginY * 2); // 281mm

    // Check if targetEl contains explicit page child containers (e.g., page 1, page 2)
    const pageNodes = Array.from(targetEl.querySelectorAll<HTMLElement>('#tct-contract-page-1, #tct-contract-page-2, .break-after-page, .page-break-after'));
    
    if (pageNodes.length > 0) {
      // Multi-page discrete rendering
      const totalPages = pageNodes.length;
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }
        const pageEl = pageNodes[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2.2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 980
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const imgHeightMm = Math.min(contentHeightMm, (canvas.height * contentWidthMm) / canvas.width);
        pdf.addImage(imgData, 'JPEG', marginX, marginY, contentWidthMm, imgHeightMm);

        // Watermark on background
        pdf.saveGraphicsState();
        pdf.setTextColor(240, 243, 248);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(70);
        pdf.text('TCT', pdfWidth / 2, pdfHeight / 2, {
          align: 'center',
          angle: 45
        });
        pdf.restoreGraphicsState();

        // Footer Compagination (1/n)
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Corporación TCT • Lima, Perú • Documento Oficial (Página ${i + 1}/${totalPages})`,
          pdfWidth / 2,
          pdfHeight - 4,
          { align: 'center' }
        );
      }
    } else {
      // Continuous element slicing
      const canvas = await html2canvas(targetEl, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: Math.max(targetEl.scrollWidth, 980)
      });

      const pxPerMm = canvas.width / contentWidthMm;
      const pageSlicePx = contentHeightMm * pxPerMm;
      const totalPages = Math.max(1, Math.ceil(canvas.height / pageSlicePx));

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage('a4', 'portrait');
        }

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

        // Watermark
        pdf.saveGraphicsState();
        pdf.setTextColor(240, 243, 248);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(70);
        pdf.text('TCT', pdfWidth / 2, pdfHeight / 2, {
          align: 'center',
          angle: 45
        });
        pdf.restoreGraphicsState();

        // Footer Compagination (1/n)
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Corporación TCT • Lima, Perú • Documento Oficial (Página ${page + 1}/${totalPages})`,
          pdfWidth / 2,
          pdfHeight - 4,
          { align: 'center' }
        );
      }
    }

    targetEl.scrollTop = prevScrollTop;

    const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    
    // Cross-platform save
    try {
      pdf.save(safeFilename);
    } catch {
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }

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
    // 1. Gather all main document stylesheets and Tailwind links
    const headElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    let stylesHtml = '';
    headElements.forEach(el => {
      stylesHtml += el.outerHTML + '\n';
    });

    // 2. Build isolated print iframe
    let printIframe = document.getElementById('tct-isolated-print-iframe') as HTMLIFrameElement | null;
    if (printIframe) {
      printIframe.remove();
    }

    printIframe = document.createElement('iframe');
    printIframe.id = 'tct-isolated-print-iframe';
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = 'none';
    printIframe.style.visibility = 'hidden';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>${docTitle}</title>
          ${stylesHtml}
          <style>
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
            .print\\:hidden, button, nav, header, .no-print {
              display: none !important;
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
            img {
              max-width: 100% !important;
            }
          </style>
        </head>
        <body class="bg-white text-slate-900">
          <div class="print-container">
            ${targetEl.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // 3. Trigger printing after contents and images load
    const triggerIframePrint = () => {
      setTimeout(() => {
        try {
          const win = printIframe?.contentWindow;
          if (win) {
            win.focus();
            win.print();
          } else {
            window.print();
          }
        } catch (e) {
          console.warn('Iframe print failed, falling back to window.print():', e);
          window.print();
        }
      }, 350);
    };

    if (doc.readyState === 'complete') {
      triggerIframePrint();
    } else {
      printIframe.onload = triggerIframePrint;
    }

  } catch (err) {
    console.error('Direct print execution error, fallback to window.print():', err);
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

/**
 * Generates and downloads the PDF and immediately opens native WhatsApp with Peru number (+51 990010020)
 */
export async function exportPdfAndOpenWhatsAppPeru(
  elementId: string, 
  filename: string, 
  messageHeader: string,
  phoneNumber: string = '51990010020'
): Promise<boolean> {
  try {
    // 1. Generate & download the PDF to device
    await exportElementToPdf(elementId, filename);
    
    // 2. Open WhatsApp Web / Native app with the formatted message
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    const cleanPhone = formattedPhone.startsWith('51') ? formattedPhone : `51${formattedPhone}`;
    const textMsg = encodeURIComponent(
      `🇵🇪 *CORPORACIÓN TCT S.A.C. - DOCUMENTO OFICIAL*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${messageHeader}\n\n` +
      `📎 *Nota de Envío:* Se ha descargado el archivo PDF oficial (*${filename}*) en este dispositivo. Por favor adjúntelo a este chat.\n` +
      `🏢 *Corporación TCT S.A.C.* • Jr. Las Camelias 450, San Isidro, Lima\n` +
      `📞 Tel: (01) 748-9200 • WhatsApp: +51 990010020`
    );

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${textMsg}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch (error) {
    console.error('Error sharing PDF to WhatsApp:', error);
    return false;
  }
}

