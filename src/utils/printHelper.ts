import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * High-reliability PDF & Editable Document Handler for Corporación TCT
 * Works seamlessly in desktop browsers, mobile devices, and inside sandboxed iframes.
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
    // Render the DOM node to canvas using high-DPI scaling
    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: targetEl.scrollWidth || 800
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const marginX = 8;
    const marginY = 8;
    const contentWidth = pdfWidth - (marginX * 2);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = marginY;

    // First page
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
    
    // Add page numbers on exported PDF (autonumerado 1/n páginas)
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `Corporación TCT • Contrato de Servicios Audiovisuales • (${i}/${totalPages} páginas)`,
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
    
    // Add temporary print-focus class and style
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
          padding: 10px !important;
          background: white !important;
          color: #0f172a !important;
          display: block !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
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

    // Strategy 1: Attempt direct window.print with custom media print styles
    try {
      window.print();
      return;
    } catch (directPrintErr) {
      console.warn('Direct window.print failed, attempting iframe print...', directPrintErr);
    }

    // Strategy 2: Create a hidden iframe with full styles and print
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
      // Fallback: download directly as printable file
      downloadPrintableHtml(elementId, `${docTitle}.html`, docTitle);
      return;
    }

    // Collect all stylesheets and tailwind styles from parent
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

