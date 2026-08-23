import React, { useState, useEffect } from 'react';
import { ProductionProject, EventType, AuthUser } from '../types';
import { createDefaultPhases } from '../data/templateWorkflow';
import { generateUniqueTCTCode, generateContractNumber } from '../utils/storage';
import { getStoredRules } from '../utils/rulesStorage';
import { getStoredUsers } from '../utils/authStorage';
import { TCTLogo } from './TCTLogo';
import confetti from 'canvas-confetti';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Coins, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Trash2,
  Tag, 
  Clock, 
  ShieldCheck, 
  Package, 
  FileCheck, 
  Receipt,
  FileText,
  CreditCard,
  Building,
  Eye,
  AlertCircle,
  CheckCircle2,
  Globe
} from 'lucide-react';

interface NewProjectModalProps {
  existingProjects: ProductionProject[];
  currentUser?: AuthUser | null;
  onClose: () => void;
  onCreateProject: (newProject: ProductionProject) => void;
}

interface EventScheduleDay {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

const EVENT_TYPES: EventType[] = [
  'Boda',
  'XV Años',
  'Evento Corporativo',
  'Graduación',
  'Concierto / Festival',
  'Bautizo / Primera Comunión',
  'Spot Publicitario',
  'Otro'
];

const PAYMENT_METHODS = [
  'Transferencia bancaria',
  'Depósito bancario',
  'Yape / Plin',
  'Efectivo en Oficina'
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  existingProjects,
  currentUser,
  onClose,
  onCreateProject
}) => {
  const masterRules = getStoredRules();
  const systemUsers = getStoredUsers();

  // Build advisor list
  const advisorOptions = systemUsers.length > 0
    ? systemUsers.map(u => `${u.fullName} - ${u.jobTitle || (u.role === 'admin' ? 'Administrador' : 'Asesor')}`)
    : (masterRules.authorizedContractHolders || ['Ing. Michael RomeroReyes - Administrador General']);

  const defaultAdvisor = currentUser 
    ? `${currentUser.fullName} - ${currentUser.jobTitle || (currentUser.role === 'admin' ? 'Administrador General' : 'Asesor Comercial')}`
    : (advisorOptions[0] || 'Ing. Michael RomeroReyes - Administrador General');

  const [eventType, setEventType] = useState<EventType>('Boda');
  const [title, setTitle] = useState('');
  
  // Client details
  const [clientName, setClientName] = useState('');
  const [clientDni, setClientDni] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventAddress, setEventAddress] = useState('');
  
  // Multiple event schedule dates & coverage times
  const defaultEventDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const [eventSchedules, setEventSchedules] = useState<EventScheduleDay[]>([
    {
      id: `day-${Date.now()}-1`,
      date: defaultEventDate,
      startTime: '16:00',
      endTime: '02:00'
    }
  ]);

  // Quotation & Contract Link
  const uniqueCode = generateUniqueTCTCode(eventType, existingProjects);
  const contractNumber = generateContractNumber(existingProjects);
  const quotationNumberStr = `COT-${new Date().getFullYear()}-${String(existingProjects.length + 101).padStart(3, '0')}`;
  const [quotationCode, setQuotationCode] = useState(quotationNumberStr);
  const [contractHolder, setContractHolder] = useState(defaultAdvisor);

  // Selected package
  const initialPackage = masterRules.packages[0];
  const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackage?.id || '');
  const [selectedPackageName, setSelectedPackageName] = useState<string>(initialPackage?.name || 'Paquete Personalizado');
  const [originalPackageBasePrice, setOriginalPackageBasePrice] = useState<number>(initialPackage?.basePrice || 3500);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; type?: 'image' | 'pdf'; name?: string } | null>(null);

  // Financials - Empty initial numeric values formatted as strings to permit easy editing and 2 decimals
  const [listPriceStr, setListPriceStr] = useState<string>(initialPackage ? String(initialPackage.basePrice) : '');
  const [discountAmountStr, setDiscountAmountStr] = useState<string>('');
  const [discountReason, setDiscountReason] = useState<string>('');
  
  // Hours and Extra Services
  const [standardHours, setStandardHours] = useState<number>(initialPackage?.standardHours || 8);
  const [extraHoursCountStr, setExtraHoursCountStr] = useState<string>('');
  const [extraHourRate, setExtraHourRate] = useState<number>(masterRules.standardExtraHourRate || 150);
  const [additionalEquipmentNotes, setAdditionalEquipmentNotes] = useState<string>('');

  // Initial deposit & payment method details
  const [initialDepositStr, setInitialDepositStr] = useState<string>('');
  const [paymentMethodDeposit, setPaymentMethodDeposit] = useState<string>('Transferencia bancaria');
  const [depositOperationCode, setDepositOperationCode] = useState<string>('');
  const [depositBankName, setDepositBankName] = useState<string>('');

  // Deliverables - Desactivados inicialmente (false por defecto)
  const [includesPhotobook, setIncludesPhotobook] = useState(false);
  const [includesPhotoshoot, setIncludesPhotoshoot] = useState(false);
  const [includesDrone, setIncludesDrone] = useState(false);
  const [giftIncluded, setGiftIncluded] = useState(false);
  const [specialContractClause, setSpecialContractClause] = useState('');

  // Client Authorization for Online Publication (SI / NO)
  const [authorizeInternetPublishing, setAuthorizeInternetPublishing] = useState<boolean>(true);

  // Form Validation Errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sequential field guide: find the current empty required field
  const nameWords = clientName.trim().split(/\s+/).filter(Boolean);
  const nextRequiredField = !title.trim() 
    ? 'title'
    : nameWords.length < 3 
    ? 'name' 
    : !/^\d{8}$/.test(clientDni.trim()) 
    ? 'dni' 
    : !/^9\d{8}$/.test(clientPhone.trim()) 
    ? 'phone' 
    : parseFloat(initialDepositStr || '0') <= 0
    ? 'deposit'
    : '';

  // Parse numeric values safely with up to 2 decimal places
  const listPriceNum = listPriceStr === '' ? 0 : Number(parseFloat(listPriceStr).toFixed(2)) || 0;
  const discountAmountNum = discountAmountStr === '' ? 0 : Number(parseFloat(discountAmountStr).toFixed(2)) || 0;
  const extraHoursCountNum = extraHoursCountStr === '' ? 0 : Number(parseFloat(extraHoursCountStr).toFixed(2)) || 0;
  const initialDepositNum = initialDepositStr === '' ? 0 : Number(parseFloat(initialDepositStr).toFixed(2)) || 0;

  const extraHoursTotal = Number((extraHoursCountNum * extraHourRate).toFixed(2));
  const computedTotal = Number(Math.max(0, listPriceNum - discountAmountNum + extraHoursTotal).toFixed(2));
  const finalBalance = Number(Math.max(0, computedTotal - initialDepositNum).toFixed(2));

  // Package selector handler
  const handlePackageChange = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const pkg = masterRules.packages.find(p => p.id === pkgId);
    if (pkg) {
      setSelectedPackageName(pkg.name);
      setEventType(pkg.eventType);
      setOriginalPackageBasePrice(pkg.basePrice);
      setListPriceStr(String(pkg.basePrice));
      setStandardHours(pkg.standardHours);
      setIncludesDrone(pkg.includesDrone);
      setIncludesPhotobook(pkg.includesPhotobook);
    }
  };

  // Schedule helpers
  const handleAddScheduleDay = () => {
    const lastDay = eventSchedules[eventSchedules.length - 1];
    let nextDate = defaultEventDate;
    if (lastDay && lastDay.date) {
      const d = new Date(lastDay.date);
      d.setDate(d.getDate() + 1);
      nextDate = d.toISOString().split('T')[0];
    }
    setEventSchedules(prev => [
      ...prev,
      {
        id: `day-${Date.now()}-${prev.length + 1}`,
        date: nextDate,
        startTime: '10:00',
        endTime: '18:00'
      }
    ]);
  };

  const handleRemoveScheduleDay = (id: string) => {
    if (eventSchedules.length <= 1) return;
    setEventSchedules(prev => prev.filter(d => d.id !== id));
  };

  const handleUpdateScheduleDay = (id: string, field: keyof EventScheduleDay, value: string) => {
    setEventSchedules(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  // Handler for strict 8-digit DNI input
  const handleDniChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 8);
    setClientDni(digitsOnly);
  };

  // Handler for 9-digit Cellphone starting with 9
  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 9);
    setClientPhone(digitsOnly);
  };

  // Format numeric inputs to allow clean editing and 2 decimals
  const handleNumericInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow numbers and at most one decimal point with 2 decimals
    if (val === '' || /^\d+(\.\d{0,2})?$/.test(val)) {
      setter(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // 1. Client Name validation: minimum 3 words (names and surnames)
    const nameWords = clientName.trim().split(/\s+/).filter(Boolean);
    if (nameWords.length < 3) {
      errors.push('El Nombre del cliente debe contener como mínimo 3 nombres (nombres y apellidos completos).');
    }

    // 2. DNI validation: exactly 8 digits
    if (!/^\d{8}$/.test(clientDni.trim())) {
      errors.push('El DNI debe contener exactamente 8 dígitos numéricos.');
    }

    // 3. Phone validation: 9 digits, must start with 9 (between 900000000 and 999999999)
    if (!/^9\d{8}$/.test(clientPhone.trim())) {
      errors.push('El Celular debe tener 9 dígitos numéricos y comenzar con 9 (ej. 987654321).');
    }

    // 4. If discount > 0, reason is strictly required
    if (discountAmountNum > 0 && !discountReason.trim()) {
      errors.push('De haber descuento, es obligatorio registrar el Motivo del Descuento.');
    }

    // 5. If list price varies from original package price, additional equipment / special clauses note is strictly required
    if (listPriceNum !== originalPackageBasePrice && !additionalEquipmentNotes.trim()) {
      errors.push('Al variar el precio original de lista base de la proforma (S/. ' + originalPackageBasePrice + '), es obligatorio registrar la justificación en "Equipos Adicionales / Cláusulas Especiales".');
    }

    // 6. At least one valid date
    if (eventSchedules.length === 0 || !eventSchedules[0].date) {
      errors.push('Debe registrar al menos una fecha de evento.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      // Scroll to error banner
      const errElem = document.getElementById('new-project-validation-errors');
      if (errElem) {
        errElem.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setValidationErrors([]);

    // Primary event date and formatted schedule representation
    const primaryEventDate = eventSchedules[0].date;
    const formattedScheduleString = eventSchedules
      .map((s, idx) => `Día ${idx + 1} (${s.date}): ${s.startTime || '16:00'} - ${s.endTime || '02:00'}`)
      .join(' | ');

    const estimatedDelivery = new Date(new Date(primaryEventDate).getTime() + 15 * 86400000).toISOString().split('T')[0];
    const initialPhases = createDefaultPhases(primaryEventDate, includesPhotobook);

    const matchedAdvisor = systemUsers.find(u =>
      contractHolder.includes(u.fullName) || (currentUser && u.id === currentUser.id)
    ) || currentUser;

    const advisorName = matchedAdvisor?.fullName || currentUser?.fullName || contractHolder.split(' - ')[0] || 'Michael Romero';
    const advisorDni = matchedAdvisor?.dni || currentUser?.dni || '45892314';
    const creatorName = currentUser?.fullName || advisorName;
    const creatorDni = currentUser?.dni || advisorDni;

    const newProject: ProductionProject = {
      id: `tct-proj-${Date.now()}`,
      uniqueCode,
      quotationCode: quotationCode.trim(),
      contractNumber,
      contractHolder: contractHolder.trim(),
      contractHolderDni: advisorDni,
      createdByName: creatorName,
      createdByDni: creatorDni,
      title: title.trim() || `${eventType}: ${clientName || 'Producción Audiovisual'}`,
      clientName: clientName.trim(),
      clientDniRuc: clientDni.trim(),
      clientAddress: clientAddress.trim(),
      clientPhone: clientPhone.trim() ? `+51 ${clientPhone.trim()}` : '',
      clientEmail: clientEmail.trim(),
      eventType,
      eventDate: primaryEventDate,
      eventLocation: eventLocation.trim() || 'Por definir',
      eventAddress: eventAddress.trim() || eventLocation.trim() || 'Por definir',
      eventTime: formattedScheduleString,
      eventStartTime: eventSchedules[0]?.startTime || '16:00',
      eventEndTime: eventSchedules[0]?.endTime || '02:00',
      eventSchedules: eventSchedules.map(s => ({ date: s.date, startTime: s.startTime, endTime: s.endTime })),
      selectedPackageName,
      listPrice: listPriceNum,
      discountAmount: discountAmountNum,
      discountReason: discountReason.trim(),
      standardHours: Number(standardHours),
      extraHoursCount: extraHoursCountNum,
      extraHourRate: Number(extraHourRate),
      additionalEquipmentNotes: additionalEquipmentNotes.trim(),
      totalBudget: computedTotal,
      initialDeposit: initialDepositNum,
      paymentMethodDeposit,
      depositOperationCode: depositOperationCode.trim(),
      depositBankName: depositBankName.trim(),
      fieldPayment: 0,
      finalBalance,
      currency: 'PEN',
      includesPhotobook,
      includesPhotoshoot,
      includesDrone,
      giftIncluded,
      specialContractClause: specialContractClause.trim(),
      authorizeInternetPublishing,
      estimatedDeliveryDate: estimatedDelivery,
      assignedStaff: [
        { id: `st-${Date.now()}-1`, name: 'Carlos Mendoza', role: 'Director de Cámara', phone: '+51 912 345 678', confirmed: true },
        { id: `st-${Date.now()}-2`, name: 'Valeria Castro', role: 'Fotógrafo Principal', phone: '+51 923 456 789', confirmed: true }
      ],
      equipmentList: [
        { id: `eq-${Date.now()}-1`, name: 'Sony FX3 Cinema 4K', category: 'Cámara', checkedOut: true },
        { id: `eq-${Date.now()}-2`, name: 'Kit Micrófonos Inalámbricos DJI', category: 'Audio', checkedOut: true }
      ],
      phases: initialPhases,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };

    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (err) {}

    onCreateProject(newProject);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
        
        {/* Concise Header as requested: Logo de TCT, "TCT", "NUEVA PRODUCCION" */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <TCTLogo size="sm" variant="icon-only" />
            <div className="flex items-center space-x-2">
              <span className="text-base sm:text-lg font-black tracking-wider text-white">
                TCT
              </span>
              <span className="text-slate-500 font-black">•</span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-400">
                NUEVA PRODUCCION
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Errors Banner */}
        {validationErrors.length > 0 && (
          <div id="new-project-validation-errors" className="bg-red-50 border-b border-red-200 p-4 space-y-1.5 animate-fadeIn">
            <div className="flex items-center space-x-2 text-red-800 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Por favor verifique los siguientes requisitos para continuar:</span>
            </div>
            <ul className="list-disc pl-7 text-[11px] text-red-700 font-medium space-y-0.5">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          
          {/* Linked Codes & Commercial Advisor */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-2xl border border-slate-700 shadow-md space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Vinculación de Códigos Oficiales & Asesor Comercial
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                MONEDA: SOLES (S/.)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-amber-400" /> Código de Cotización Ref.
                </label>
                <input
                  type="text"
                  value={quotationCode}
                  onChange={(e) => setQuotationCode(e.target.value)}
                  className="w-full bg-slate-950 font-mono font-black text-amber-300 px-3 py-2 rounded-xl border border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> N° de Contrato Generado
                </label>
                <input
                  type="text"
                  value={contractNumber}
                  readOnly
                  className="w-full bg-slate-950/80 font-mono font-bold text-slate-200 px-3 py-2 rounded-xl border border-slate-800 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Asesor Comercial
                  </span>
                  {currentUser && currentUser.role !== 'admin' && (
                    <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                      Autoasignado
                    </span>
                  )}
                </label>
                {currentUser && currentUser.role !== 'admin' ? (
                  <div className="w-full bg-slate-950/80 font-bold text-amber-300 px-3 py-2 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="truncate">{contractHolder}</span>
                    <span className="text-[10px] text-slate-500 font-mono">(Fijo)</span>
                  </div>
                ) : (
                  <select
                    value={contractHolder}
                    onChange={(e) => setContractHolder(e.target.value)}
                    className="w-full bg-slate-950 text-white font-bold px-3 py-2 rounded-xl border border-slate-700 focus:ring-2 focus:ring-amber-500"
                  >
                    {advisorOptions.map((holder, idx) => (
                      <option key={idx} value={holder}>
                        {holder}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Section 1: Package Selection */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                1. Selección de Paquete & Proforma Oficial
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Selecciona una proforma para auto-cargar horas y precio base
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {masterRules.packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => handlePackageChange(pkg.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900">{pkg.name}</span>
                        <span className="font-mono font-black text-emerald-700">S/. {pkg.basePrice}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold">
                        <span>⏱ {pkg.standardHours}h</span>
                        <span>{pkg.includesDrone ? '🛸 Dron' : ''}</span>
                        <span>{pkg.includesPhotobook ? '📖 Fotobook' : ''}</span>
                      </div>

                      {pkg.attachmentUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewAttachment({
                              url: pkg.attachmentUrl!,
                              type: pkg.attachmentType || 'image',
                              name: pkg.attachmentName || `Proforma ${pkg.name}`
                            });
                          }}
                          className="w-full mt-1.5 py-1 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-black flex items-center justify-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver Proforma / PDF Adjunto</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Event Details, Multiple Dates & Coverage Times */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                2. Fechas de Trabajo, Horario de Cobertura y Locación
              </label>
            </div>
            
            {/* Event Type Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EVENT_TYPES.map(type => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setEventType(type)}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    eventType === type 
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span>Título de la Producción *</span>
                  {nextRequiredField === 'title' && (
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-black animate-pulse">
                      Paso 1: Escriba el título
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título de la producción (Ej: Boda Real: Carolina & Fernando)"
                  className={`w-full p-2.5 text-xs font-bold rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400 placeholder:font-normal bg-white transition-all ${
                    nextRequiredField === 'title'
                      ? 'border-2 border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/40 animate-pulse'
                      : 'border border-slate-300'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Salón / Distrito / Locación</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Salón / Distrito / Locación (Ej: Hacienda Villa, Cieneguilla)"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400 placeholder:font-normal bg-white"
                />
              </div>
            </div>

            {/* Dynamic Event Dates & Time Inputs with Clock Selector and Add Day Button right inside */}
            <div className="space-y-2.5 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-black text-slate-700 pb-1 border-b border-slate-200/80">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Fechas y Horario de Cobertura ({eventSchedules.length} {eventSchedules.length === 1 ? 'jornada' : 'jornadas de trabajo'})
                </span>
                
                {/* Button (+) to add multiple event working dates relocated inside this box */}
                <button
                  type="button"
                  onClick={handleAddScheduleDay}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-amber-500"
                  title="Añadir otro día de trabajo / cobertura"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>Añadir Día (+)</span>
                </button>
              </div>

              {eventSchedules.map((schedule, idx) => (
                <div 
                  key={schedule.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs"
                >
                  <div className="sm:col-span-1 flex items-center">
                    <span className="px-2 py-1 rounded-lg bg-slate-900 text-white font-mono font-black text-[10px]">
                      Día {idx + 1}
                    </span>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Fecha del Evento</label>
                    <input
                      type="date"
                      value={schedule.date}
                      onChange={(e) => handleUpdateScheduleDay(schedule.id, 'date', e.target.value)}
                      className="w-full p-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" /> Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => handleUpdateScheduleDay(schedule.id, 'startTime', e.target.value)}
                      className="w-full p-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-500" /> Hora Fin
                    </label>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => handleUpdateScheduleDay(schedule.id, 'endTime', e.target.value)}
                      className="w-full p-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    {eventSchedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveScheduleDay(schedule.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar este día"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">Dirección Exacta del Evento</label>
              <input
                type="text"
                value={eventAddress}
                onChange={(e) => setEventAddress(e.target.value)}
                placeholder="Av. Manuel Valle Km 5.5, Lurín"
                className="w-full p-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Section 3: Client Details for Contract (Strict Validations) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                3. Datos del Cliente / Contratante (Para Contrato)
              </label>
              <span className="text-[10px] text-slate-500 font-bold">
                * Campos con validación estricta
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span>Nombre Completo *</span>
                  {nextRequiredField === 'name' && (
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-black animate-pulse">
                      Paso 2
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Luciana Morales Prado"
                  className={`w-full p-2 border rounded-xl font-bold transition-all ${
                    nextRequiredField === 'name'
                      ? 'border-2 border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/40 animate-pulse'
                      : clientName.trim() && clientName.trim().split(/\s+/).filter(Boolean).length < 3
                      ? 'border-amber-400 bg-amber-50/50'
                      : 'border-slate-300'
                  }`}
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {clientName.trim() ? `${clientName.trim().split(/\s+/).filter(Boolean).length} palabras ingresadas (mínimo 3)` : 'Mínimo 3 nombres y apellidos'}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span>DNI (8 dígitos) *</span>
                  {nextRequiredField === 'dni' && (
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-black animate-pulse">
                      Paso 3
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={clientDni}
                  onChange={(e) => handleDniChange(e.target.value)}
                  maxLength={8}
                  placeholder="74839201"
                  className={`w-full p-2 border rounded-xl font-mono font-bold transition-all ${
                    nextRequiredField === 'dni'
                      ? 'border-2 border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/40 animate-pulse'
                      : 'border-slate-300'
                  }`}
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {clientDni.length}/8 dígitos
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span>Celular (9 dígitos) *</span>
                  {nextRequiredField === 'phone' && (
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-black animate-pulse">
                      Paso 4
                    </span>
                  )}
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-100 border border-r-0 border-slate-300 px-2 py-2 rounded-l-xl text-slate-600 font-mono text-xs font-bold">
                    +51
                  </span>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    maxLength={9}
                    placeholder="987654321"
                    className={`w-full p-2 border rounded-r-xl font-mono font-bold transition-all ${
                      nextRequiredField === 'phone'
                        ? 'border-2 border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/40 animate-pulse'
                        : 'border-slate-300'
                    }`}
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {clientPhone.length}/9 dígitos (inicia con 9)
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Correo Electrónico <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@gmail.com"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Para envío de copia
                </span>
              </div>
            </div>

            {/* Domicilio exacto del cliente */}
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs flex items-center justify-between">
                <span>Domicilio Exacto del Cliente <span className="text-slate-400 font-normal">(Para Cláusula Primera del Contrato)</span></span>
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Ej: Av. San Carlos 1450, Urb. San Antonio, Huancayo"
                className="w-full p-2 text-xs border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400 bg-white"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Dirección legal o residencial del contratante para el expediente y contrato privado
              </span>
            </div>
          </div>

          {/* Section 4: Discounts, Hours & Financials in Soles (S/.) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-600" />
              4. Desglose Financiero, Descuentos & Adelanto (S/.)
            </label>

            {/* List Price, Discount, Extra Hours Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-300">
                <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                  <span>Precio de Lista Base (S/.)</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                    🔒 Proforma Oficial
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={listPriceStr}
                  readOnly
                  disabled
                  placeholder="0.00"
                  className="w-full p-2 text-sm font-black border border-slate-300 rounded-lg bg-slate-200/70 text-slate-800 font-mono cursor-not-allowed select-none shadow-inner"
                  required
                />
                <span className="text-[10px] text-slate-500 font-bold block mt-1">
                  * Precio bloqueado según el paquete/proforma registrada.
                </span>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <label className="block text-emerald-900 font-bold mb-1">
                  Descuento Otorgado (S/.)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={discountAmountStr}
                  onChange={handleNumericInput(setDiscountAmountStr)}
                  placeholder="0.00"
                  className="w-full p-2 text-sm font-black border border-emerald-300 rounded-lg bg-white text-emerald-800 font-mono"
                />
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Motivo del descuento (Obligatorio si hay descuento)..."
                  className={`w-full mt-1.5 p-1.5 text-[11px] border rounded-lg bg-white placeholder-slate-400 ${
                    discountAmountNum > 0 && !discountReason.trim()
                      ? 'border-amber-400 ring-1 ring-amber-400'
                      : 'border-emerald-200'
                  }`}
                />
              </div>

              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200">
                <label className="block text-purple-900 font-bold mb-1">
                  Horas Extra ({extraHoursCountNum} hrs)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={extraHoursCountStr}
                    onChange={handleNumericInput(setExtraHoursCountStr)}
                    placeholder="0"
                    className="w-1/2 p-2 text-sm font-bold border border-purple-300 rounded-lg bg-white text-purple-900"
                  />
                  <div className="w-1/2 text-right self-center text-xs font-mono font-black text-purple-900">
                    + S/. {extraHoursTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional equipment / services field */}
            <div className="text-xs">
              <label className="block text-slate-700 font-bold mb-1">
                Equipos Adicionales / Cláusulas Especiales
              </label>
              <input
                type="text"
                value={additionalEquipmentNotes}
                onChange={(e) => setAdditionalEquipmentNotes(e.target.value)}
                placeholder="Ej. 1 Dron adicional, trípodes heavy duty, 2 pantallas de retorno..."
                className="w-full p-2 border border-slate-300 rounded-xl bg-white"
              />
            </div>

            {/* Summary Totals & Deposit Box */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block font-bold">PRESUPUESTO TOTAL (S/.)</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  S/. {computedTotal.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px] font-bold flex items-center justify-between">
                  <span>ADELANTO INICIAL (S/.) *</span>
                  {nextRequiredField === 'deposit' && (
                    <span className="text-[10px] text-amber-300 bg-amber-500/30 border border-amber-400 px-1.5 py-0.2 rounded font-black animate-pulse">
                      Paso 5: Ingrese monto
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={initialDepositStr}
                  onChange={handleNumericInput(setInitialDepositStr)}
                  placeholder="0.00"
                  className={`w-full border rounded-lg px-2 py-1.5 text-sm font-bold font-mono transition-all ${
                    nextRequiredField === 'deposit'
                      ? 'bg-amber-950/80 border-2 border-amber-400 ring-2 ring-amber-400/50 text-amber-300 animate-pulse'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
                <select
                  value={paymentMethodDeposit}
                  onChange={(e) => setPaymentMethodDeposit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-amber-300 font-bold p-1"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* Operation Code & Bank Inputs for deposits */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div>
                    <label className="text-slate-400 text-[9.5px] block font-bold mb-0.5">
                      Cód. Operación:
                    </label>
                    <input
                      type="text"
                      value={depositOperationCode}
                      onChange={(e) => setDepositOperationCode(e.target.value)}
                      placeholder="Ej: OP-849201"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-md px-1.5 py-1 text-[10px] text-amber-300 font-mono placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[9.5px] block font-bold mb-0.5">
                      Banco Procedencia:
                    </label>
                    <input
                      type="text"
                      value={depositBankName}
                      onChange={(e) => setDepositBankName(e.target.value)}
                      placeholder="Ej: BCP, BBVA, Interbank"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-md px-1.5 py-1 text-[10px] text-amber-300 font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-bold">SALDO PENDIENTE 7:00 PM</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  S/. {finalBalance.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  * Liquidar en campo antes de 7:00 PM
                </span>
              </div>
            </div>

            {/* Deliverable Checkboxes with updated requested names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer p-3 rounded-xl bg-pink-50 border border-pink-200 hover:bg-pink-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={includesPhotobook}
                  onChange={(e) => setIncludesPhotobook(e.target.checked)}
                  className="w-4 h-4 text-pink-600 rounded"
                />
                <span className="font-bold text-pink-950 text-xs">
                  Incluye Fotobook (plazo 30 Días)
                </span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer p-3 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={includesPhotoshoot}
                  onChange={(e) => setIncludesPhotoshoot(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="font-bold text-purple-950 text-xs">
                  Incluye sesión fotográfica (1 camara de foto, plazo 15 días )
                </span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer p-3 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={includesDrone}
                  onChange={(e) => setIncludesDrone(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <span className="font-bold text-sky-950 text-xs">
                  Incluye Cobertura Dron 4K
                </span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer p-3 rounded-xl bg-amber-50/80 border border-amber-200 hover:bg-amber-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={giftIncluded}
                  onChange={(e) => setGiftIncluded(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="font-bold text-amber-950 text-xs">
                  Incluye Regalo Sorpresa TCT (día de entrega)
                </span>
              </label>
            </div>

            {/* Special Additional Clause (Cláusula Quinta en Contrato) */}
            <div className="text-xs space-y-1">
              <label className="block text-slate-700 font-bold flex items-center justify-between">
                <span>Cláusula Quinta Especial / Acuerdos Adicionales (Opcional)</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  * Si se registra, figurará en el contrato. Si queda vacío, no se mostrará Cláusula Quinta.
                </span>
              </label>
              <textarea
                rows={2}
                value={specialContractClause}
                onChange={(e) => setSpecialContractClause(e.target.value)}
                placeholder="Ej. Se acuerda entregar 1 reel vertical para Instagram a los 5 días hábiles..."
                className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Online Publication Authorization (Resaltado en Color Especial y Negrita) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 border-2 border-amber-400/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <Globe className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-slate-950 tracking-tight">
                  El Cliente autoriza la publicacion del evento, en internet
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAuthorizeInternetPublishing(true)}
                  className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    authorizeInternetPublishing
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ✓ SI
                </button>
                <button
                  type="button"
                  onClick={() => setAuthorizeInternetPublishing(false)}
                  className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    !authorizeInternetPublishing
                      ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ✕ NO
                </button>
              </div>
            </div>

          </div>

          {/* Footer with Submit Button: "Generar Contrato" */}
          <div className="pt-2 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg"
            >
              <FileCheck className="w-4 h-4" />
              <span>Generar Contrato</span>
            </button>
          </div>

        </form>

      </div>

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div 
          className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewAttachment(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-white text-sm">{previewAttachment.name || 'Proforma Oficial'}</h4>
              </div>
              <button 
                onClick={() => setPreviewAttachment(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto py-4 flex items-center justify-center">
              {previewAttachment.type === 'pdf' || previewAttachment.url.startsWith('data:application/pdf') ? (
                <iframe 
                  src={previewAttachment.url} 
                  className="w-full h-[60vh] rounded-xl border border-slate-800"
                  title="PDF Proforma"
                />
              ) : (
                <img 
                  src={previewAttachment.url} 
                  alt={previewAttachment.name || 'Proforma'} 
                  className="max-h-[65vh] object-contain rounded-xl shadow-lg border border-slate-800"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
