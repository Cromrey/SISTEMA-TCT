import React, { useState } from 'react';
import { ProductionProject, UserRole } from '../types';
import { TCTLogo } from './TCTLogo';
import { printElement, downloadPrintableHtml, downloadEditableDoc } from '../utils/printHelper';
import { 
  Printer, 
  X, 
  FileCheck, 
  ShieldCheck, 
  Coins, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  Sparkles, 
  Lock, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Download,
  FileText,
  FileCode
} from 'lucide-react';

interface ContractExportModalProps {
  project: ProductionProject;
  currentRole: UserRole;
  onClose: () => void;
  onUpdateProject?: (updated: ProductionProject) => void;
}

export const ContractExportModal: React.FC<ContractExportModalProps> = ({
  project,
  currentRole,
  onClose,
  onUpdateProject
}) => {
  const isAdmin = currentRole === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<ProductionProject>({ ...project });
  const [copySuccess, setCopySuccess] = useState(false);

  const handlePrint = () => {
    printElement('tct-contract-document', `Contrato-${currentData.contractNumber || currentData.uniqueCode}`);
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml(
      'tct-contract-document',
      `Contrato-${currentData.contractNumber || currentData.uniqueCode}.html`,
      `Contrato Oficial TCT - ${currentData.contractNumber}`
    );
  };

  const handleDownloadWordDoc = () => {
    downloadEditableDoc(
      'tct-contract-document',
      `Contrato-${currentData.contractNumber || currentData.uniqueCode}-Editable.doc`,
      `Contrato Oficial TCT - ${currentData.contractNumber}`
    );
  };

  const handleSaveEdits = () => {
    if (onUpdateProject) {
      onUpdateProject(editedProject);
    }
    setIsEditing(false);
  };

  const currentData = isEditing ? editedProject : project;

  const totalExtraHours = (currentData.extraHoursCount || 0) * (currentData.extraHourRate || 150);
  const computedTotal = (currentData.listPrice || currentData.totalBudget) - (currentData.discountAmount || 0) + totalExtraHours;
  const balanceRemaining = Math.max(0, computedTotal - currentData.initialDeposit - (currentData.fieldPayment || 0));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Top Control Bar (Hidden during Print) */}
        <div className="print:hidden px-4 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <TCTLogo size="xs" variant="icon-only" />
            <div>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                Corporación TCT • Contrato Oficial de Prestación de Servicios
              </span>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>{currentData.contractNumber}</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-slate-300 font-bold">{currentData.clientName}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-1">
            {/* Admin Edit Controls */}
            {isAdmin ? (
              isEditing ? (
                <button
                  onClick={handleSaveEdits}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Editar (Admin)</span>
                </button>
              )
            ) : (
              <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Modo Técnico</span>
              </span>
            )}

            {/* Print / PDF Export Button */}
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="Abrir cuadro de diálogo de impresión y Guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>PDF / Imprimir</span>
            </button>

            {/* Download Word Editable Document (.doc) */}
            <button
              onClick={handleDownloadWordDoc}
              className="px-3 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Descargar Contrato Editable para Microsoft Word (.doc) / Google Docs"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Word Editable (.doc)</span>
            </button>

            {/* Direct Download HTML */}
            <button
              onClick={handleDownloadHtml}
              className="px-2.5 sm:px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 shadow-sm flex items-center gap-1 transition-all cursor-pointer"
              title="Descargar archivo web imprimible"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">.HTML</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Contract Document Container (Strictly sized for 1-page A4 vertical) */}
        <div id="tct-contract-document" className="relative p-5 sm:p-7 overflow-y-auto space-y-3 flex-1 bg-white text-slate-900 font-sans print:p-2 print:space-y-2">
          
          {/* Watermark Logo Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none p-8">
            <TCTLogo size="2xl" variant="watermark" className="w-full max-w-sm" />
          </div>

          {/* Official Letterhead Header */}
          <div className="relative flex items-center justify-between border-b-2 border-slate-950 pb-2.5 page-break-inside-avoid">
            <div className="flex items-center space-x-3">
              <TCTLogo size="sm" variant="icon-only" />
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase">
                  CORPORACIÓN TCT
                </h1>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                  Servicios Audiovisuales, Producción Cinematográfica & Fotografía Profesional
                </p>
                <p className="text-[9px] text-slate-500 font-mono">
                  RUC: 20608941253 • Jr. Las Camelias 450, San Isidro, Lima • Tel: (01) 748-9200
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-xs font-black bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg inline-block border border-slate-800 shadow-xs">
                {currentData.contractNumber}
              </div>
              {currentData.quotationCode && (
                <p className="text-[10px] font-bold text-slate-700 font-mono mt-0.5">
                  Cotización Ref: {currentData.quotationCode}
                </p>
              )}
              <p className="text-[10px] font-bold text-slate-600">
                Código Exp: {currentData.uniqueCode}
              </p>
              <p className="text-[9px] text-slate-500">
                Fecha Emisión: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Contract Main Title */}
          <div className="text-center py-1 border-b border-slate-200 page-break-inside-avoid">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
              CONTRATO PRIVADO DE PRESTACIÓN DE SERVICIOS AUDIOVISUALES
            </h2>
            <p className="text-[10px] text-slate-600">
              Conste por el presente documento el contrato de servicios celebrado entre <strong>CORPORACIÓN TCT</strong> y <strong>EL CLIENTE</strong>.
            </p>
          </div>

          {/* Clause 1: Parties */}
          <div className="space-y-1 page-break-inside-avoid">
            <h3 className="font-black text-slate-900 uppercase tracking-wide flex items-center gap-1 text-[11px]">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-400 text-[9px] flex items-center justify-center font-bold">1</span>
              CLÁUSULA PRIMERA: DE LAS PARTES Y ASESOR RESPONSABLE
            </h3>
            
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] leading-relaxed">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">EL PRESTADOR (CORPORACIÓN TCT):</span>
                <p className="font-black text-slate-900">CORPORACIÓN TCT S.A.C.</p>
                <p className="text-slate-600">RUC: 20608941253</p>
                <p className="text-slate-600">
                  <strong>Asesor Comercial:</strong> {currentData.contractHolder || 'Ing. Roberto Acuña - Asesor Principal'}
                </p>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">EL CLIENTE (CONTRATANTE):</span>
                {isEditing ? (
                  <div className="space-y-1 pt-0.5">
                    <input
                      type="text"
                      value={editedProject.clientName}
                      onChange={(e) => setEditedProject({ ...editedProject, clientName: e.target.value })}
                      className="w-full p-1 text-[11px] font-bold border border-slate-300 rounded-md"
                      placeholder="Nombre Completo"
                    />
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        value={editedProject.clientDniRuc || ''}
                        onChange={(e) => setEditedProject({ ...editedProject, clientDniRuc: e.target.value })}
                        className="w-full p-1 text-[10px] border border-slate-300 rounded-md"
                        placeholder="DNI / RUC"
                      />
                      <input
                        type="text"
                        value={editedProject.clientPhone}
                        onChange={(e) => setEditedProject({ ...editedProject, clientPhone: e.target.value })}
                        className="w-full p-1 text-[10px] border border-slate-300 rounded-md"
                        placeholder="Teléfono"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-black text-slate-900 text-xs">{currentData.clientName}</p>
                    <p className="text-slate-600">
                      <strong>DNI / RUC:</strong> {currentData.clientDniRuc || '73849201'} • <strong>Teléfono:</strong> {currentData.clientPhone}
                    </p>
                    <p className="text-slate-600">
                      <strong>Correo:</strong> {currentData.clientEmail || 'contacto@cliente.com'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Clause 2: Event Details & Location */}
          <div className="space-y-1 page-break-inside-avoid">
            <h3 className="font-black text-slate-900 uppercase tracking-wide flex items-center gap-1 text-[11px]">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-400 text-[9px] flex items-center justify-center font-bold">2</span>
              CLÁUSULA SEGUNDA: DEL OBJETO DEL SERVICIO, FECHA Y LOCACIÓN
            </h3>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Tipo de Evento & Paquete</span>
                <p className="font-black text-slate-900 text-[11px]">{currentData.eventType}</p>
                <p className="text-blue-700 font-bold">{currentData.selectedPackageName || 'Paquete Integral TCT'}</p>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Fecha y Horario de Cobertura</span>
                <p className="font-black text-slate-900 text-[11px]">{currentData.eventDate}</p>
                <p className="text-slate-700 font-bold">{currentData.eventTime} ({currentData.standardHours || 8} horas base)</p>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Locación y Dirección Exacta</span>
                <p className="font-bold text-slate-900">{currentData.eventLocation}</p>
                <p className="text-slate-600">{currentData.eventAddress || 'Lima Metropolitana'}</p>
              </div>
            </div>
          </div>

          {/* Clause 3: Economic Conditions & Soles Breakdown */}
          <div className="space-y-1 page-break-inside-avoid">
            <h3 className="font-black text-slate-900 uppercase tracking-wide flex items-center gap-1 text-[11px]">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-400 text-[9px] flex items-center justify-center font-bold">3</span>
              CLÁUSULA TERCERA: PRECIO, CONDICIONES DE PAGO (SOLES S/.) Y REGLA 7:00 PM
            </h3>

            <table className="w-full text-[10px] text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-white text-[9px] uppercase font-black">
                <tr>
                  <th className="p-1.5">Concepto Económico</th>
                  <th className="p-1.5">Detalle / Medios</th>
                  <th className="p-1.5 text-right">Monto (S/.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="p-1.5 font-bold">Precio de Lista Base (Paquete Oficial)</td>
                  <td className="p-1.5 text-slate-600">{currentData.selectedPackageName || 'Servicio Audiovisual'}</td>
                  <td className="p-1.5 text-right font-mono font-bold">S/. {(currentData.listPrice || currentData.totalBudget).toLocaleString()}</td>
                </tr>
                {currentData.discountAmount && currentData.discountAmount > 0 ? (
                  <tr className="bg-emerald-50/50">
                    <td className="p-1.5 font-bold text-emerald-900">Descuento Promocional Autorizado</td>
                    <td className="p-1.5 text-emerald-800 text-[9px]">{currentData.discountReason || 'Bonificación Comercial'}</td>
                    <td className="p-1.5 text-right font-mono font-bold text-emerald-700">- S/. {currentData.discountAmount.toLocaleString()}</td>
                  </tr>
                ) : null}
                {currentData.extraHoursCount && currentData.extraHoursCount > 0 ? (
                  <tr>
                    <td className="p-1.5 font-bold text-purple-900">Horas Adicionales ({currentData.extraHoursCount} hrs)</td>
                    <td className="p-1.5 text-slate-600 text-[9px]">Tarifa S/. {currentData.extraHourRate || 150} / hr</td>
                    <td className="p-1.5 text-right font-mono font-bold text-purple-900">+ S/. {totalExtraHours.toLocaleString()}</td>
                  </tr>
                ) : null}
                <tr className="bg-slate-100 font-black">
                  <td className="p-1.5 text-slate-900">PRESUPUESTO TOTAL PACTADO:</td>
                  <td className="p-1.5 text-slate-600 text-[9px]">Moneda: Soles Peruanos (PEN)</td>
                  <td className="p-1.5 text-right font-black font-mono text-xs text-slate-950">S/. {computedTotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold text-slate-900">1. Adelanto Inicial (Firma / Reserva)</td>
                  <td className="p-1.5 text-slate-600">{currentData.paymentMethodDeposit || 'Transferencia Bancaria / Efectivo'}</td>
                  <td className="p-1.5 text-right font-mono font-bold text-emerald-700">S/. {currentData.initialDeposit.toLocaleString()}</td>
                </tr>
                <tr className="bg-amber-50/60 font-bold">
                  <td className="p-1.5 text-amber-950">2. Saldo en Campo (Límite 7:00 PM)</td>
                  <td className="p-1.5 text-amber-900 text-[9px]">
                    * Obligatorio liquidar en locación antes de 7:00 PM para habilitar postproducción
                  </td>
                  <td className="p-1.5 text-right font-mono font-black text-amber-950">S/. {balanceRemaining.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Clause 4: Deliverables & SLAs */}
          <div className="space-y-1 page-break-inside-avoid">
            <h3 className="font-black text-slate-900 uppercase tracking-wide flex items-center gap-1 text-[11px]">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-400 text-[9px] flex items-center justify-center font-bold">4</span>
              CLÁUSULA CUARTA: ENTREGABLES Y PLAZOS ESTRICTOS (SLA)
            </h3>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-[10px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block">🎬 Video Master & Trailer</span>
                  <span className="text-[10px] text-purple-700 font-bold">Plazo: 15 días hábiles</span>
                  <p className="text-[9px] text-slate-500">Enlace digital y resguardo en Servidor</p>
                </div>

                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block">📖 Fotolibro Impreso</span>
                  <span className="text-[10px] text-pink-700 font-bold">{currentData.includesPhotobook ? 'Plazo: 30 días hábiles' : 'No incluido en paquete'}</span>
                  <p className="text-[9px] text-slate-500">Maquetación, aprobación y encuadernado</p>
                </div>

                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900 block">💾 Estuche Madera & USB 3.0</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Entrega con Saldo S/. 0</span>
                  <p className="text-[9px] text-slate-500">Material final en alta definición 4K</p>
                </div>
              </div>

              <p className="text-[9px] text-slate-600 italic">
                * Conforme al Paso 12 del flujo oficial, CORPORACIÓN TCT conservará los archivos RAW originales por 30 días posteriores a la entrega final.
              </p>
            </div>
          </div>

          {/* Official Signatures */}
          <div className="pt-4 border-t-2 border-slate-950 grid grid-cols-2 gap-6 text-center text-[10px] page-break-inside-avoid">
            <div className="space-y-6">
              <div className="h-9 border-b border-slate-400 w-44 mx-auto flex items-end justify-center pb-0.5">
                <span className="font-mono text-[9px] text-slate-400">Firma & Sello Corporativo</span>
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase">CORPORACIÓN TCT S.A.C.</p>
                <p className="text-[9px] text-slate-500">Director de Producción / Asesor Comercial</p>
                <p className="text-[8px] text-slate-400 font-mono">RUC: 20608941253</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-9 border-b border-slate-400 w-44 mx-auto flex items-end justify-center pb-0.5">
                <span className="font-mono text-[9px] text-slate-400">Firma del Cliente</span>
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase">{currentData.clientName}</p>
                <p className="text-[9px] text-slate-500">DNI / RUC: {currentData.clientDniRuc || '__________________'}</p>
                <p className="text-[8px] text-slate-400">El Contratante</p>
              </div>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 pt-1.5 border-t border-slate-100 font-mono page-break-inside-avoid">
            Documento de Contrato emitido formalmente por el Sistema Corporación TCT • Lima, Perú
          </div>

        </div>

      </div>
    </div>
  );
};
