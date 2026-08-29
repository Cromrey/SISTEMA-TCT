import React, { useState } from 'react';
import { ProductionProject } from '../types';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  CheckCircle2, 
  AlertOctagon, 
  HardDrive, 
  Film, 
  Sparkles, 
  Clock, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Phone, 
  Share2, 
  ShieldCheck, 
  ExternalLink,
  Save,
  Check
} from 'lucide-react';

interface EmployeePortalProps {
  projects: ProductionProject[];
  onUpdateProject: (updated: ProductionProject) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  projects,
  onUpdateProject
}) => {
  // Active non-archived projects
  const activeList = projects.filter(p => !p.isArchived);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeList[0]?.id || '');
  
  const currentProject = projects.find(p => p.id === selectedProjectId) || activeList[0];

  if (!currentProject) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">No hay producciones asignadas activas</h3>
        <p className="text-xs text-slate-500 mt-1">Crea una nueva producción desde el panel de Administrador</p>
      </div>
    );
  }

  // Find steps
  const step6 = currentProject.phases[2]?.steps[0]; // Cobertura
  const step7 = currentProject.phases[2]?.steps[1]; // Cobro 7:00 PM
  const step8 = currentProject.phases[2]?.steps[2]; // Ingest
  const step9 = currentProject.phases[3]?.steps[0]; // USB 15 días

  // Quick Action: Register Field Payment ($0.00 balance)
  const handleQuickFieldPayment = () => {
    const updatedPhases = [...currentProject.phases];
    const phase3 = { ...updatedPhases[2] };
    const steps = [...phase3.steps];

    const amount = currentProject.finalBalance || (currentProject.totalBudget - currentProject.initialDeposit);
    steps[1] = {
      ...steps[1],
      status: 'completed',
      completedAt: new Date().toLocaleTimeString(),
      fieldPaymentData: {
        paymentStatus: 'paid',
        amountCollected: amount,
        paymentMethod: 'Efectivo',
        paymentTime: `${new Date().toLocaleTimeString()} (Cumplido antes de 7:00 PM)`,
        technicianInCharge: 'Director de Cámara TCT',
        receiptNumber: `REC-CAMPO-${Math.floor(1000 + Math.random() * 9000)}`
      },
      checklist: steps[1].checklist?.map(c => ({ ...c, completed: true }))
    };
    phase3.steps = steps;
    updatedPhases[2] = phase3;

    const updated: ProductionProject = {
      ...currentProject,
      fieldPayment: amount,
      finalBalance: 0, // Zero balance achieved!
      phases: updatedPhases,
      updatedAt: new Date().toISOString()
    };

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}

    onUpdateProject(updated);
  };

  // Quick Action: Complete Ingest
  const handleQuickIngest = (sdCount: number, gbCount: number) => {
    const updatedPhases = [...currentProject.phases];
    const phase3 = { ...updatedPhases[2] };
    const steps = [...phase3.steps];

    steps[2] = {
      ...steps[2],
      status: 'completed',
      completedAt: new Date().toISOString(),
      ingestData: {
        sdCardsCount: sdCount,
        totalGigabytes: gbCount,
        serverLocation: `NAS-TCT-STORAGE-01 / ${currentProject.uniqueCode}`,
        backupVerified: true,
        technicianName: 'Técnico de Ingest TCT',
        backupDate: new Date().toISOString().split('T')[0]
      },
      checklist: steps[2].checklist?.map(c => ({ ...c, completed: true }))
    };
    phase3.steps = steps;
    updatedPhases[2] = phase3;

    // Advance Step 9 to in_progress
    const phase4 = { ...updatedPhases[3] };
    const steps4 = [...phase4.steps];
    steps4[0] = {
      ...steps4[0],
      status: 'in_progress'
    };
    phase4.steps = steps4;
    updatedPhases[3] = phase4;

    const updated: ProductionProject = {
      ...currentProject,
      phases: updatedPhases,
      updatedAt: new Date().toISOString()
    };

    try {
      confetti({ particleCount: 80, spread: 60 });
    } catch (e) {}

    onUpdateProject(updated);
  };

  // Toggle equipment checkout
  const handleToggleEquipment = (eqId: string) => {
    const updatedEq = currentProject.equipmentList.map(eq => {
      if (eq.id === eqId) return { ...eq, checkedOut: !eq.checkedOut };
      return eq;
    });
    onUpdateProject({
      ...currentProject,
      equipmentList: updatedEq,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Selector Card for Staff */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-700/50">
        
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
              🎬
            </div>
            <div>
              <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider block">
                PORTAL TÉCNICO DE CAMPO & POST-PRODUCCIÓN
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Corporación TCT • Asistente de Flujo
              </h2>
            </div>
          </div>
        </div>

        {/* Project Selector Pills */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-indigo-200">
            Selecciona tu Evento / Producción Asignada:
          </label>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {activeList.map(proj => (
              <button
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-2 ${
                  proj.id === currentProject.id
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="font-mono">{proj.uniqueCode.split('-')[2] || proj.uniqueCode}</span>
                <span>{proj.title.split(':')[1] || proj.title}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Hero Banner for Current Event Info */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex items-start justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                {currentProject.uniqueCode}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {currentProject.contractNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                {currentProject.eventType}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              {currentProject.title}
            </h3>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Estado Financiero</span>
            <span className={`text-base font-black px-2.5 py-0.5 rounded-lg inline-block mt-0.5 ${
              currentProject.finalBalance === 0 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {currentProject.finalBalance === 0 ? '✓ Liquidado (S/. 0.00)' : `Saldo Pendiente: S/. ${currentProject.finalBalance.toLocaleString()}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-2.5">
            <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <span className="text-slate-500 block">Fecha y Hora:</span>
              <strong className="text-slate-900">{currentProject.eventDate} ({currentProject.eventTime})</strong>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-2.5">
            <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <span className="text-slate-500 block">Locación:</span>
              <strong className="text-slate-900">{currentProject.eventLocation}</strong>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-2.5">
            <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <span className="text-slate-500 block">Cliente:</span>
              <strong className="text-slate-900">{currentProject.clientName} ({currentProject.clientPhone})</strong>
            </div>
          </div>
        </div>

      </div>

      {/* MODULE 1: REGLA DE COBRO EN CAMPO (LÍMITE 7:00 PM) */}
      <div className={`rounded-3xl p-5 sm:p-6 border-2 transition-all shadow-md ${
        step7?.fieldPaymentData?.paymentStatus === 'paid'
          ? 'bg-emerald-50/70 border-emerald-500'
          : 'bg-red-50/80 border-red-500'
      }`}>
        
        <div className="flex items-start space-x-3 mb-4">
          <div className={`p-3 rounded-2xl text-white shrink-0 shadow-md ${
            step7?.fieldPaymentData?.paymentStatus === 'paid' ? 'bg-emerald-600' : 'bg-red-600 animate-pulse'
          }`}>
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white uppercase tracking-wider">
                PASO 7 • REGLA DE COBRO EN CAMPO
              </span>
              <span className="text-xs font-bold text-red-900">
                HORA LÍMITE: 7:00 PM
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              Cláusula Estricta de Continuidad de Filmación TCT
            </h3>
            <p className="text-xs text-slate-700 mt-0.5">
              ✔ <strong>Si Cancela / Acuerda:</strong> El equipo técnico continúa la filmación hasta culminar todo el evento contratado.<br />
              ✖ <strong>Si NO Cancela sin acuerdo:</strong> Retiro inmediato del personal técnico de Corporación TCT.
            </p>
          </div>
        </div>

        {/* Action controls */}
        {step7?.fieldPaymentData?.paymentStatus === 'paid' ? (
          <div className="bg-white p-4 rounded-2xl border border-emerald-300 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                ✓
              </div>
              <div>
                <span className="font-extrabold text-emerald-900 text-sm block">
                  Cobro Liquidado en Campo con Éxito
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Monto: S/. {step7.fieldPaymentData.amountCollected.toLocaleString()} • {step7.fieldPaymentData.paymentTime} • {step7.fieldPaymentData.receiptNumber}
                </span>
              </div>
            </div>

            <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs">
              Filmación Autorizada al 100%
            </span>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-white/90 rounded-2xl border border-red-300 text-xs flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-red-950">
                Saldo a cobrar al cliente en locación: <strong className="text-base text-red-600">S/. {currentProject.finalBalance.toLocaleString()}</strong>
              </span>
              <span className="text-slate-500 font-medium">
                Medios autorizados: Efectivo / Transferencia / Yape
              </span>
            </div>

            <button
              onClick={handleQuickFieldPayment}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>✔ REGISTRAR COBRO RECIBIDO EN CAMPO (AUTORIZAR CONTINUIDAD)</span>
            </button>
          </div>
        )}

      </div>

      {/* MODULE 2: RESGUARDO DE MATERIAL (INGEST EN SERVIDOR) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-2xl bg-yellow-400 text-slate-950 shrink-0 shadow-md">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-yellow-100 text-yellow-900 uppercase tracking-wider">
              PASO 8 • RESGUARDO DE MATERIAL (INGEST)
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">
              Descarga & Respaldo en Servidores RAID TCT
            </h3>
            <p className="text-xs text-slate-500">
              Retorno a oficinas y volcado íntegro de tarjetas de memoria 4K antes de iniciar la edición.
            </p>
          </div>
        </div>

        {step8?.status === 'completed' && step8.ingestData ? (
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="font-extrabold text-emerald-900 block text-sm">
                ✅ Respaldo Ingest Completado y Verificado en Servidor
              </span>
              <span className="text-slate-600 block">
                {step8.ingestData.sdCardsCount} Tarjetas SD • Total: {step8.ingestData.totalGigabytes} GB
              </span>
              <span className="font-mono text-[11px] text-slate-500 block">
                Ruta: {step8.ingestData.serverLocation}
              </span>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-xl">
              Listo para Edición
            </span>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Tarjetas SD de Cámaras</label>
                <input
                  type="number"
                  defaultValue={6}
                  id="input-cards-count"
                  className="w-full p-2 border rounded-xl bg-white font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Total Gigabytes (GB)</label>
                <input
                  type="number"
                  defaultValue={380}
                  id="input-gb-count"
                  className="w-full p-2 border rounded-xl bg-white font-bold text-slate-900"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const cards = Number((document.getElementById('input-cards-count') as HTMLInputElement)?.value || 6);
                const gbs = Number((document.getElementById('input-gb-count') as HTMLInputElement)?.value || 380);
                handleQuickIngest(cards, gbs);
              }}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <HardDrive className="w-4 h-4" />
              <span>REGISTRAR INGEST EN SERVIDOR TCT (VERIFICAR COPIA)</span>
            </button>
          </div>
        )}

      </div>

      {/* MODULE 3: EQUIPOS & CHECKLIST TÉCNICO */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Pase de Lista de Equipos & Cámaras
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Toca para marcar equipo verificado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentProject.equipmentList.map(eq => (
            <div
              key={eq.id}
              onClick={() => handleToggleEquipment(eq.id)}
              className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                eq.checkedOut
                  ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black ${
                  eq.checkedOut ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {eq.checkedOut ? '✓' : ''}
                </div>
                <div>
                  <span className="block">{eq.name}</span>
                  <span className="text-[10px] text-slate-400">{eq.category}</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                eq.checkedOut ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-200 text-slate-600'
              }`}>
                {eq.checkedOut ? 'Asignado' : 'En Almacén'}
              </span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
