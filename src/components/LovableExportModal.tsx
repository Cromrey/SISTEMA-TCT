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
  ExternalLink 
} from 'lucide-react';

interface LovableExportModalProps {
  onClose: () => void;
}

export const LovableExportModal: React.FC<LovableExportModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const promptText = generateLovablePrompt();

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                Exportador Especial • Lovable.dev
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Paquete de Código & Arquitectura Corporación TCT
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl space-y-2">
            <h4 className="font-black text-indigo-950 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Listo para Desplegar en Lovable.dev
            </h4>
            <p className="text-xs text-indigo-900">
              Este módulo genera el prompt maestro, la estructura de archivos modular y las especificaciones exactas del flujo de 6 fases y 12 pasos de Corporación TCT para clonar o importar directamente en <strong>Lovable.dev</strong>.
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
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Prompt'}</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={9}
              value={promptText}
              className="w-full p-3.5 text-xs font-mono bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 focus:outline-none"
            />
          </div>

          {/* Files Summary */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-blue-500" />
              Estructura de Componentes & Módulos Empaquetados
            </h4>
            <ul className="text-xs text-slate-600 space-y-1.5 font-mono">
              <li>📄 <strong>src/types.ts:</strong> Modelos de 12 pasos, finanzas, Ingest y roles</li>
              <li>📄 <strong>src/data/templateWorkflow.ts:</strong> Lógica de las 6 fases oficiales TCT</li>
              <li>📄 <strong>src/components/AdminDashboard.tsx:</strong> Panel de control y KPIs ejecutivos</li>
              <li>📄 <strong>src/components/EmployeePortal.tsx:</strong> Portal móvil para técnicos y regla 7:00 PM</li>
              <li>📄 <strong>src/components/ReportPrintModal.tsx:</strong> Generador de PDF oficial con sellos</li>
              <li>📄 <strong>src/components/ComparativeAnalytics.tsx:</strong> Gráficos Recharts y SLAs</li>
            </ul>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <a
            href="https://lovable.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <span>Ir a Lovable.dev</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
            >
              {copied ? '✓ Copiado' : 'Copiar Texto'}
            </button>
            <button
              onClick={downloadLovableBundle}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Bundle JSON</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
