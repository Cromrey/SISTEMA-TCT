import React, { useState } from 'react';
import { ProductionProject } from '../types';
import { 
  Trash2, 
  X, 
  AlertTriangle, 
  FileText, 
  User, 
  Calendar, 
  ShieldAlert, 
  CheckSquare, 
  Square,
  Sparkles
} from 'lucide-react';

interface DeleteProjectConfirmModalProps {
  project: ProductionProject;
  onClose: () => void;
  onConfirmDelete: (projectId: string, reason: string, details: string) => void;
}

const PRESET_REASONS = [
  'Cancelación formal solicitada por el cliente',
  'Expediente de prueba / Creado por error operativo',
  'Contrato duplicado o reemplazado por nueva versión',
  'Postergación o anulación indefinida del evento',
  'Reestructuración comercial o cambio de paquete',
  'Falta de pago o desistimiento de firma de contrato',
  'Otro motivo personalizado'
];

export const DeleteProjectConfirmModal: React.FC<DeleteProjectConfirmModalProps> = ({
  project,
  onClose,
  onConfirmDelete
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [detailReason, setDetailReason] = useState<string>('');
  const [confirmedCheckbox, setConfirmedCheckbox] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedCheckbox) return;
    
    setIsSubmitting(true);
    const finalReason = selectedReason === 'Otro motivo personalizado' && detailReason.trim() 
      ? detailReason.trim() 
      : selectedReason;
    
    onConfirmDelete(project.id, finalReason, detailReason);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-red-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-900 border-b border-red-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block">
                SIGAT • Protocolo de Eliminación
              </span>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Eliminar Expediente
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {/* Project Summary Card */}
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
                  {project.uniqueCode}
                </span>
                {project.contractNumber && (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs">
                    {project.contractNumber}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {project.eventType}
              </span>
            </div>

            <div className="text-sm font-bold text-white">
              {project.title}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{project.clientName}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{project.eventDate}</span>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
              <span>Motivo de la Eliminación *</span>
              <span className="text-[10px] text-slate-500 font-normal">Requerido</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-red-500 transition-colors"
            >
              {PRESET_REASONS.map((reason) => (
                <option key={reason} value={reason} className="bg-slate-900 text-white">
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Detail / Justification */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Detalle / Justificación de la Eliminación
            </label>
            <textarea
              value={detailReason}
              onChange={(e) => setDetailReason(e.target.value)}
              rows={3}
              placeholder="Describa brevemente la razón por la cual se da de baja este expediente (opcional pero recomendado)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 transition-colors"
            />
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Atención:</strong> Esta acción borrará el expediente y su contrato de la base de datos de SIGAT. Se actualizará en tiempo real para todos los usuarios y administradores.
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={confirmedCheckbox}
              onChange={(e) => setConfirmedCheckbox(e.target.checked)}
              className="sr-only"
            />
            <div className="mt-0.5 text-amber-400 shrink-0">
              {confirmedCheckbox ? (
                <CheckSquare className="w-4 h-4 text-red-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <span className="text-xs font-bold text-slate-300 leading-snug">
              Confirmo que deseo eliminar este expediente definitivamente y registrar el motivo en el sistema.
            </span>
          </label>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!confirmedCheckbox || isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md hover:shadow-red-600/30 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Eliminando...' : 'Eliminar Expediente'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
