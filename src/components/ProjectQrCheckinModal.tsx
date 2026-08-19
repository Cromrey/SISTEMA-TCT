import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { ProductionProject, AssignedStaff, StaffCheckInRecord, ProjectAuditLog } from '../types';
import { TCTLogo } from './TCTLogo';
import { 
  QrCode, 
  X, 
  UserCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Printer, 
  Download, 
  Share2, 
  ShieldCheck, 
  AlertCircle, 
  Camera, 
  Sparkles, 
  Smartphone, 
  Copy, 
  Check, 
  Calendar,
  Users,
  Navigation,
  FileCheck
} from 'lucide-react';

interface ProjectQrCheckinModalProps {
  project: ProductionProject;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject?: (updatedProject: ProductionProject) => void;
}

export const ProjectQrCheckinModal: React.FC<ProjectQrCheckinModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateProject
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [staffNote, setStaffNote] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [justCheckedInStaff, setJustCheckedInStaff] = useState<string | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Generate QR payload
  const checkInPayload = useMemo(() => {
    return JSON.stringify({
      app: 'TCT-PRODUCCION-AUDIOTERRESTRE',
      action: 'staff_location_checkin',
      projectId: project.id,
      uniqueCode: project.uniqueCode,
      contractNumber: project.contractNumber,
      clientName: project.clientName,
      eventDate: project.eventDate,
      eventLocation: project.eventLocation,
      portalUrl: `${window.location.origin}/?checkin=${project.uniqueCode}`,
      generatedAt: new Date().toISOString()
    });
  }, [project]);

  // Generate QR Code with high resolution & custom styling
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(checkInPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
  }, [isOpen, checkInPayload]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const nowFormatted = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate Check-in stats
  const totalStaff = project.assignedStaff.length;
  const checkedInCount = project.assignedStaff.filter(s => s.checkedIn).length;
  const pendingStaff = project.assignedStaff.filter(s => !s.checkedIn);

  // Handle staff check-in
  const handlePerformCheckIn = (staffMember: AssignedStaff, customStatus?: 'on_time' | 'early' | 'late') => {
    const isLate = project.eventTime && new Date().toLocaleTimeString('es-PE') > project.eventTime;
    const finalStatus = customStatus || (isLate ? 'late' : 'on_time');

    const newRecord: StaffCheckInRecord = {
      id: `checkin-${Date.now()}-${staffMember.id}`,
      staffId: staffMember.id,
      staffName: staffMember.name,
      role: staffMember.role,
      checkInTime: nowFormatted,
      timestamp: new Date().toISOString(),
      status: finalStatus,
      locationNotes: `Check-in Verificado en ${project.eventLocation}`,
      verifiedByQr: true,
      notes: staffNote || 'Asistencia registrada con escaneo de Credencial QR Oficial TCT'
    };

    // Update assigned staff list
    const updatedStaff = project.assignedStaff.map(s => {
      if (s.id === staffMember.id) {
        return {
          ...s,
          checkedIn: true,
          checkInTime: nowFormatted,
          checkInStatus: finalStatus,
          checkInLocation: project.eventLocation
        };
      }
      return s;
    });

    // Update existing check-in records
    const existingRecords = project.staffCheckIns || [];
    const updatedRecords = [newRecord, ...existingRecords.filter(r => r.staffId !== staffMember.id)];

    // Create Audit Log
    const newAuditLog: ProjectAuditLog = {
      id: `audit-qr-${Date.now()}`,
      timestamp: new Date().toISOString(),
      formattedDate: nowFormatted,
      userName: `${staffMember.name} (${staffMember.role})`,
      userRole: 'employee',
      action: 'staff_checkin_qr',
      title: `Check-in en Locación: ${staffMember.name}`,
      description: `Personal llegó a locación (${project.eventLocation}) y escaneó QR. Estado: ${finalStatus === 'on_time' ? 'Puntual' : 'Conforme'}.`,
      stepNumber: 5,
      phaseNumber: 3,
      badgeColor: 'emerald'
    };

    // Also auto-check Step 5 checklist (Llegada a locación) if staff arrive
    const updatedPhases = project.phases.map(ph => {
      if (ph.phaseNumber === 3) {
        return {
          ...ph,
          steps: ph.steps.map(st => {
            if (st.stepNumber === 5) {
              const updatedChecks = st.checklist?.map(chk => {
                if (chk.text.toLowerCase().includes('llegada') || chk.text.toLowerCase().includes('personal') || chk.text.toLowerCase().includes('asistencia')) {
                  return { ...chk, completed: true };
                }
                return chk;
              });
              return {
                ...st,
                checklist: updatedChecks,
                status: st.status === 'pending' ? 'in_progress' : st.status
              };
            }
            return st;
          })
        };
      }
      return ph;
    });

    const updatedProject: ProductionProject = {
      ...project,
      assignedStaff: updatedStaff,
      staffCheckIns: updatedRecords,
      phases: updatedPhases,
      auditLogs: [newAuditLog, ...(project.auditLogs || [])],
      updatedAt: new Date().toISOString()
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }

    setJustCheckedInStaff(staffMember.name);
    setStaffNote('');
    setTimeout(() => setJustCheckedInStaff(null), 3500);
  };

  // Copy Quick Link
  const handleCopyLink = () => {
    const link = `${window.location.origin}/?checkin=${project.uniqueCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Download QR Code
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `TCT-QR-CHECKIN-${project.uniqueCode}.png`;
    a.click();
  };

  // Print Lanyard Badge
  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {project.uniqueCode}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Contrato {project.contractNumber}
                </span>
              </div>
              <h3 className="text-base font-black text-white leading-tight mt-0.5">
                Generador de Código QR & Control de Asistencia en Locación
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Top Banner with Project Context */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-500 text-[11px]">Fecha del Evento:</div>
                <div className="font-black text-slate-900">{project.eventDate} ({project.eventTime || 'Horario pactado'})</div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <MapPin className="w-4 h-4 text-red-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-slate-500 text-[11px]">Locación Oficial:</div>
                <div className="font-black text-slate-900 truncate" title={project.eventLocation}>
                  {project.eventLocation}
                </div>
              </div>
            </div>
          </div>

          {/* Success Banner if someone just checked in */}
          {justCheckedInStaff && (
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 flex items-center justify-between text-xs font-black shadow-sm animate-bounce">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>¡Asistencia registrada con éxito para {justCheckedInStaff}! Se actualizó la bitácora y checklist.</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-lg text-[10px] uppercase tracking-wider">
                Verificado QR
              </span>
            </div>
          )}

          {/* Main 2-Column Grid: Printable Credential & Staff Check-in System */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Official Printable Lanyard Badge (45%) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              
              {/* Badge Container */}
              <div 
                ref={printAreaRef}
                className="w-full max-w-xs bg-slate-950 text-white rounded-3xl p-5 border-2 border-slate-800 shadow-2xl flex flex-col items-center text-center space-y-3 relative overflow-hidden"
              >
                {/* Lanyard punch hole simulation */}
                <div className="w-12 h-2.5 rounded-full bg-slate-800 border border-slate-700 -mt-1 shadow-inner" />

                {/* Badge Header with TCT Logo */}
                <div className="pt-1 flex flex-col items-center">
                  <TCTLogo size="md" variant="icon-only" />
                  <div className="font-black text-white text-sm tracking-wider mt-1">
                    CORPORACIÓN TCT
                  </div>
                  <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">
                    Pase de Producción & Asistencia
                  </div>
                </div>

                {/* QR Code Container with Center Logo Stamp */}
                <div className="relative p-2.5 bg-white rounded-2xl shadow-inner border-2 border-amber-400/80">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="TCT Check-in QR Code" 
                      className="w-52 h-52 object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs font-bold">
                      Generando QR...
                    </div>
                  )}

                  {/* Centered Watermark Logo */}
                  <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-950 p-1 border-2 border-amber-400 shadow-lg flex items-center justify-center pointer-events-none">
                    <TCTLogo size="xs" variant="icon-only" />
                  </div>
                </div>

                {/* Project Badge Details */}
                <div className="space-y-1 w-full pt-1">
                  <div className="font-mono text-xs font-black text-amber-300 bg-slate-900 py-1 px-2 rounded-lg border border-slate-800">
                    EXP: {project.uniqueCode}
                  </div>
                  <div className="text-xs font-black text-white truncate" title={project.title}>
                    {project.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    📍 {project.eventLocation}
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-[10px] text-slate-400 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80 leading-tight">
                  📱 <strong>Instrucciones:</strong> El personal debe escanear este código con su smartphone al llegar a la locación.
                </div>

              </div>

              {/* Action Buttons for Badge */}
              <div className="flex items-center gap-2 mt-4 w-full max-w-xs justify-center">
                <button
                  onClick={handleDownloadQr}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado' : 'Copiar Link'}</span>
                </button>
              </div>

            </div>

            {/* Right Column: Crew Roster & Check-In Simulator (55%) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Crew Status Progress Banner */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Personal Asignado ({checkedInCount}/{totalStaff} en locación)
                    </h4>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full font-mono ${
                    checkedInCount === totalStaff && totalStaff > 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {checkedInCount === totalStaff && totalStaff > 0 ? '✓ EQUIPO COMPLETO' : `${totalStaff - checkedInCount} PENDIENTES`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${totalStaff > 0 ? (checkedInCount / totalStaff) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Assigned Staff List with Live Check-in Status */}
              <div className="space-y-2">
                <h5 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>Equipo de Producción Asignado:</span>
                </h5>

                {project.assignedStaff.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                    No hay personal asignado a este proyecto aún. Asigna personal en el Paso 3 (Reserva de Personal y Equipos).
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    {project.assignedStaff.map((staff) => {
                      const isChecked = Boolean(staff.checkedIn);

                      return (
                        <div 
                          key={staff.id}
                          className={`p-3 text-xs flex items-center justify-between gap-3 transition-colors ${
                            isChecked ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isChecked 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}>
                              {isChecked ? <Check className="w-4 h-4" /> : staff.name.charAt(0)}
                            </div>

                            <div className="min-w-0">
                              <div className="font-black text-slate-900 truncate">
                                {staff.name}
                              </div>
                              <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                                <span>{staff.role}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500">{staff.phone}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isChecked ? (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>EN LOCACIÓN</span>
                                </span>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {staff.checkInTime || 'Registrado'}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handlePerformCheckIn(staff, 'on_time')}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black flex items-center gap-1 shadow-xs transition-all"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Check-in</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Instant Check-In Box / Simulator */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border-2 border-amber-400/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <h5 className="text-xs font-black text-slate-900">
                      Simulador de Registro Rápido (En Campo)
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    GPS Verificado
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Seleccionar Miembro:
                    </label>
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">-- Seleccionar personal --</option>
                      {project.assignedStaff.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role}) {s.checkedIn ? '✓ Ya llegó' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Observación de llegada:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Llegó con equipos completos..."
                      value={staffNote}
                      onChange={(e) => setStaffNote(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    disabled={!selectedStaffId}
                    onClick={() => {
                      const found = project.assignedStaff.find(s => s.id === selectedStaffId);
                      if (found) handlePerformCheckIn(found, 'on_time');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all ${
                      selectedStaffId 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirmar Check-In con Escaneo QR</span>
                  </button>
                </div>
              </div>

              {/* Real-time Check-In Log Trail */}
              {project.staffCheckIns && project.staffCheckIns.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    Historial de Llegadas en Locación:
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {project.staffCheckIns.map(rec => (
                      <div key={rec.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-800">{rec.staffName}</span>
                          <span className="text-slate-400 font-mono">({rec.role})</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0">
                          {rec.checkInTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sistema Oficial TCT de Asistencia de Personal & Geolocalización de Rodajes</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>

    </div>
  );
};
