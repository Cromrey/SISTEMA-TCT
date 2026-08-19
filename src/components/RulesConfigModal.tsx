import React, { useState, useEffect } from 'react';
import { 
  TCTMasterRules, 
  TCTMasterPackage, 
  EquipmentItem, 
  MasterStepChecklistRule, 
  TemplateDocumentFormat,
  EventType 
} from '../types';
import { 
  getStoredRules, 
  saveMasterRules, 
  resetMasterRulesToDefault 
} from '../utils/rulesStorage';
import { 
  Sliders, 
  X, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Camera, 
  Package, 
  ListChecks, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  Coins, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Info,
  ChevronRight,
  Search,
  ExternalLink
} from 'lucide-react';

interface RulesConfigModalProps {
  onClose: () => void;
  onRulesUpdated?: () => void;
}

type TabType = 'packages' | 'checklists' | 'equipment' | 'formats' | 'settings';

export const RulesConfigModal: React.FC<RulesConfigModalProps> = ({ onClose, onRulesUpdated }) => {
  const [rules, setRules] = useState<TCTMasterRules>(getStoredRules());
  const [activeTab, setActiveTab] = useState<TabType>('packages');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected package for editing
  const [editingPackage, setEditingPackage] = useState<TCTMasterPackage | null>(null);
  const [newServiceInput, setNewServiceInput] = useState('');

  // Selected step for checklist editing
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(1);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Equipment editing
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [newEquipmentCategory, setNewEquipmentCategory] = useState<EquipmentItem['category']>('Cámara');
  const [newEquipmentSerial, setNewEquipmentSerial] = useState('');

  // Format editing / preview
  const [selectedFormat, setSelectedFormat] = useState<TemplateDocumentFormat | null>(rules.templateFormats[0] || null);

  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSave = () => {
    saveMasterRules(rules);
    if (onRulesUpdated) onRulesUpdated();
    notifySuccess('✓ Reglas Maestras guardadas y aplicadas a todo el sistema');
  };

  const handleResetToDefaults = () => {
    if (window.confirm('¿Deseas restaurar todas las reglas, paquetes, checklists y formatos a los valores estándar de fábrica de Corporación TCT?')) {
      const reset = resetMasterRulesToDefault();
      setRules(reset);
      if (onRulesUpdated) onRulesUpdated();
      notifySuccess('🔄 Reglas maestras restablecidas a los valores oficiales TCT');
    }
  };

  // --- Package Management ---
  const handleAddPackage = () => {
    const newPack: TCTMasterPackage = {
      id: `pack-${Date.now()}`,
      name: 'Nuevo Paquete de Producción',
      eventType: 'Boda',
      basePrice: 3000,
      standardHours: 8,
      includesDrone: true,
      includesPhotobook: true,
      description: 'Descripción detallada de la cobertura y entregables incluidos.',
      includedServices: [
        'Cobertura continua de 8 horas',
        '2 Operadores de cámara 4K',
        'Video Trailer Highlight 3-5 min',
        'Video Documental 60 min',
        'Entrega en memoria USB 3.0 personalizada'
      ],
      recommendedEquipment: [
        'Sony FX3 Cinema Line',
        'Sony A7 IV',
        'DJI Mavic 3 Pro'
      ],
      slaDaysVideo: 15,
      slaDaysPhotobook: 30
    };
    const updated = { ...rules, packages: [...rules.packages, newPack] };
    setRules(updated);
    setEditingPackage(newPack);
    notifySuccess('Nuevo paquete añadido. Ya puedes personalizar sus servicios.');
  };

  const handleDeletePackage = (id: string) => {
    if (window.confirm('¿Seguro de eliminar este paquete de la lista oficial?')) {
      const updated = { ...rules, packages: rules.packages.filter(p => p.id !== id) };
      setRules(updated);
      if (editingPackage?.id === id) setEditingPackage(null);
      notifySuccess('Paquete eliminado');
    }
  };

  const handleUpdateCurrentPackage = (updatedPkg: TCTMasterPackage) => {
    const updatedPackages = rules.packages.map(p => p.id === updatedPkg.id ? updatedPkg : p);
    setRules({ ...rules, packages: updatedPackages });
    setEditingPackage(updatedPkg);
  };

  const handleAddServiceToPackage = () => {
    if (!editingPackage || !newServiceInput.trim()) return;
    const updated = {
      ...editingPackage,
      includedServices: [...editingPackage.includedServices, newServiceInput.trim()]
    };
    handleUpdateCurrentPackage(updated);
    setNewServiceInput('');
  };

  const handleRemoveServiceFromPackage = (index: number) => {
    if (!editingPackage) return;
    const updatedServices = editingPackage.includedServices.filter((_, i) => i !== index);
    handleUpdateCurrentPackage({ ...editingPackage, includedServices: updatedServices });
  };

  // --- Checklist Management ---
  const currentStepChecklist = rules.stepChecklists.find(s => s.stepNumber === selectedStepNumber);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim() || !currentStepChecklist) return;
    const updatedLists = rules.stepChecklists.map(s => {
      if (s.stepNumber === selectedStepNumber) {
        return {
          ...s,
          defaultChecklist: [...s.defaultChecklist, newChecklistText.trim()]
        };
      }
      return s;
    });
    setRules({ ...rules, stepChecklists: updatedLists });
    setNewChecklistText('');
    notifySuccess(`Item agregado al Paso ${selectedStepNumber}`);
  };

  const handleDeleteChecklistItem = (itemIndex: number) => {
    const updatedLists = rules.stepChecklists.map(s => {
      if (s.stepNumber === selectedStepNumber) {
        return {
          ...s,
          defaultChecklist: s.defaultChecklist.filter((_, idx) => idx !== itemIndex)
        };
      }
      return s;
    });
    setRules({ ...rules, stepChecklists: updatedLists });
  };

  // --- Equipment Catalog Management ---
  const handleAddEquipment = () => {
    if (!newEquipmentName.trim()) return;
    const newItem: EquipmentItem = {
      id: `eq-${Date.now()}`,
      name: newEquipmentName.trim(),
      category: newEquipmentCategory,
      serialNumber: newEquipmentSerial.trim() || `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      checkedOut: false
    };
    setRules({ ...rules, equipmentCatalog: [...rules.equipmentCatalog, newItem] });
    setNewEquipmentName('');
    setNewEquipmentSerial('');
    notifySuccess('Equipo agregado al catálogo estándar');
  };

  const handleDeleteEquipment = (id: string) => {
    setRules({ ...rules, equipmentCatalog: rules.equipmentCatalog.filter(e => e.id !== id) });
    notifySuccess('Equipo eliminado del catálogo');
  };

  // --- Format / Template Download ---
  const handleDownloadFormat = (fmt: TemplateDocumentFormat) => {
    const blob = new Blob([fmt.contentTemplate], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fmt.downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess(`Descargando formato: ${fmt.downloadFilename}`);
  };

  const handleCustomFileUpload = (fmtId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const updatedFormats = rules.templateFormats.map(f => {
        if (f.id === fmtId) {
          return {
            ...f,
            customFileName: file.name,
            customFileUrl: content,
            updatedAt: new Date().toISOString().split('T')[0]
          };
        }
        return f;
      });
      setRules({ ...rules, templateFormats: updatedFormats });
      notifySuccess(`Archivo "${file.name}" cargado exitosamente para el formato.`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      
      {/* Modal Container */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Panel de Reglas Maestras & Estandarización TCT
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  REGLAS OFICIALES
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configura checklists de los 12 pasos, paquetes de proformas, catálogo de equipos y formatos descargables
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetToDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-xs font-bold transition-all flex items-center gap-1 border border-slate-700"
              title="Restablecer valores de fábrica"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restablecer Estándar</span>
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Reglas</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-6 py-2 text-xs font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Tab Navigation */}
        <div className="flex items-center space-x-1 px-6 py-2.5 bg-slate-900 border-b border-slate-800 overflow-x-auto shrink-0">
          {[
            { id: 'packages', label: '1. Proformas, Paquetes & Servicios', icon: Package },
            { id: 'checklists', label: '2. Checklists Maestros (12 Pasos)', icon: ListChecks },
            { id: 'equipment', label: '3. Catálogo de Equipos Estándar', icon: Camera },
            { id: 'formats', label: '4. Formatos & Actas Descargables', icon: FileText },
            { id: 'settings', label: '5. Políticas de Contrato & Descuentos', icon: Coins }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* TAB 1: PROFORMAS, PAQUETES & SERVICIOS */}
          {activeTab === 'packages' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Package List */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-400" />
                    Paquetes Oficiales TCT ({rules.packages.length})
                  </h3>
                  <button
                    onClick={handleAddPackage}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-xs font-black transition-colors flex items-center gap-1 border border-amber-500/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir Paquete</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {rules.packages.map((pkg) => {
                    const isSelected = editingPackage?.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setEditingPackage(pkg)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700 text-amber-300">
                              {pkg.eventType}
                            </span>
                            <h4 className="font-extrabold text-sm text-white mt-1">
                              {pkg.name}
                            </h4>
                          </div>
                          <span className="font-mono text-sm font-black text-emerald-400">
                            S/. {pkg.basePrice.toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                          {pkg.description}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/60 pt-2">
                          <span>⏱ {pkg.standardHours} hrs base</span>
                          <span>📦 {pkg.includedServices.length} servicios incluidos</span>
                          {pkg.includesDrone && <span className="text-amber-400 font-bold">🛸 Dron</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Package Editor */}
              <div className="lg:col-span-7 bg-slate-800/90 rounded-2xl p-5 border border-slate-700 space-y-4">
                {editingPackage ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <div>
                        <span className="text-[10px] text-amber-400 font-extrabold tracking-wider uppercase">
                          Editor de Paquete de Proforma
                        </span>
                        <h3 className="text-base font-black text-white">
                          {editingPackage.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDeletePackage(editingPackage.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 border border-red-800/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Nombre del Paquete</label>
                        <input
                          type="text"
                          value={editingPackage.name}
                          onChange={(e) => handleUpdateCurrentPackage({ ...editingPackage, name: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Tipo de Evento Asociado</label>
                        <select
                          value={editingPackage.eventType}
                          onChange={(e) => handleUpdateCurrentPackage({ ...editingPackage, eventType: e.target.value as EventType })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        >
                          <option value="Boda">Boda</option>
                          <option value="XV Años">XV Años</option>
                          <option value="Evento Corporativo">Evento Corporativo</option>
                          <option value="Graduación">Graduación</option>
                          <option value="Concierto / Festival">Concierto / Festival</option>
                          <option value="Bautizo / Primera Comunión">Bautizo / Primera Comunión</option>
                          <option value="Spot Publicitario">Spot Publicitario</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Precio Base Sugerido (S/.)</label>
                        <input
                          type="number"
                          value={editingPackage.basePrice}
                          onChange={(e) => handleUpdateCurrentPackage({ ...editingPackage, totalPrice: Number(e.target.value), basePath: Number(e.target.value), basePrice: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Horas Estándar de Cobertura</label>
                        <input
                          type="number"
                          value={editingPackage.standardHours}
                          onChange={(e) => handleUpdateCurrentPackage({ ...editingPackage, standardHours: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-xs">Descripción Comercial</label>
                      <textarea
                        rows={2}
                        value={editingPackage.description}
                        onChange={(e) => handleUpdateCurrentPackage({ ...editingPackage, description: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    {/* Services Included in this package */}
                    <div className="space-y-2 pt-2 border-t border-slate-700">
                      <label className="block text-xs font-black text-amber-300 uppercase tracking-wider">
                        Servicios a Prestar para Cumplir con el Paquete ({editingPackage.includedServices.length})
                      </label>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newServiceInput}
                          onChange={(e) => setNewServiceInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddServiceToPackage()}
                          placeholder="Añadir servicio (ej. 2 Cámaras 4K, Trailer 3 min, Fotolibro 30x30...)"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                        />
                        <button
                          onClick={handleAddServiceToPackage}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {editingPackage.includedServices.map((srv, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs">
                            <span className="text-slate-200 flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              {srv}
                            </span>
                            <button
                              onClick={() => handleRemoveServiceFromPackage(idx)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1"
                              title="Quitar servicio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SLA Specifications */}
                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-700">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">SLA Video USB (días hábiles)</label>
                        <input
                          type="number"
                          value={editingPackage.slaDaysVideo}
                          onChange={(e) => handleUpdateCurrentPackage({ ...editingPackage, slaDaysVideo: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">SLA Fotolibro (días calendario)</label>
                        <input
                          type="number"
                          value={editingPackage.slaDaysPhotobook}
                          onChange={(e) => handleUpdateCurrentPackage({ ...editingPackage, slaDaysPhotobook: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold"
                        />
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
                    <Package className="w-10 h-10 text-slate-600 mb-2" />
                    <span>Selecciona un paquete de la lista izquierda para editar sus servicios o crea uno nuevo.</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: CHECKLISTS MAESTROS (12 PASOS) */}
          {activeTab === 'checklists' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: 12 Steps Selector */}
              <div className="lg:col-span-4 space-y-2">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                  Seleccionar Paso a Configurar (1 al 12)
                </h3>
                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                  {rules.stepChecklists.map((step) => {
                    const isSelected = selectedStepNumber === step.stepNumber;
                    return (
                      <button
                        key={step.stepNumber}
                        onClick={() => setSelectedStepNumber(step.stepNumber)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/80'
                        }`}
                      >
                        <span className="truncate">
                          {step.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ml-1 shrink-0 ${
                          isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {step.defaultChecklist.length} ítems
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Step Checklist Items Editor */}
              <div className="lg:col-span-8 bg-slate-800/90 rounded-2xl p-5 border border-slate-700 space-y-4">
                {currentStepChecklist && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-700 pb-3">
                      <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">
                        Estandarización de Calidad TCT
                      </span>
                      <h3 className="text-base font-black text-white mt-0.5">
                        {currentStepChecklist.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Los items configurados aquí se cargarán automáticamente en cada nuevo proyecto que inicie el equipo.
                      </p>
                    </div>

                    {/* Add Item Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                        placeholder="Nuevo ítem de verificación para este paso..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                      />
                      <button
                        onClick={handleAddChecklistItem}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Ítem</span>
                      </button>
                    </div>

                    {/* Checklist Items list */}
                    <div className="space-y-2">
                      {currentStepChecklist.defaultChecklist.map((itemText, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-black text-[11px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span>{itemText}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteChecklistItem(idx)}
                            className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                            title="Eliminar este ítem del checklist maestro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: CATÁLOGO DE EQUIPOS ESTÁNDAR */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-400" />
                    Inventario & Catálogo Estándar de Equipos ({rules.equipmentCatalog.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Equipos disponibles para checkout y asignación técnica en el Paso 3 y Paso 4.
                  </p>
                </div>
              </div>

              {/* Add equipment inline bar */}
              <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-5">
                  <label className="block text-slate-400 font-bold mb-1">Nombre del Equipo / Lente / Accesorio</label>
                  <input
                    type="text"
                    value={newEquipmentName}
                    onChange={(e) => setNewEquipmentName(e.target.value)}
                    placeholder="Ej. Sony FX3 Cinema Line 4K..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-slate-400 font-bold mb-1">Categoría</label>
                  <select
                    value={newEquipmentCategory}
                    onChange={(e) => setNewEquipmentCategory(e.target.value as EquipmentItem['category'])}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="Cámara">Cámara</option>
                    <option value="Lente">Lente</option>
                    <option value="Dron">Dron</option>
                    <option value="Audio">Audio</option>
                    <option value="Iluminación">Iluminación</option>
                    <option value="Estabilizadores / Soportes">Estabilizadores / Soportes</option>
                    <option value="Accesorios / Memorias">Accesorios / Memorias</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">N° Serie / Código</label>
                  <input
                    type="text"
                    value={newEquipmentSerial}
                    onChange={(e) => setNewEquipmentSerial(e.target.value)}
                    placeholder="SN-XXXX"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <button
                    onClick={handleAddEquipment}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-1 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Agregar</span>
                  </button>
                </div>
              </div>

              {/* Equipment Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rules.equipmentCatalog.map((eq) => (
                  <div key={eq.id} className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-700 text-amber-300">
                        {eq.category}
                      </span>
                      <h4 className="font-bold text-xs text-white">
                        {eq.name}
                      </h4>
                      {eq.serialNumber && (
                        <p className="text-[11px] font-mono text-slate-400">
                          {eq.serialNumber}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteEquipment(eq.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="Eliminar del inventario maestro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 4: FORMATOS & ACTAS DESCARGABLES */}
          {activeTab === 'formats' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Formats List */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Formatos Oficiales Corporación TCT
                </h3>
                <div className="space-y-2">
                  {rules.templateFormats.map((fmt) => {
                    const isSelected = selectedFormat?.id === fmt.id;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700 text-amber-300">
                            {fmt.category} (v{fmt.version})
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {fmt.updatedAt}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-white mt-1.5">
                          {fmt.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {fmt.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Format Preview & Upload Custom File */}
              <div className="lg:col-span-7 bg-slate-800/90 rounded-2xl p-5 border border-slate-700 space-y-4">
                {selectedFormat ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between flex-wrap gap-2 border-b border-slate-700 pb-3">
                      <div>
                        <span className="text-[10px] text-amber-400 font-extrabold uppercase">
                          {selectedFormat.category} • Versión {selectedFormat.version}
                        </span>
                        <h3 className="text-sm font-black text-white mt-0.5">
                          {selectedFormat.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Upload custom doc */}
                        <label className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-blue-400" />
                          <span>Subir Formato (.pdf/.doc/.txt)</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleCustomFileUpload(selectedFormat.id, e)}
                          />
                        </label>

                        {/* Download text template */}
                        <button
                          onClick={() => handleDownloadFormat(selectedFormat)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors flex items-center gap-1 shadow-md"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar Formato</span>
                        </button>
                      </div>
                    </div>

                    {selectedFormat.customFileName && (
                      <div className="p-2.5 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs text-blue-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          Archivo personalizado cargado: <strong>{selectedFormat.customFileName}</strong>
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 text-xs">
                        Contenido y Estructura del Documento / Acta
                      </label>
                      <textarea
                        rows={10}
                        value={selectedFormat.contentTemplate}
                        onChange={(e) => {
                          const updated = rules.templateFormats.map(f => f.id === selectedFormat.id ? { ...f, contentTemplate: e.target.value } : f);
                          setRules({ ...rules, templateFormats: updated });
                          setSelectedFormat({ ...selectedFormat, contentTemplate: e.target.value });
                        }}
                        className="w-full bg-slate-950 font-mono text-[11px] text-emerald-300 p-3 rounded-xl border border-slate-700 leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                    Selecciona un formato para previsualizarlo o descargarlo.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: POLÍTICAS DE CONTRATO & DESCUENTOS */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl space-y-6">
              
              <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4" />
                  Tarifas Oficiales de Horas Adicionales & Descuentos
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Tarifa Estándar por Hora Extra (S/.)
                    </label>
                    <input
                      type="number"
                      value={rules.standardExtraHourRate}
                      onChange={(e) => setRules({ ...rules, standardExtraHourRate: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Se aplicará por defecto en contratos cuando se añadan horas extra.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Descuento Máximo Autorizado (%)
                    </label>
                    <input
                      type="number"
                      value={rules.maxDiscountPercentageAllowed}
                      onChange={(e) => setRules({ ...rules, maxDiscountPercentageAllowed: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Límite porcentual de rebaja sin requerir aprobación de gerencia.
                    </p>
                  </div>
                </div>
              </div>

              {/* Authorized Contract Holders List */}
              <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 space-y-3">
                <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Asesores Comerciales & Responsables de Contrato Autorizados
                </h3>

                <div className="space-y-2 text-xs">
                  {rules.authorizedContractHolders.map((holder, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
                      <span className="font-bold flex items-center gap-2">
                        👤 {holder}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Bottom Footer Bar */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0 text-xs">
          <span className="text-slate-400">
            Corporación TCT • Estandarización de 12 Pasos Oficiales
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Guardar y Aplicar Reglas</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
