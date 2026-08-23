import React, { useState } from 'react';
import { ProductionProject, UserRole } from '../types';
import { TCTLogo } from './TCTLogo';
import { printElement, downloadPrintableHtml, downloadEditableDoc } from '../utils/printHelper';
import { finalizeContractExportStep3 } from '../utils/stepSequenceHelper';
import { getStoredUsers } from '../utils/authStorage';
import { 
  Printer, 
  X, 
  Edit3, 
  Save, 
  Zap,
  Download,
  FileText
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
  const [exportCulminated, setExportCulminated] = useState(Boolean(project.contractExported));

  const handleFinalizeAndRegisterExport = () => {
    if (onUpdateProject) {
      const finalized = finalizeContractExportStep3(
        isEditing ? editedProject : project,
        'Administrador TCT'
      );
      onUpdateProject(finalized);
      setEditedProject(finalized);
    }
    setExportCulminated(true);
    setIsEditing(false);
  };

  const handlePrint = () => {
    handleFinalizeAndRegisterExport();
    printElement('tct-contract-document', `Contrato-${currentData.contractNumber || currentData.uniqueCode}`);
  };

  const handleDownloadHtml = () => {
    handleFinalizeAndRegisterExport();
    downloadPrintableHtml(
      'tct-contract-document',
      `Contrato-${currentData.contractNumber || currentData.uniqueCode}.html`,
      `Contrato Oficial - ${currentData.contractNumber || currentData.uniqueCode}`
    );
  };

  const handleDownloadWordDoc = () => {
    handleFinalizeAndRegisterExport();
    downloadEditableDoc(
      'tct-contract-document',
      `Contrato-${currentData.contractNumber || currentData.uniqueCode}-Editable.doc`,
      `Contrato Oficial - ${currentData.contractNumber || currentData.uniqueCode}`
    );
  };

  const handleSaveEdits = () => {
    if (onUpdateProject) {
      onUpdateProject(editedProject);
    }
    setIsEditing(false);
  };

  const currentData = isEditing ? editedProject : project;

  const systemUsers = getStoredUsers();
  const matchedUser = systemUsers.find(u => 
    (currentData.createdByName && u.fullName.toLowerCase().includes(currentData.createdByName.toLowerCase())) ||
    (currentData.contractHolder && u.fullName.toLowerCase().includes(currentData.contractHolder.toLowerCase())) ||
    (currentData.createdByDni && u.dni === currentData.createdByDni) ||
    (currentData.contractHolderDni && u.dni === currentData.contractHolderDni)
  );

  const advisorName = currentData.createdByName || matchedUser?.fullName || (currentData.contractHolder ? currentData.contractHolder.split(' - ')[0] : 'Michael Romero');
  const advisorDni = currentData.createdByDni || currentData.contractHolderDni || matchedUser?.dni || '45892314';
  const advisorPhone = matchedUser?.phone || '+51 990 030 200';
  const advisorEmail = matchedUser?.email || 'ventas@corporaciontct.pe';

  const totalExtraHours = (currentData.extraHoursCount || 0) * (currentData.extraHourRate || 150);
  const computedTotal = (currentData.listPrice || currentData.totalBudget) - (currentData.discountAmount || 0) + totalExtraHours;
  const balanceRemaining = Math.max(0, computedTotal - currentData.initialDeposit - (currentData.fieldPayment || 0));

  const isLockedAfterRegistration = currentData.initialCommercialLocked || currentData.contractExported;

  const hasSpecialClause = Boolean(currentData.specialContractClause && currentData.specialContractClause.trim().length > 0);

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

          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-1.5">
            {/* Admin Edit Controls (Only if Admin) */}
            {isAdmin && (
              isEditing ? (
                <button
                  onClick={handleSaveEdits}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Guardar Cambios del Contrato"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Editar datos del Contrato (Exclusivo Administrador)"
                >
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Editar Contrato</span>
                </button>
              )
            )}

            {/* Culminate Step 3 / 25.00% Action Button */}
            <button
              onClick={handleFinalizeAndRegisterExport}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                exportCulminated
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 animate-pulse'
              }`}
              title="Culminar formalmente el Paso 3 (Firma/Exportación), fijar avance al 25.00% y habilitar el Paso 4"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{exportCulminated ? '✓ 25.00% Registrado (Paso 4 Habilitado)' : 'Culminar Exportación (25.00%)'}</span>
            </button>

            {/* Guardar en PDF / Imprimir Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
              title="Guardar en PDF o Imprimir Contrato Oficial"
            >
              <Printer className="w-4 h-4" />
              <span>Guardar en PDF / Imprimir</span>
            </button>

            {/* Word Editable (.doc) Button */}
            <button
              onClick={handleDownloadWordDoc}
              className="px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              title="Descargar Contrato en Word Editable (.doc)"
            >
              <FileText className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Word (.doc)</span>
            </button>

            {/* Download HTML Button */}
            <button
              onClick={handleDownloadHtml}
              className="px-2.5 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 shadow-sm flex items-center gap-1 transition-all cursor-pointer"
              title="Descargar archivo HTML del Contrato"
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
                  <strong>Asesor Comercial:</strong> {advisorName} (DNI: {advisorDni})
                </p>
                <p className="text-slate-600">
                  <strong>Celular Asesor:</strong> {advisorPhone} • <strong>Correo:</strong> {advisorEmail}
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
                    <input
                      type="text"
                      value={editedProject.clientAddress || ''}
                      onChange={(e) => setEditedProject({ ...editedProject, clientAddress: e.target.value })}
                      className="w-full p-1 text-[10px] border border-slate-300 rounded-md"
                      placeholder="Domicilio Exacto del Cliente"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-black text-slate-900 text-xs">{currentData.clientName}</p>
                    <p className="text-slate-600">
                      <strong>DNI / RUC:</strong> {currentData.clientDniRuc || '73849201'} • <strong>Teléfono:</strong> {currentData.clientPhone}
                    </p>
                    {currentData.clientAddress && (
                      <p className="text-slate-600">
                        <strong>Domicilio:</strong> {currentData.clientAddress}
                      </p>
                    )}
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
              CLÁUSULA SEGUNDA: DEL OBJETO DEL SERVICIO, FECHAS DE TRABAJO Y LOCACIÓN
            </h3>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 text-[10px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Tipo de Evento & Paquete</span>
                  <p className="font-black text-slate-900 text-[11px]">{currentData.eventType}</p>
                  <p className="text-blue-700 font-bold">{currentData.selectedPackageName || 'Paquete Integral TCT'}</p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Locación y Dirección Exacta</span>
                  <p className="font-bold text-slate-900">{currentData.eventLocation}</p>
                  <p className="text-slate-600">{currentData.eventAddress || 'Lima Metropolitana'}</p>
                </div>
              </div>

              {/* Work days display: 1 line per day */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[9px] uppercase font-black text-slate-700 block mb-1">
                  📅 Cronograma de Jornadas de Trabajo / Cobertura ({currentData.eventSchedules && currentData.eventSchedules.length > 0 ? currentData.eventSchedules.length : 1} {currentData.eventSchedules && currentData.eventSchedules.length > 1 ? 'días' : 'día'}):
                </span>
                
                <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {currentData.eventSchedules && currentData.eventSchedules.length > 0 ? (
                    currentData.eventSchedules.map((sch, idx) => (
                      <div key={sch.id || `sch-${sch.date || idx}-${idx}`} className="pt-1 first:pt-0 flex items-center justify-between flex-wrap text-[10px]">
                        <span className="font-bold text-slate-900 font-mono">
                          Día {idx + 1}: {sch.date}
                        </span>
                        <span className="text-slate-700 font-medium">
                          Horario: <strong>{sch.startTime}</strong> a <strong>{sch.endTime}</strong>
                          {sch.notes ? ` (${sch.notes})` : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-900 font-mono">
                        Día 1: {currentData.eventDate}
                      </span>
                      <span className="text-slate-700 font-medium">
                        Horario: <strong>{currentData.eventTime || 'Horario pactado'}</strong> ({currentData.standardHours || 8} horas base)
                      </span>
                    </div>
                  )}
                </div>
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
                  <td className="p-1.5 text-slate-600">
                    {currentData.paymentMethodDeposit || 'Transferencia Bancaria'}
                    {(currentData.depositBankName || currentData.depositOperationCode) && (
                      <span className="text-[9px] text-slate-500 block font-mono">
                        {currentData.depositBankName ? `Banco: ${currentData.depositBankName}` : ''}
                        {currentData.depositBankName && currentData.depositOperationCode ? ' • ' : ''}
                        {currentData.depositOperationCode ? `Op: ${currentData.depositOperationCode}` : ''}
                      </span>
                    )}
                  </td>
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

          {/* Clause 4: Deliverables & Plazos */}
          <div className="space-y-1 page-break-inside-avoid">
            <h3 className="font-black text-slate-900 uppercase tracking-wide flex items-center gap-1 text-[11px]">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-400 text-[9px] flex items-center justify-center font-bold">4</span>
              CLÁUSULA CUARTA: ENTREGABLES Y PLAZOS ESTRICTOS DE ENTREGA
            </h3>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 text-[10px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                
                {/* 1. Video Master (Always present) */}
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="font-black text-slate-900 block flex items-center gap-1">
                    🎬 Video Master
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold">Plazo: 15 días hábiles</span>
                  {currentData.authorizeInternetPublishing && (
                    <p className="text-[9px] text-slate-600 font-medium mt-0.5">Enlace digital y resguardo en Servidor</p>
                  )}
                </div>

                {/* 2. Sesión Fotográfica (Conditional based on photoshoot checkbox) */}
                {currentData.includesPhotoshoot && (
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <span className="font-black text-slate-900 block flex items-center gap-1">
                      📸 Sesión Fotográfica
                    </span>
                    <span className="text-[10px] text-indigo-700 font-bold">15 días</span>
                    <p className="text-[9px] text-slate-600 font-medium mt-0.5">fotografias editadas</p>
                  </div>
                )}

                {/* 3. Fotobook (Conditional based on photobook checkbox) */}
                {currentData.includesPhotobook && (
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <span className="font-black text-slate-900 block flex items-center gap-1">
                      📖 Fotobook
                    </span>
                    <span className="text-[10px] text-pink-700 font-bold">
                      Plazo: 30 días hábiles
                    </span>
                    <p className="text-[9px] text-slate-600 font-medium mt-0.5">Maquetación, aprobación y encuadernado</p>
                  </div>
                )}

                {/* 4. Memoria USB (Always present) */}
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <span className="font-black text-slate-900 block flex items-center gap-1">
                    💾 {currentData.usbSpecification || 'Memoria USB 3.2 de 128 GB'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">Entrega con Saldo S/. 0</span>
                  <p className="text-[9px] text-slate-600 font-medium mt-0.5">Material final masterizado en alta velocidad</p>
                </div>

                {/* 5. Regalo Sorpresa (Conditional based on giftIncluded, styled cleanly similar to others) */}
                {currentData.giftIncluded && (
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <span className="font-black text-slate-900 block flex items-center gap-1">
                      🎁 Regalo Sorpresa TCT
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold">Mismo día de entrega final</span>
                    <p className="text-[9px] text-slate-600 font-medium mt-0.5">Detalle conmemorativo exclusivo TCT</p>
                  </div>
                )}

              </div>

              {/* Preservation rule for master and raw files */}
              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-200 text-slate-800 font-medium text-[9.5px] leading-relaxed">
                <p>
                  * <strong>CORPORACIÓN TCT</strong> conservará los archivos <strong>MASTER y brutos</strong>, hasta un plazo de <strong>03 días posteriores</strong> a la fecha programada de entrega del material. De no recoger en la fecha de entrega sólo se conservará el archivo <strong>MASTER</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Clause 5: Special Clause / Mutual Agreements (Cláusula Especial - Se muestra SOLO si se registra algo) */}
          {(hasSpecialClause || isEditing) && (
            <div className="space-y-1 page-break-inside-avoid">
              <h3 className="font-black text-slate-900 uppercase tracking-wide flex items-center gap-1 text-[11px]">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-400 text-[9px] flex items-center justify-center font-bold">5</span>
                CLÁUSULA QUINTA: CLÁUSULA ESPECIAL Y ACUERDOS MUTUOS
              </h3>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] leading-relaxed">
                {isEditing ? (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">
                      Cláusula adicional / Acuerdos mutuos especiales (si queda vacío, no figurará en el contrato final):
                    </label>
                    <textarea
                      value={editedProject.specialContractClause || ''}
                      onChange={(e) => setEditedProject({ ...editedProject, specialContractClause: e.target.value })}
                      rows={2}
                      placeholder="Ejemplo: Se acuerda incluir 1 reel vertical para redes sociales o especificaciones adicionales..."
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-sans focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                ) : (
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800">
                    <p className="font-medium">{currentData.specialContractClause}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Official Signatures with generous space and clean rubric area */}
          <div className="pt-6 border-t-2 border-slate-950 grid grid-cols-2 gap-8 text-center text-[10px] page-break-inside-avoid">
            <div className="space-y-3">
              <div className="h-24 sm:h-28 border-b-2 border-dashed border-slate-400 w-52 mx-auto bg-slate-50/40 rounded-t-lg"></div>
              <div>
                <p className="font-black text-slate-900 uppercase">CORPORACIÓN TCT S.A.C.</p>
                <p className="text-[9.5px] text-slate-800 font-bold mt-0.5">
                  Asesor Comercial: {advisorName}
                </p>
                <p className="text-[9px] text-slate-700 font-mono font-bold">
                  DNI: {advisorDni} • Cel: {advisorPhone}
                </p>
                <p className="text-[8.5px] text-slate-500 font-mono">
                  {advisorEmail}
                </p>
                <p className="text-[8px] text-slate-400 font-mono">RUC: 20608941253</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-24 sm:h-28 border-b-2 border-dashed border-slate-400 w-52 mx-auto bg-slate-50/40 rounded-t-lg"></div>
              <div>
                <p className="font-black text-slate-900 uppercase">{currentData.clientName}</p>
                <p className="text-[9px] text-slate-700 font-medium">DNI / RUC: {currentData.clientDniRuc || '__________________'}</p>
                <p className="text-[8px] text-slate-400">El Contratante</p>
              </div>
            </div>
          </div>

          {/* Footer Document Text */}
          <div className="text-center text-[9px] text-slate-500 pt-1.5 border-t border-slate-100 font-mono page-break-inside-avoid">
            Documento de Contrato emitido formalmente por el Sistema Integrado de Gestión de Corporación TCT: SIGET • Huancayo, Perú
          </div>

        </div>

      </div>
    </div>
  );
};
