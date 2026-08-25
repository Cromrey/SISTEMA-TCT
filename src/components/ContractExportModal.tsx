import React, { useState } from 'react';
import { ProductionProject, UserRole, TCTContractDesign } from '../types';
import { TCTLogo } from './TCTLogo';
import { printElement, exportElementToPdf } from '../utils/printHelper';
import { finalizeContractExportStep3 } from '../utils/stepSequenceHelper';
import { getStoredUsers } from '../utils/authStorage';
import { getStoredRules, INITIAL_CONTRACT_DESIGN } from '../utils/rulesStorage';
import { 
  Printer, 
  X, 
  Edit3, 
  Save, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [editedProject, setEditedProject] = useState<ProductionProject>({ ...project });

  const handleFinalizeAndRegisterExport = () => {
    if (onUpdateProject) {
      const finalized = finalizeContractExportStep3(
        isEditing ? editedProject : project,
        'Administrador TCT'
      );
      onUpdateProject(finalized);
      setEditedProject(finalized);
    }
    setIsEditing(false);
  };

  const handleExportPdf = async () => {
    handleFinalizeAndRegisterExport();
    setIsGeneratingPdf(true);
    try {
      const fileName = `Contrato-TCT-${currentData.contractNumber || currentData.uniqueCode}.pdf`;
      await exportElementToPdf('tct-contract-document', fileName, `Contrato Oficial - ${currentData.contractNumber || currentData.uniqueCode}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    handleFinalizeAndRegisterExport();
    printElement('tct-contract-document', `Contrato-${currentData.contractNumber || currentData.uniqueCode}`);
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

  const masterRules = getStoredRules();
  const contractDesign: TCTContractDesign = masterRules.contractDesign || INITIAL_CONTRACT_DESIGN;

  const getFontClass = () => {
    switch (contractDesign.fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      case 'geometric': return 'font-sans tracking-tight';
      default: return 'font-sans';
    }
  };

  const totalExtraHours = (currentData.extraHoursCount || 0) * (currentData.extraHourRate || 150);
  const baseSubtotal = (currentData.listPrice || currentData.totalBudget) - (currentData.discountAmount || 0) + totalExtraHours;
  const appliesIgv = Boolean(currentData.appliesIgv);
  const igvAmount = appliesIgv 
    ? (currentData.igvAmount !== undefined && currentData.igvAmount > 0 
        ? currentData.igvAmount 
        : Number((baseSubtotal * 0.18).toFixed(2)))
    : 0;
  const computedTotal = appliesIgv ? Number((baseSubtotal + igvAmount).toFixed(2)) : Number(baseSubtotal.toFixed(2));
  const balanceRemaining = Math.max(0, computedTotal - currentData.initialDeposit - (currentData.fieldPayment || 0));

  const isLockedAfterRegistration = currentData.initialCommercialLocked || currentData.contractExported;

  const hasSpecialClause = Boolean(
    (currentData.additionalCustomClause && currentData.additionalCustomClause.trim().length > 0) ||
    (currentData.specialContractClause && currentData.specialContractClause.trim().length > 0)
  );

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

            {/* Guardar / Exportar a PDF Button */}
            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Descargar y Exportar Contrato Oficial en formato PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Exportar a PDF'}</span>
            </button>

            {/* Imprimir Button */}
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Abrir cuadro de diálogo de impresión"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir</span>
            </button>

            {/* Navigation Icons (Atrás, Adelante, Salir) */}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-400/50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Atrás"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Atrás</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-400/50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Adelante / Exportar PDF"
            >
              <span className="hidden sm:inline">Adelante</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-300 border border-slate-700 hover:border-red-500/50 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
              title="Salir / Cerrar ventana"
            >
              <span className="hidden sm:inline">Salir</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Contract Document Container (Strictly sized for 1-page A4 vertical) */}
        <div id="tct-contract-document" className={`relative p-5 sm:p-7 overflow-y-auto space-y-3 flex-1 bg-white text-slate-900 ${getFontClass()} print:p-2 print:space-y-2`}>
          
          {/* Watermark Logo Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none p-8">
            <TCTLogo size="2xl" variant="watermark" className="w-full max-w-sm" />
          </div>

          {/* Official Letterhead Header */}
          <div className="relative flex items-center justify-between border-b-2 border-slate-950 pb-2.5 page-break-inside-avoid">
            <div className="flex items-center space-x-3">
              {contractDesign.logoType === 'custom' && contractDesign.customLogoUrl ? (
                <img
                  src={contractDesign.customLogoUrl}
                  alt="Logo Institucional"
                  className="w-12 h-12 object-contain rounded-lg shrink-0 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <TCTLogo size="sm" variant="icon-only" />
              )}
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase">
                  {contractDesign.headerTitle || 'CORPORACIÓN TCT'}
                </h1>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                  {contractDesign.headerSubtitle || 'Servicios Audiovisuales, Producción Cinematográfica & Fotografía Profesional'}
                </p>
                <p className="text-[9px] text-slate-500 font-mono">
                  {contractDesign.headerLegalInfo || 'RUC: 20608941253 • Jr. Las Camelias 450, San Isidro, Lima • Tel: (01) 748-9200'}
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
              {contractDesign.contractTitle || 'CONTRATO PRIVADO DE PRESTACIÓN DE SERVICIOS AUDIOVISUALES'}
            </h2>
            <p className="text-[10px] text-slate-600">
              {contractDesign.contractIntroText || (
                <>Conste por el presente documento el contrato de servicios celebrado entre <strong>CORPORACIÓN TCT</strong> y <strong>EL CLIENTE</strong>.</>
              )}
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
              CLÁUSULA SEGUNDA: DEL OBJETO DEL SERVICIO, FECHAS DE TRABAJO Y DESPLIEGUE TÉCNICO
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

              {/* Despliegue Técnico y Personal Acreditado */}
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[9px] uppercase font-black text-slate-700 block mb-0.5">
                  🎥 Despliegue Técnico & Personal Acreditado:
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProject.technicalCrewDeployment || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, technicalCrewDeployment: e.target.value })}
                    placeholder="Ej. 2 Videógrafos Cine 4K, 1 Fotógrafo Principal, 1 Piloto Operador Dron"
                    className="w-full p-1 text-[10px] border border-slate-300 rounded font-medium"
                  />
                ) : (
                  <p className="font-bold text-slate-900 text-[10px]">
                    {currentData.technicalCrewDeployment || (currentData.includesDrone ? '2 Videógrafos Cine 4K, 1 Fotógrafo Principal, 1 Piloto Operador de Dron Acreditado' : '2 Videógrafos Cine 4K, 1 Fotógrafo Principal')}
                  </p>
                )}
              </div>

              {/* Work days display: 1 compact column on the left (up to half page), Reference on the right */}
              <div className="pt-1.5 border-t border-slate-200">
                <span className="text-[9px] uppercase font-black text-slate-700 block mb-1.5">
                  📅 Cronograma de Jornadas de Trabajo / Cobertura ({currentData.eventSchedules && currentData.eventSchedules.length > 0 ? currentData.eventSchedules.length : 1} {currentData.eventSchedules && currentData.eventSchedules.length > 1 ? 'días' : 'día'}):
                </span>
                
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="divide-y divide-slate-100">
                    {currentData.eventSchedules && currentData.eventSchedules.length > 0 ? (
                      currentData.eventSchedules.map((sch, idx) => (
                        <div key={sch.id || `sch-${sch.date || idx}-${idx}`} className="p-2 flex items-center justify-between gap-3 text-[10px]">
                          {/* Left Column: Date & Hours taking up to half width */}
                          <div className="flex items-center space-x-2.5 min-w-[190px] max-w-[50%]">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-black text-[9px] shrink-0">
                              Día {idx + 1}
                            </span>
                            <div className="font-mono leading-tight">
                              <span className="font-bold text-slate-900 block text-[10px]">{sch.date}</span>
                              <span className="text-[9px] text-slate-600 font-sans">
                                Horario: <strong>{sch.startTime}</strong> a <strong>{sch.endTime}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Right Side: Referencia de lo que será ese día */}
                          <div className="text-right flex-1 pl-3 border-l border-slate-100">
                            <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Referencia / Motivo:</span>
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-950 border border-amber-200 font-black text-[9.5px]">
                              {sch.reference || sch.notes || (idx === 0 ? 'Día Central' : 'Jornada de Cobertura')}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 flex items-center justify-between gap-3 text-[10px]">
                        <div className="flex items-center space-x-2.5 min-w-[190px] max-w-[50%]">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-black text-[9px] shrink-0">
                            Día 1
                          </span>
                          <div className="font-mono leading-tight">
                            <span className="font-bold text-slate-900 block text-[10px]">{currentData.eventDate}</span>
                            <span className="text-[9px] text-slate-600 font-sans">
                              Horario: <strong>{currentData.eventTime || 'Horario pactado'}</strong> ({currentData.standardHours || 8} horas base)
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-1 pl-3 border-l border-slate-100">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Referencia / Motivo:</span>
                          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-950 border border-amber-200 font-black text-[9.5px]">
                            Día Central
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inline Schedule Editor when isEditing */}
                  {isEditing && (
                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-700 uppercase">Editar Jornadas de Cobertura:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newDayNum = (editedProject.eventSchedules?.length || 0) + 1;
                            setEditedProject({
                              ...editedProject,
                              eventSchedules: [
                                ...(editedProject.eventSchedules || []),
                                {
                                  id: `sch-edit-${Date.now()}-${newDayNum}`,
                                  date: editedProject.eventDate,
                                  startTime: '10:00',
                                  endTime: '18:00',
                                  reference: ''
                                }
                              ]
                            });
                          }}
                          className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-black rounded-md hover:bg-amber-500 cursor-pointer"
                        >
                          + Añadir Día
                        </button>
                      </div>

                      {(editedProject.eventSchedules || []).map((sch, sIdx) => (
                        <div key={sIdx} className="grid grid-cols-12 gap-1.5 items-center bg-white p-1.5 rounded-lg border border-slate-200 text-[9px]">
                          <span className="col-span-1 font-bold font-mono text-center">D{sIdx+1}</span>
                          <input
                            type="date"
                            value={sch.date}
                            onChange={(e) => {
                              const updated = [...(editedProject.eventSchedules || [])];
                              updated[sIdx] = { ...updated[sIdx], date: e.target.value };
                              setEditedProject({ ...editedProject, eventSchedules: updated });
                            }}
                            className="col-span-3 p-1 text-[9px] border rounded font-mono"
                          />
                          <input
                            type="time"
                            value={sch.startTime}
                            onChange={(e) => {
                              const updated = [...(editedProject.eventSchedules || [])];
                              updated[sIdx] = { ...updated[sIdx], startTime: e.target.value };
                              setEditedProject({ ...editedProject, eventSchedules: updated });
                            }}
                            className="col-span-2 p-1 text-[9px] border rounded font-mono"
                          />
                          <input
                            type="time"
                            value={sch.endTime}
                            onChange={(e) => {
                              const updated = [...(editedProject.eventSchedules || [])];
                              updated[sIdx] = { ...updated[sIdx], endTime: e.target.value };
                              setEditedProject({ ...editedProject, eventSchedules: updated });
                            }}
                            className="col-span-2 p-1 text-[9px] border rounded font-mono"
                          />
                          <input
                            type="text"
                            placeholder="Referencia (ej. Víspera)"
                            value={sch.reference || ''}
                            onChange={(e) => {
                              const updated = [...(editedProject.eventSchedules || [])];
                              updated[sIdx] = { ...updated[sIdx], reference: e.target.value };
                              setEditedProject({ ...editedProject, eventSchedules: updated });
                            }}
                            className="col-span-3 p-1 text-[9px] border rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editedProject.eventSchedules || []).filter((_, i) => i !== sIdx);
                              setEditedProject({ ...editedProject, eventSchedules: updated });
                            }}
                            className="col-span-1 text-red-500 hover:text-red-700 text-center font-black cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Clause 3: Economic Conditions & Soles Breakdown */}
          <div className="space-y-1 page-break-inside-avoid">
            <h3 className="font-black text-slate-900 uppercase tracking-wide flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-400 text-[9px] flex items-center justify-center font-bold">3</span>
                <span>CLÁUSULA TERCERA: PRECIO, CONDICIONES DE PAGO (SOLES S/.) Y REGLA 7:00 PM</span>
              </div>
              {isEditing && (
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editedProject.appliesIgv)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const curList = editedProject.listPrice || editedProject.totalBudget || 0;
                      const curDisc = editedProject.discountAmount || 0;
                      const curExtra = (editedProject.extraHoursCount || 0) * (editedProject.extraHourRate || 150);
                      const sub = curList - curDisc + curExtra;
                      const igv = checked ? Number((sub * 0.18).toFixed(2)) : 0;
                      const tot = checked ? Number((sub + igv).toFixed(2)) : Number(sub.toFixed(2));
                      setEditedProject({
                        ...editedProject,
                        appliesIgv: checked,
                        igvAmount: igv,
                        totalBudget: tot,
                        finalBalance: Math.max(0, tot - (editedProject.initialDeposit || 0) - (editedProject.fieldPayment || 0))
                      });
                    }}
                    className="w-3.5 h-3.5 text-amber-600 rounded"
                  />
                  <span>Aplica IGV (18%)</span>
                </label>
              )}
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
                {appliesIgv ? (
                  <tr className="bg-amber-50/40">
                    <td className="p-1.5 font-bold text-amber-950">IGV (18%)</td>
                    <td className="p-1.5 text-amber-900 text-[9px]">18% aplicado al subtotal base (S/. {baseSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                    <td className="p-1.5 text-right font-mono font-bold text-amber-900">+ S/. {igvAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ) : null}
                <tr className="bg-slate-100 font-black">
                  <td className="p-1.5 text-slate-900">PRESUPUESTO TOTAL PACTADO:</td>
                  <td className="p-1.5 text-slate-600 text-[9px]">
                    Moneda: Soles Peruanos (PEN) {appliesIgv ? '• Incluye 18% IGV' : ''}
                  </td>
                  <td className="p-1.5 text-right font-black font-mono text-xs text-slate-950">
                    S/. {computedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
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
                  <td className="p-1.5 text-right font-mono font-black text-amber-950">
                    S/. {balanceRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Clause 4: Deliverables, USB, Revisions (Optional) & Custody */}
          <div className="space-y-1 page-break-inside-avoid">
            <h3 className="font-black text-slate-900 uppercase tracking-wide flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-400 text-[9px] flex items-center justify-center font-bold">4</span>
                <span>
                  CLÁUSULA CUARTA: ENTREGABLES, ESPECIFICACIÓN DE USB{currentData.includeRevisionsPolicy ? ', POLÍTICA DE REVISIONES' : ''} Y CUSTODIA
                </span>
              </div>
              {isEditing && (
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editedProject.includeRevisionsPolicy)}
                    onChange={(e) => setEditedProject({ ...editedProject, includeRevisionsPolicy: e.target.checked })}
                    className="w-3.5 h-3.5 text-amber-600 rounded"
                  />
                  <span>¿Activar Política de Revisiones?</span>
                </label>
              )}
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
                    💾 Memoria USB 3.2 ({currentData.usbCapacity || currentData.usbSpecification || '128GB'})
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

              {/* Policy: Revisions limit (Opcional - solo visible si includeRevisionsPolicy es true) */}
              {currentData.includeRevisionsPolicy && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 text-[10px] leading-relaxed">
                  <p>
                    * <strong>Política de Revisiones:</strong> EL CLIENTE tiene derecho a <strong>{currentData.revisionRounds || 2} rondas de revisiones</strong> menores de edición sin costo dentro de un plazo máximo de <strong>{currentData.revisionDaysLimit || 5} días hábiles</strong> posteriores a la entrega del primer borrador digital.
                  </p>
                </div>
              )}

              {/* Preservation rule for master and raw files con título Política de Custodia */}
              <div className="bg-amber-50/90 p-3 rounded-xl border border-amber-300 text-amber-950 font-medium text-[10px] leading-relaxed shadow-2xs space-y-0.5">
                <span className="font-black text-amber-950 block text-[9.5px] uppercase tracking-wide">
                  Política de Custodia:
                </span>
                <p>
                  * <strong>{contractDesign.headerTitle || 'CORPORACIÓN TCT'}</strong> conservará los archivos <strong>MASTER</strong> y brutos, hasta un plazo de <strong>0{currentData.rawCustodyDays || 3} días posteriores</strong> a la fecha programada de entrega del material. De no recoger el Cliente en la fecha de entrega pactada sólo se conservará el archivo <strong>MASTER</strong> final.
                </p>
              </div>

              {isEditing && (
                <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px]">
                  <div>
                    <label className="font-bold text-slate-700 block">Capacidad USB:</label>
                    <input
                      type="text"
                      value={editedProject.usbCapacity || '128GB'}
                      onChange={(e) => setEditedProject({ ...editedProject, usbCapacity: e.target.value })}
                      className="w-full p-1 border rounded bg-white text-[9px]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block">Rondas Revisión:</label>
                    <input
                      type="number"
                      value={editedProject.revisionRounds || 2}
                      onChange={(e) => setEditedProject({ ...editedProject, revisionRounds: parseInt(e.target.value) || 2 })}
                      className="w-full p-1 border rounded bg-white text-[9px]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block">Días Límite Revisión:</label>
                    <input
                      type="number"
                      value={editedProject.revisionDaysLimit || 5}
                      onChange={(e) => setEditedProject({ ...editedProject, revisionDaysLimit: parseInt(e.target.value) || 5 })}
                      className="w-full p-1 border rounded bg-white text-[9px]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block">Días Custodia RAW:</label>
                    <input
                      type="number"
                      value={editedProject.rawCustodyDays || 3}
                      onChange={(e) => setEditedProject({ ...editedProject, rawCustodyDays: parseInt(e.target.value) || 3 })}
                      className="w-full p-1 border rounded bg-white text-[9px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clause 5: General Conditions, Intellectual Property, Postponement & Field Logistics */}
          <div className="space-y-1 page-break-inside-avoid">
            <h3 className="font-black text-slate-900 uppercase tracking-wide flex items-center gap-1 text-[11px]">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-400 text-[9px] flex items-center justify-center font-bold">5</span>
              CLÁUSULA QUINTA: PROPIEDAD INTELECTUAL, POSTERGACIÓN Y CONDICIONES GENERALES
            </h3>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-[10px] leading-relaxed">
              {/* 5.1 Propiedad Intelectual */}
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-800">
                  <strong>5.1. Propiedad Intelectual:</strong> Los derechos patrimoniales sobre el material audiovisual producido corresponden a Corporación TCT, otorgando al Cliente la autorización para su libre uso, reproducción y difusión según lo pactado.
                </p>
              </div>

              {/* 5.2 Postergación */}
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-800">
                  <strong>5.2. Postergación o Reprogramación:</strong> Cualquier solicitud de cambio de fecha deberá realizarse con un mínimo de <strong>{currentData.rescheduleNoticeMonths || 1} mes de anticipación</strong> y estará sujeta a disponibilidad técnica y de agenda de la empresa. En caso contrario o desistimiento unilateral, el adelanto inicial no será reembolsable.
                </p>
              </div>

              {/* 5.3 Logística de Campo */}
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-800">
                  <strong>5.3. Logística de Campo:</strong> Para la jornada de cobertura audiovisual, EL CLIENTE proveerá oportunamente de viáticos al personal técnico acreditado asignado al evento.
                </p>
              </div>

              {/* 5.4 Cláusula Adicional Especial (Opcional - solo si existe o en edición) */}
              {(hasSpecialClause || isEditing) && (
                <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-200 space-y-1">
                  <span className="font-black text-amber-950 block text-[9.5px]">
                    5.4. Acuerdos Especiales Adicionales:
                  </span>
                  {isEditing ? (
                    <textarea
                      value={editedProject.additionalCustomClause || editedProject.specialContractClause || ''}
                      onChange={(e) => setEditedProject({ 
                        ...editedProject, 
                        additionalCustomClause: e.target.value,
                        specialContractClause: e.target.value
                      })}
                      rows={2}
                      placeholder="Escriba aquí cualquier acuerdo especial adicional (si se deja vacío, no aparecerá)..."
                      className="w-full p-1.5 text-[10px] border border-slate-300 rounded-lg bg-white"
                    />
                  ) : (
                    <p className="text-slate-900 font-medium italic">
                      "{currentData.additionalCustomClause || currentData.specialContractClause}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Official Signatures: Asesor Comercial & EL CLIENTE */}
          <div className="pt-6 border-t-2 border-slate-950 grid grid-cols-2 gap-8 text-center text-[10px] page-break-inside-avoid">
            <div className="space-y-3">
              <div className="h-24 sm:h-28 border-b-2 border-dashed border-slate-400 w-52 mx-auto bg-slate-50/40 rounded-t-lg"></div>
              <div className="space-y-0.5">
                <p className="font-black text-slate-900 uppercase text-[10px]">{contractDesign.headerTitle || 'CORPORACIÓN TCT S.A.C.'}</p>
                <p className="text-[9.5px] text-slate-700 font-bold uppercase">
                  {contractDesign.signerAdvisorRole || 'Director de Producción / Asesor Comercial'}
                </p>
                <p className="text-[10px] text-slate-900 font-black">
                  {advisorName}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-24 sm:h-28 border-b-2 border-dashed border-slate-400 w-52 mx-auto bg-slate-50/40 rounded-t-lg"></div>
              <div className="space-y-0.5">
                <p className="font-black text-slate-900 uppercase text-[10px]">{currentData.clientName}</p>
                <p className="text-[9.5px] text-slate-800 font-bold">DNI / RUC: {currentData.clientDniRuc || currentData.clientDni || '__________________'}</p>
                <p className="text-[9.5px] font-black text-slate-700 uppercase tracking-wider">EL CLIENTE</p>
              </div>
            </div>
          </div>

          {/* Footer Document Text */}
          <div className="text-center text-[9px] text-slate-500 pt-1.5 border-t border-slate-100 font-mono page-break-inside-avoid">
            {contractDesign.footerText || 'Documento emitido formalmente por el Sistema Integrado de Gestión Audiovisual de Corporación TCT: SIGAT • Perú'}
          </div>

        </div>

      </div>
    </div>
  );
};
