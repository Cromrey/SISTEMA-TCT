export interface LovablePackage {
  title: string;
  version: string;
  framework: string;
  description: string;
  filesSummary: { path: string; purpose: string }[];
  promptForLovable: string;
  exportTimestamp: string;
}

export const generateLovablePrompt = (): string => {
  return `=== CORPORACIÓN TCT - SISTEMA DE MONITOREO Y PRODUCCIÓN AUDIOVISUAL ===
Crea un sistema web integral, profesional y ultra-intuitivo para monitorear y gestionar producciones audiovisuales, eventos y entregables para la empresa "Corporación TCT".

ESTRUCTURA DEL WORKFLOW DE 6 FASES Y 12 PASOS (Basado en el Diagrama Oficial TCT):

1. NEGOCIACIÓN Y CONTRATACIÓN:
   - Paso 1: Cotización Oficial TCT (Badge: CÓDIGO ÚNICO - Emisión de presupuesto y código exclusivo TCT-YYYY-XXXX).
   - Paso 2: Adelanto en Efectivo (Badge: OBLIGATORIO - Pago indispensable para congelar fecha en agenda).
   - Paso 3: Firma del Contrato (Firma formal especificando N° Cotización y Contrato).

2. PLANIFICACIÓN Y PREPARATIVOS DE PRODUCCIÓN:
   - Paso 4: Diseño del Flyer (Badge: 1 MES ANTES - Arte promocional con 30 días de anticipación).
   - Paso 5: Logística de Viaje (Coordinación de movilidad, personal técnico TCT, cámaras, dron y tiempos).

3. DÍA DEL EVENTO Y CLÁUSULA ESTRICTA DE PAGO:
   - Paso 6: Viaje y Filmación Técnica (Traslado del equipo y cobertura audiovisual completa).
   - Paso 7: REGLA DE COBRO EN CAMPO (Límite estricto: 7:00 PM):
     * SI CANCELA / ACUERDA: El equipo continúa la filmación hasta culminar todo el evento contratado.
     * SI NO CANCELA SIN ACUERDO: Retiro inmediato del personal técnico de Corporación TCT con acta técnica.
   - Paso 8: Resguardo de Material (Ingest) (Retorno a oficinas y respaldo inmediato en servidores RAID/NAS TCT con conteo de tarjetas SD y GB).

4. POST-PRODUCCIÓN Y MONTAJE AUDIOVISUAL:
   - Paso 9: Edición y Entrega en USB (Badge: 15 DÍAS HÁBILES - Edición general y recojo verificando SALDO EN S/. 0.00).
   - Paso 10: Publicación Garantizada (Badge: RESGUARDO DIGITAL - Subida de respaldo a YouTube, Facebook y TikTok TCT con enlaces directos).

5. FOTOLIBRO IMPRESO:
   - Paso 11: Entrega de Fotolibro (Badge: 30 DÍAS CALENDARIZADOS - Entrega física exactamente a los 30 días del evento con control de calidad).

6. DEPURACIÓN Y CIERRE:
   - Paso 12: Borrado de Archivos (Badge: LIBERACIÓN - Borrado definitivo seguro en servidores TCT tras conformidad total del cliente).

CARACTERÍSTICAS TÉCNICAS:
- Roles diferenciados: Panel Administrador (KPIs, finanzas, analíticas Recharts, asignaciones) y Portal Empleado Técnico (Checklists de campo, alerta 7:00 PM, registro de Ingest, entrega de USB con saldo $0).
- Offline-First con sincronización automática en LocalStorage e indicador de red.
- Gráficos comparativos y analíticos para toma de decisiones y alertas preventivas.
- Generador de reportes oficiales PDF/Print a todo color membretados con sellos y firmas de Corporación TCT.
- Diseño visual llamativo, claro y didáctico (estilo gamificado y accesible para jóvenes de 13 años y directivos).`;
};

export const downloadLovableBundle = (): void => {
  const packageData: LovablePackage = {
    title: 'Corporacion TCT - Sistema Integrado de Gestion Audiovisual 2026',
    version: '1.0.0',
    framework: 'React 19 + TypeScript + Tailwind CSS + Lucide Icons + Recharts',
    description: 'Sistema completo de seguimiento audiovisual con los 12 pasos oficiales de Corporación TCT, roles Admin/Técnico, regla 7:00 PM, Ingest, 15 días USB, 30 días Fotolibro y Reportes PDF.',
    filesSummary: [
      { path: 'src/types.ts', purpose: 'Definiciones de datos de producción, fases, pasos, personal, finanzas e Ingest' },
      { path: 'src/data/templateWorkflow.ts', purpose: 'Estructura oficial de las 6 fases y 12 pasos con checklists' },
      { path: 'src/data/initialData.ts', purpose: 'Datos demo de producciones activas, en edición, eventos de hoy y cerradas' },
      { path: 'src/utils/storage.ts', purpose: 'Persistencia LocalStorage, motor de alertas inteligentes y auto-sync' },
      { path: 'src/components/Header.tsx', purpose: 'Barra superior con switch de roles, estado online/offline y logo TCT' },
      { path: 'src/components/AdminDashboard.tsx', purpose: 'Panel ejecutivo para directivos con KPIs, finanzas y proyectos' },
      { path: 'src/components/EmployeePortal.tsx', purpose: 'Panel móvil/campo para técnicos, regla 7:00 PM, Ingest y checklists' },
      { path: 'src/components/ComparativeAnalytics.tsx', purpose: 'Gráficos comparativos, tiempos SLA y toma de decisiones' },
      { path: 'src/components/ContractExportModal.tsx', purpose: 'Generador de Contratos oficiales PDF con sellos TCT' }
    ],
    promptForLovable: generateLovablePrompt(),
    exportTimestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tct-audiovisual-lovable-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
