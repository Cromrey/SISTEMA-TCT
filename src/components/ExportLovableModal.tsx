import React, { useState } from 'react';
import { downloadLovableBundle, generateLovablePrompt } from '../utils/lovableExport';
import { 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  X, 
  Code, 
  FileText, 
  FolderTree, 
  ExternalLink,
  Layers,
  Printer,
  Camera,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface ExportLovableModalProps {
  onClose: () => void;
}

const SCREENS = [
  {
    id: 'scr-1',
    title: '1. Dashboard Principal del Administrador TCT',
    category: 'Panel Directivo',
    badge: 'CONTROL TOTAL',
    badgeColor: 'bg-amber-100 text-amber-900',
    description: 'Vista ejecutiva con KPIs de recaudación en Soles (S/.), saldos por cobrar, almacenamiento en servidores RAID, semáforo de eventos de hoy, calendario integrado y tabla de producciones con filtros rápidos de fases.',
    features: ['5 Tarjetas de Métricas', 'Filtros Pre/Prod/Post', 'Alertas en Tiempo Real', 'Búsqueda por Código TCT']
  },
  {
    id: 'scr-2',
    title: '2. Diagrama Interactivo de Flujo (12 Pasos Oficiales Secuenciales)',
    category: 'Metodología Didáctica',
    badge: 'GUÍA ILUSTRADA',
    badgeColor: 'bg-emerald-100 text-emerald-900',
    description: 'Barra de progreso visual interactiva basada fielmente en la infografía de Corporación TCT, con badges distintivos, candado de secuencia obligatoria y adjuntos de evidencias.',
    features: ['Badges Oficiales TCT', 'Porcentaje de Avance', 'Candados Secuenciales', 'Subida de Adjuntos']
  },
  {
    id: 'scr-3',
    title: '3. Portal para Empleados & Técnicos de Campo',
    category: 'Panel Operativo',
    badge: 'CAMPO & EDICIÓN',
    badgeColor: 'bg-blue-100 text-blue-900',
    description: 'Diseño accesible para jóvenes de 13 años y técnicos con botones grandes, calendario de eventos asignados y estadísticas de sus propios contratos.',
    features: ['Filtro de Propios Contratos', 'Calendario Mes/Semana/Año', 'Gamificación con Confeti', 'Modo Offline con Cola']
  },
  {
    id: 'scr-4',
    title: '4. Módulo Estricto: Regla de Cobro en Campo (Límite 7:00 PM)',
    category: 'Cláusula de Oro',
    badge: 'LÍMITE 7:00 PM',
    badgeColor: 'bg-red-100 text-red-900 font-bold',
    description: 'Panel de validación de pago antes de las 7:00 PM en Soles (S/.). Permite autorizar la continuidad de filmación o activar el protocolo de retiro de personal.',
    features: ['Botón Sí Cancela / Acuerda', 'Botón Reportar Retiro', 'Registro de Recibo S/.', 'Liquidación Saldo S/. 0.00']
  },
  {
    id: 'scr-5',
    title: '5. Módulo de Resguardo de Material (Ingest en Servidores)',
    category: 'Storage & Backup',
    badge: 'SERVIDOR TCT',
    badgeColor: 'bg-yellow-100 text-yellow-900',
    description: 'Formulario para certificar la descarga segura de tarjetas SD 4K, conteo de Gigabytes y almacenamiento en el sistema RAID de Corporación TCT.',
    features: ['Conteo de Tarjetas SD', 'Registro de Gigabytes (GB)', 'Verificación RAID', 'Técnico Responsable']
  },
  {
    id: 'scr-6',
    title: '6. Post-Producción USB (15 Días Hábiles) & Fotolibro (30 Días)',
    category: 'Entregables',
    badge: '15 Y 30 DÍAS',
    badgeColor: 'bg-purple-100 text-purple-900',
    description: 'Control de tiempos SLA con bloqueo de entrega de USB hasta verificar que el saldo esté en S/. 0.00 y enlaces directos a YouTube y TikTok.',
    features: ['Regla Estricta Saldo S/. 0', 'Enlaces a Redes Sociales', 'Control de Calidad Álbum', 'Acta de Conformidad']
  },
  {
    id: 'scr-7',
    title: '7. Gráficos Comparativos & Motor de Toma de Decisiones',
    category: 'Business Intelligence',
    badge: 'ANALÍTICAS',
    badgeColor: 'bg-indigo-100 text-indigo-900',
    description: 'Gráficos analíticos Recharts con comparativa de recaudación, cumplimiento de pasos por fase, comparativa por personal técnico y sugerencias gerenciales.',
    features: ['Barras Recaudado vs Saldo', 'Donut Distribución Fases', 'SLA Tiempos Promedio', 'Sugerencias TCT']
  },
  {
    id: 'scr-8',
    title: '8. Reporte Oficial Imprimible PDF a Todo Color',
    category: 'Documentación Oficial',
    badge: 'PDF OFICIAL',
    badgeColor: 'bg-slate-900 text-amber-400 font-bold',
    description: 'Hoja membretada oficial de Corporación TCT con desglose de los 12 pasos, balances financieros en Soles (S/.), certificación de Ingest y firmas de conformidad.',
    features: ['Membrete Corporación TCT', 'Código Único y Contrato', 'Firmas Autorizadas', 'Optimizado para Impresión']
  }
];

export const ExportLovableModal: React.FC<ExportLovableModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'screenshots'>('code');
  const [copied, setCopied] = useState(false);
  const promptText = generateLovablePrompt();

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintScreenshots = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-800/40 flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                Exportador Oficial TCT
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Código Lovable.dev & Capturas de Pantallas del Sistema
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'code' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Código & Prompt Lovable.dev</span>
            </button>
            <button
              onClick={() => setActiveTab('screenshots')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'screenshots' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Capturas & Vistas del Sistema (8)</span>
            </button>
          </div>

          {activeTab === 'screenshots' && (
            <button
              onClick={handlePrintScreenshots}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Exportar PDF de Vistas</span>
            </button>
          )}
        </div>

        {/* Tab 1: Code & Prompt Lovable */}
        {activeTab === 'code' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
            
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl space-y-2">
              <h4 className="font-black text-indigo-950 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Paquete de Exportación Directa a Lovable.dev
              </h4>
              <p className="text-xs text-indigo-900">
                Este módulo genera el prompt maestro, la estructura modular de archivos y las especificaciones exactas del flujo de 6 fases y 12 pasos de Corporación TCT para clonar, desplegar o sincronizar en <strong>Lovable.dev</strong>.
              </p>
            </div>

            {/* Prompt Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Prompt Maestro Optimizado para Lovable
                </label>

                <button
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Prompt'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={10}
                value={promptText}
                className="w-full p-4 text-xs font-mono bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 focus:outline-none"
              />
            </div>

            {/* Files Summary */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-blue-500" />
                Estructura de Componentes & Módulos Empaquetados
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 font-mono">
                <li>📄 <strong>src/types.ts:</strong> Modelos de 12 pasos, finanzas en Soles (S/.), Ingest, cola offline y roles</li>
                <li>📄 <strong>src/data/templateWorkflow.ts:</strong> Lógica de las 6 fases oficiales secuenciales TCT</li>
                <li>📄 <strong>src/components/AdminDashboard.tsx:</strong> Panel de control con filtros rápidos Pre/Prod/Post</li>
                <li>📄 <strong>src/components/StaffDashboard.tsx:</strong> Portal para técnicos con calendario y estadísticas propias</li>
                <li>📄 <strong>src/components/CalendarView.tsx:</strong> Calendario integrado Mes / Semana / Año</li>
                <li>📄 <strong>src/components/ComparativeAnalyticsModal.tsx:</strong> Gráficos Recharts y SLAs</li>
                <li>📄 <strong>src/components/ReportPrintModal.tsx:</strong> Generador de PDF oficial con sellos y firmas TCT</li>
              </ul>
            </div>

          </div>
        )}

        {/* Tab 2: Screenshots and Visual Specs */}
        {activeTab === 'screenshots' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
            
            <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-2xl">
              <p className="text-xs text-cyan-950 font-medium">
                Esta galería resume todas las interfaces, formularios y módulos del sistema de monitoreo audiovisual de <strong>Corporación TCT</strong>, facilitando su revisión para auditoría, capacitación y exportación a Lovable.dev.
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCREENS.map(scr => (
                <div key={scr.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                        {scr.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${scr.badgeColor}`}>
                        {scr.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 mt-1">
                      {scr.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1.5">
                      {scr.description}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Componentes Clave:</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-slate-700">
                      {scr.features.map((f, i) => (
                        <div key={i} className="flex items-center space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <a
            href="https://lovable.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <span>Abrir Lovable.dev</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar Prompt'}
            </button>
            <button
              onClick={downloadLovableBundle}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Paquete Lovable JSON</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
