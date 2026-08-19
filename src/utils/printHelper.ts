/**
 * High-reliability PDF & Editable Document Handler for Corporación TCT
 * Works seamlessly in desktop browsers, mobile devices, and inside sandboxed iframes.
 */

export function printElement(elementId: string, docTitle: string = 'Documento Corporación TCT'): void {
  try {
    const targetEl = document.getElementById(elementId);
    
    // Strategy 1: Create a hidden iframe with full styles and print
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
      // Fallback directly to window.print()
      window.print();
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
            size: A4;
            margin: 12mm 15mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden, button, .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="p-6 bg-white text-slate-900">
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
        console.warn('Iframe print failed, falling back to window.print()', err);
        window.print();
      }
    }, 500);

  } catch (e) {
    console.warn('Print helper error, using window.print()', e);
    window.print();
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
    @page { size: A4; margin: 15mm; }
    body { background: white !important; color: #0f172a !important; font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print\\:hidden, button, .no-print { display: none !important; }
  </style>
</head>
<body>
  <div style="max-width: 900px; margin: 0 auto; padding: 20px;">
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

