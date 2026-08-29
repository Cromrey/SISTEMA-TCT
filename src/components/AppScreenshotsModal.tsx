import React from 'react';
import { 
  Layers, 
  X, 
  Camera, 
  ShieldCheck, 
  UserCheck, 
  AlertOctagon, 
  HardDrive, 
  Film, 
  BookOpen, 
  FileText, 
  BarChart3,
  Download
} from 'lucide-react';

interface AppScreenshotsModalProps {
  onClose: () => void;
}

const SCREENS = [
  {
    id: 'scr-1',
    title: '1. Dashboard Principal del Administrador TCT',
    category: 'Panel Directivo',
    badge: 'CONTROL TOTAL',
    badgeColor: 'bg-amber-100 text-amber-900',
    description: 'Vista ejecutiva con KPIs de recaudación, saldos por cobrar, almacenamiento en servidores RAID, semáforo de eventos de hoy y tabla de producciones.',
    features: ['5 Tarjetas de Métricas', 'Filtro por las 6 Fases', 'Alertas en Tiempo Real', 'Búsqueda por Código TCT']
  },
  {
    id: 'scr-2',
    title: '2. Diagrama Interactivo de Flujo (12 Pasos Oficiales)',
    category: 'Metodología Didáctica',
    badge: 'GUÍA ILUSTRADA',
    badgeColor: 'bg-emerald-100 text-emerald-900',
    description: 'Barra de progreso visual interactiva basada fielmente en la infografía de Corporación TCT, con badges distintivos y porcentajes de avance.',
    features: ['Badges Oficiales TCT', 'Porcentaje de Avance', 'Checklist por Paso', 'Navegación Táctil']
  },
  {
    id: 'scr-3',
    title: '3. Portal Móvil para Empleados & Técnicos de Campo',
    category: 'Panel Operativo',
    badge: 'CAMPO & EDICIÓN',
    badgeColor: 'bg-blue-100 text-blue-900',
    description: 'Diseño accesible para jóvenes de 13 años y técnicos con botones grandes, pase de lista de cámaras Sony FX3/Dron y tareas asignadas.',
    features: ['Pase de Lista de Cámaras', 'Botones de Acción Rápida', 'Gamificación con Confeti', 'Modo Offline Auto-Sync']
  },
  {
    id: 'scr-4',
    title: '4. Módulo Estricto: Regla de Cobro en Campo (Límite 7:00 PM)',
    category: 'Cláusula de Oro',
    badge: 'LÍMITE 7:00 PM',
    badgeColor: 'bg-red-100 text-red-900 font-bold',
    description: 'Panel de validación de pago antes de las 7:00 PM. Permite autorizar la continuidad de filmación o activar el protocolo de retiro de personal.',
    features: ['Botón Sí Cancela / Acuerda', 'Botón Reportar Retiro', 'Registro de Recibo', 'Liquidación Saldo $0']
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
    description: 'Control de tiempos SLA con bloqueo de entrega de USB hasta verificar que el saldo esté en $0.00 y enlaces directos a YouTube y TikTok.',
    features: ['Regla Estricta Saldo $0', 'Enlaces a Redes Sociales', 'Control de Calidad Álbum', 'Acta de Conformidad']
  },
  {
    id: 'scr-7',
    title: '7. Gráficos Comparativos & Motor de Toma de Decisiones',
    category: 'Business Intelligence',
    badge: 'ANALÍTICAS',
    badgeColor: 'bg-indigo-100 text-indigo-900',
    description: 'Gráficos analíticos Recharts con comparativa de recaudación por tipo de evento, tiempos reales vs SLA y sugerencias para gerencia.',
    features: ['Barras Recaudado vs Saldo', 'Donut Distribución Fases', 'SLA Tiempos Promedio', 'Sugerencias TCT']
  },
  {
    id: 'scr-8',
    title: '8. Exportación de Contratos Oficiales PDF A4',
    category: 'Documentación Oficial',
    badge: 'PDF OFICIAL',
    badgeColor: 'bg-slate-900 text-amber-400 font-bold',
    description: 'Generación digital de contratos membretados oficiales de Corporación TCT con desglose de cláusulas, balances financieros y envío directo a WhatsApp.',
    features: ['Membrete Corporación TCT', 'Código Único y Contrato', 'Firmas Autorizadas', 'Descarga Vectorial PDF']
  }
];

export const AppScreenshotsModal: React.FC<AppScreenshotsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                Galería de Vistas • Corporación TCT
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Documentación Visual de Pantallas y Formularios del Sistema
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gallery Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-2xl">
            <p className="text-xs text-cyan-950 font-medium">
              Esta galería resume todas las interfaces, formularios y módulos del sistema de monitoreo audiovisual de <strong>Corporación TCT</strong>, facilitando su revisión para auditoría, capacitación y exportación a Lovable.dev.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SCREENS.map(scr => (
              <div key={scr.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
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

        {/* Footer */}
        <div className="print:hidden px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Total 8 vistas clave documentadas para Corporación TCT
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
          >
            Cerrar Galería
          </button>
        </div>

      </div>
    </div>
  );
};
