import React, { useState } from 'react';
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
  Tag, 
  Clock, 
  ShieldCheck, 
  Package, 
  FileCheck, 
  Receipt,
  FileText,
  CreditCard,
  Building,
  Image,
  Eye
} from 'lucide-react';

interface NewProjectModalProps {
  existingProjects: ProductionProject[];
  currentUser?: AuthUser | null;
  onClose: () => void;
  onCreateProject: (newProject: ProductionProject) => void;
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
  'Transferencia BCP',
  'Transferencia BBVA',
  'Transferencia Interbank',
  'Yape / Plin',
  'Efectivo en Oficina',
  'Tarjeta Débito/Crédito'
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  existingProjects,
  currentUser,
  onClose,
  onCreateProject
}) => {
  const masterRules = getStoredRules();
  const systemUsers = getStoredUsers();

  // Build advisor list exclusively from registered users
  const advisorOptions = systemUsers.length > 0
    ? systemUsers.map(u => `${u.fullName} - ${u.jobTitle || (u.role === 'admin' ? 'Administrador' : 'Asesor')}`)
    : (masterRules.authorizedContractHolders || ['Ing. Michael RomeroReyes - Administrador General']);

  // Auto-default advisor to logged in user if available!
  const defaultAdvisor = currentUser 
    ? `${currentUser.fullName} - ${currentUser.jobTitle || (currentUser.role === 'admin' ? 'Administrador General' : 'Asesor Comercial')}`
    : (advisorOptions[0] || 'Ing. Michael RomeroReyes - Administrador General');

  const [eventType, setEventType] = useState<EventType>('Boda');
  const [title, setTitle] = useState('Boda Especial: ');
  const [clientName, setClientName] = useState('');
  const [clientDniRuc, setClientDniRuc] = useState('');
  const [clientPhone, setClientPhone] = useState('+51 ');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  
  const [eventDate, setEventDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [eventLocation, setEventLocation] = useState('Salón de Eventos / Lima');
  const [eventAddress, setEventAddress] = useState('');
  const [eventTime, setEventTime] = useState('16:00 - 02:00');
  
  // Quotation & Contract Link
  const uniqueCode = generateUniqueTCTCode(eventType, existingProjects);
  const contractNumber = generateContractNumber(existingProjects);
  const quotationNumberStr = `COT-${new Date().getFullYear()}-${String(existingProjects.length + 101).padStart(3, '0')}`;
  const [quotationCode, setQuotationCode] = useState(quotationNumberStr);
  const [contractHolder, setContractHolder] = useState(defaultAdvisor);

  // Selected package from Master Rules
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    masterRules.packages[0]?.id || ''
  );
  const [selectedPackageName, setSelectedPackageName] = useState<string>(
    masterRules.packages[0]?.name || 'Paquete Personalizado'
  );
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; type?: 'image' | 'pdf'; name?: string } | null>(null);

  // Financials & Discounts in Soles (S/.)
  const [listPrice, setListPrice] = useState<number>(masterRules.packages[0]?.basePrice || 3500);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  
  // Hours and Extra Services
  const [standardHours, setStandardHours] = useState<number>(masterRules.packages[0]?.standardHours || 8);
  const [extraHoursCount, setExtraHoursCount] = useState<number>(0);
  const [extraHourRate, setExtraHourRate] = useState<number>(masterRules.standardExtraHourRate || 150);
  const [additionalEquipmentNotes, setAdditionalEquipmentNotes] = useState<string>('');

  // Payment method for initial deposit
  const [initialDeposit, setInitialDeposit] = useState(1200);
  const [paymentMethodDeposit, setPaymentMethodDeposit] = useState<string>('Transferencia BCP');

  const [includesPhotobook, setIncludesPhotobook] = useState(true);
  const [includesDrone, setIncludesDrone] = useState(true);

  // Calculate dynamic total in Soles (S/.)
  const extraHoursTotal = extraHoursCount * extraHourRate;
  const computedTotal = Math.max(0, listPrice - discountAmount + extraHoursTotal);
  const finalBalance = Math.max(0, computedTotal - initialDeposit);

  // When package selection changes
  const handlePackageChange = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const pkg = masterRules.packages.find(p => p.id === pkgId);
    if (pkg) {
      setSelectedPackageName(pkg.name);
      setEventType(pkg.eventType);
      setListPrice(pkg.basePrice);
      setStandardHours(pkg.standardHours);
      setIncludesDrone(pkg.includesDrone);
      setIncludesPhotobook(pkg.includesPhotobook);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Por favor ingrese el nombre completo del cliente');
      return;
    }

    const estimatedDelivery = new Date(new Date(eventDate).getTime() + 15 * 86400000).toISOString().split('T')[0];
    const initialPhases = createDefaultPhases(eventDate, includesPhotobook);

    const newProject: ProductionProject = {
      id: `tct-proj-${Date.now()}`,
      uniqueCode,
      quotationCode: quotationCode.trim(),
      contractNumber,
      contractHolder: contractHolder.trim(),
      title: title.trim() || `${eventType}: ${clientName}`,
      clientName: clientName.trim(),
      clientDniRuc: clientDniRuc.trim() || '73849201',
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      eventType,
      eventDate,
      eventLocation: eventLocation.trim(),
      eventAddress: eventAddress.trim() || eventLocation.trim(),
      eventTime: eventTime.trim(),
      selectedPackageName,
      listPrice: Number(listPrice),
      discountAmount: Number(discountAmount),
      discountReason: discountReason.trim(),
      standardHours: Number(standardHours),
      extraHoursCount: Number(extraHoursCount),
      extraHourRate: Number(extraHourRate),
      additionalEquipmentNotes: additionalEquipmentNotes.trim(),
      totalBudget: computedTotal,
      initialDeposit: Number(initialDeposit),
      paymentMethodDeposit,
      fieldPayment: 0,
      finalBalance,
      currency: 'PEN',
      includesPhotobook,
      includesDrone,
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
        
        {/* Header with Official Logo */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <TCTLogo size="sm" variant="icon-only" />
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Corporación TCT • Registro de Nueva Producción & Formato de Contrato
              </span>
              <h2 className="text-sm sm:text-base font-black text-white">
                Ficha Técnica, Condiciones Comerciales y Generación de Contrato Oficial
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          
          {/* Linked Codes & Contract Holder Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-2xl border border-slate-700 shadow-md space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Vinculación de Códigos Oficiales & Asesor Comercial
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                MONEDA: SOLES PERUANOS (S/.)
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
                <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Asesor Comercial Asignado
                </label>
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
              </div>
            </div>
          </div>

          {/* Section 1: Proforma & Package Selection */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                1. Selección de Paquete & Proforma Oficial
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Selecciona una proforma para auto-cargar horas y especificaciones
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
                        <span>{pkg.includesPhotobook ? '📖 Fotolibro' : ''}</span>
                      </div>

                      {/* Attached Proforma preview button if available */}
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

          {/* Section 2: Event Details & Location */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
              2. Tipo de Evento, Título y Ubicación Exacta
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EVENT_TYPES.map(type => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    setEventType(type);
                    if (title.startsWith('Boda') || title.startsWith('XV') || title.startsWith('Evento')) {
                      setTitle(`${type}: `);
                    }
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all ${
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
                <label className="block text-slate-700 font-bold mb-1">Título de la Producción</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Boda Real: Carolina & Fernando"
                  className="w-full p-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Salón / Distrito / Locación</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Hacienda Villa, Cieneguilla"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Fecha del Evento</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Horario de Cobertura</label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="16:00 - 02:00"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Dirección Exacta del Evento</label>
                <input
                  type="text"
                  value={eventAddress}
                  onChange={(e) => setEventAddress(e.target.value)}
                  placeholder="Av. Manuel Valle Km 5.5, Lurín"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Client Details for Contract */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              3. Datos del Cliente / Contratante (Para Contrato)
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Nombre Completo del Titular</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Luciana Morales Prado"
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">DNI / RUC / Carnet</label>
                <input
                  type="text"
                  value={clientDniRuc}
                  onChange={(e) => setClientDniRuc(e.target.value)}
                  placeholder="74839201"
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>
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
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">Precio de Lista Base (S/.)</label>
                <input
                  type="number"
                  value={listPrice}
                  onChange={(e) => setListPrice(Number(e.target.value))}
                  className="w-full p-2 text-sm font-black border border-slate-300 rounded-lg bg-white text-slate-900 font-mono"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <label className="block text-emerald-900 font-bold mb-1">Descuento Otorgado (S/.)</label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full p-2 text-sm font-black border border-emerald-300 rounded-lg bg-white text-emerald-800 font-mono"
                />
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Motivo del descuento..."
                  className="w-full mt-1.5 p-1.5 text-[11px] border border-emerald-200 rounded-lg bg-white placeholder-slate-400"
                />
              </div>

              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200">
                <label className="block text-purple-900 font-bold mb-1">Horas Extra ({extraHoursCount} hrs)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={extraHoursCount}
                    min={0}
                    onChange={(e) => setExtraHoursCount(Number(e.target.value))}
                    placeholder="Horas extra"
                    className="w-1/2 p-2 text-sm font-bold border border-purple-300 rounded-lg bg-white text-purple-900"
                  />
                  <div className="w-1/2 text-right self-center text-xs font-mono font-black text-purple-900">
                    + S/. {extraHoursTotal}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional equipment / services field */}
            <div className="text-xs">
              <label className="block text-slate-700 font-bold mb-1">Equipos Adicionales / Cláusulas Especiales</label>
              <input
                type="text"
                value={additionalEquipmentNotes}
                onChange={(e) => setAdditionalEquipmentNotes(e.target.value)}
                placeholder="Ej. 1 Dron adicional, trípodes heavy duty, 2 pantallas de retorno..."
                className="w-full p-2 border border-slate-300 rounded-xl"
              />
            </div>

            {/* Summary Totals & Deposit Box */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block font-bold">PRESUPUESTO TOTAL (S/.)</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  S/. {computedTotal.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block font-bold mb-1">ADELANTO INICIAL (S/.)</label>
                <input
                  type="number"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm font-bold text-white font-mono"
                />
                <select
                  value={paymentMethodDeposit}
                  onChange={(e) => setPaymentMethodDeposit(e.target.value)}
                  className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-amber-300 font-bold p-1"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-bold">SALDO PENDIENTE 7:00 PM</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  S/. {finalBalance.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  * Liquidar en campo antes de 7:00 PM
                </span>
              </div>
            </div>

            {/* Deliverable Checkboxes */}
            <div className="flex items-center space-x-4 pt-1 text-xs flex-wrap gap-y-2">
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-xl bg-pink-50 border border-pink-200">
                <input
                  type="checkbox"
                  checked={includesPhotobook}
                  onChange={(e) => setIncludesPhotobook(e.target.checked)}
                  className="w-4 h-4 text-pink-600 rounded"
                />
                <span className="font-bold text-pink-900">Incluye Fotolibro Impreso (SLA: 30 Días)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-xl bg-sky-50 border border-sky-200">
                <input
                  type="checkbox"
                  checked={includesDrone}
                  onChange={(e) => setIncludesDrone(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <span className="font-bold text-sky-900">Incluye Cobertura Dron 4K</span>
              </label>
            </div>

          </div>

          {/* Footer with Submit Button */}
          <div className="pt-2 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <FileCheck className="w-4 h-4" />
              Guardar y Generar Contrato Oficial TCT
            </button>
          </div>

        </form>

      </div>

      {/* Attachment Preview Modal (Image / PDF) */}
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
