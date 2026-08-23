import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * High-reliability PDF & Printable Document Handler for Corporación TCT
 * Generates and downloads real .pdf files directly using jsPDF + html2canvas,
 * and handles browser print dialogs inside sandboxed iframes.
 */

export async function exportElementToPdf(
  elementId: string,
  filename: string = 'TCT-Documento.pdf',
  docTitle: string = 'Documento Corporación TCT'
): Promise<void> {
  const targetEl = document.getElementById(elementId);
  if (!targetEl) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    return;
  }

  try {
    // 1. Temporarily show element in optimal capturing mode
    const originalStyle = targetEl.getAttribute('style') || '';
    
    // 2. Render target element to canvas with high resolution
    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.overflow = 'visible';
          clonedEl.style.maxHeight = 'none';
          clonedEl.style.height = 'auto';
          clonedEl.style.width = '1000px';
          clonedEl.style.padding = '24px';
          clonedEl.style.background = '#ffffff';
          clonedEl.style.color = '#0f172a';
          // Hide any no-print / screen-only buttons inside the clone
          const noPrintNodes = clonedEl.querySelectorAll('.no-print, button, .print\\:hidden');
          noPrintNodes.forEach(node => {
            (node as HTMLElement).style.display = 'none';
          });
        }
      }
    });

    // 3. Create A4 jsPDF instance (210 x 297 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8; // 8mm margin
    const contentWidth = pageWidth - (margin * 2);
    
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    let heightLeft = imgHeight;
    let position = margin;

    // Add first page
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= (pageHeight - margin * 2);

    // Add extra pages if content overflows 1 A4 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - margin * 2);
    }

    // 4. Save/Download the PDF directly
    const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);

  } catch (err) {
    console.warn('Direct jsPDF export failed, falling back to print window:', err);
    printElement(elementId, docTitle);
  }
}

/**
 * Print element via browser print dialog with fallback
 */
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

    // Strategy 1: Direct window.print
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
      exportElementToPdf(elementId, `${docTitle}.pdf`, docTitle);
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
        console.warn('Iframe print failed, falling back to exportElementToPdf', err);
        exportElementToPdf(elementId, `${docTitle}.pdf`, docTitle);
      }
    }, 400);

  } catch (e) {
    console.warn('Print helper error, exporting PDF directly...', e);
    exportElementToPdf(elementId, `${docTitle}.pdf`, docTitle);
  }
}


