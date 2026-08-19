import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  FileText, 
  Film, 
  Camera, 
  Palette, 
  Image as ImageIcon, 
  PartyPopper, 
  Sparkles, 
  Mic, 
  Check, 
  Copy, 
  ExternalLink,
  Bot,
  Zap,
  Info,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  Calendar,
  Clock,
  Radio,
  BookOpen,
  RotateCcw
} from 'lucide-react';

const TCT_WHATSAPP_NUMBER = '990010020';
const TCT_WHATSAPP_DISPLAY = '+51 990 010 020';

interface ServicePreset {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  initialBotQuestion: string;
  recommendedEquipments: string[];
}

const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: 'videoclip',
    label: 'Grabar Videoclip',
    category: 'Producción Musical',
    icon: <Film className="w-4 h-4 text-purple-400" />,
    initialBotQuestion: '🎬 ¡Excelente elección! Para el Videoclip: ¿Qué género musical es y para qué fecha aproximada tienes planeado el rodaje?',
    recommendedEquipments: ['2 Cámaras Sony FX3 4K', 'Dron 4K con piloto', 'Luces RGB & Fresnels', 'Estabilizador Ronin RS3', 'Dirección de Arte']
  },
  {
    id: 'evento_social',
    label: 'Grabar Evento Social',
    category: 'Bodas, XV Años & Aniversarios',
    icon: <PartyPopper className="w-4 h-4 text-rose-400" />,
    initialBotQuestion: '🎉 ¡Felicidades! ¿Qué tipo de evento social es (Boda, XV Años, etc.), en qué ciudad/local y qué fecha se celebrará?',
    recommendedEquipments: ['Multicámara 4K', 'Dron para exteriores', 'Audio directo de consola', 'USB Corporativo en 15 días', 'Fotolibro 30 días']
  },
  {
    id: 'concierto_virtual',
    label: 'Realizar Concierto Virtual',
    category: 'Streaming & Live Broadcast',
    icon: <Radio className="w-4 h-4 text-amber-400" />,
    initialBotQuestion: '🎙️ ¡Genial! Para el Concierto Virtual o Transmisión En Vivo: ¿Qué artista/grupo se presentará y para qué fecha y plataforma (Facebook, YouTube, etc.)?',
    recommendedEquipments: ['Switching Blackmagic ATEM 4K', '3 Cámaras Broadcast', 'Audio Multitrack', 'Internet Satelital / Bonded', 'Monitores de Retorno']
  },
  {
    id: 'sesion_fotos',
    label: 'Sesión de Fotos Profesional',
    category: 'Estudio & Exteriores',
    icon: <Camera className="w-4 h-4 text-blue-400" />,
    initialBotQuestion: '📸 ¡Perfecto! ¿La sesión de fotos será en exteriores o estudio, y en qué fecha aproximada deseas realizarla?',
    recommendedEquipments: ['Cámaras Sony Alpha 61MP', 'Flashes Godox de alta velocidad', 'Fondos profesionales', 'Retoque digital HD', 'Galería web privada']
  },
  {
    id: 'crear_fotobook',
    label: 'Crear Fotolibro / Photobook',
    category: 'Editorial de Lujo',
    icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
    initialBotQuestion: '📖 ¡Excelente! ¿El fotolibro es de un evento reciente (Boda, XV) o fotos familiares, y qué tamaño prefieres (30x30, 20x30 cm)?',
    recommendedEquipments: ['Papel fotográfico Fuji Silk', 'Tapa dura con acabado acrílico/cuero', 'Diagramación personalizada', 'Entrega en 30 días']
  },
  {
    id: 'alquiler_dron',
    label: 'Alquiler de Dron 4K',
    category: 'Tomas Aéreas',
    icon: <Zap className="w-4 h-4 text-yellow-400" />,
    initialBotQuestion: '🚁 ¡Listo! ¿En qué locación necesitas las tomas aéreas con dron y para qué fecha/evento?',
    recommendedEquipments: ['Dron DJI Mavic 3 Pro 4K', 'Piloto certificado DGAC', 'Baterías para vuelo ilimitado', 'Filtros ND profesionales']
  },
  {
    id: 'spot_publicitario',
    label: 'Spot Publicitario / Comercial',
    category: 'Marketing Audiovisual',
    icon: <Mic className="w-4 h-4 text-cyan-400" />,
    initialBotQuestion: '📺 ¡Impacto comercial! ¿De qué rubro es tu empresa/marca y qué objetivo tiene el spot?',
    recommendedEquipments: ['Guion y Storyboard', 'Locución profesional', 'Grabación 4K UHD', 'Animación de logo 2D/3D', 'Edición dinámica para RRSS']
  }
];

// Official High Quality WhatsApp SVG Icon
export const OfficialWhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path fill="#25D366" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2Z" />
    <path fill="#FFFFFF" d="M17.52 14.33C17.22 14.18 15.75 13.45 15.48 13.35C15.21 13.25 15.01 13.2 14.81 13.5C14.61 13.8 14.04 14.48 13.87 14.68C13.7 14.88 13.53 14.9 13.23 14.75C12.93 14.6 11.97 14.28 10.83 13.26C9.94 12.47 9.34 11.49 9.17 11.19C9 10.89 9.15 10.73 9.3 10.58C9.43 10.45 9.59 10.24 9.74 10.07C9.89 9.9 9.94 9.78 10.04 9.58C10.14 9.38 10.09 9.2 10.01 9.05C9.93 8.9 9.33 7.42 9.08 6.82C8.84 6.24 8.59 6.32 8.41 6.31C8.24 6.3 8.04 6.3 7.84 6.3C7.64 6.3 7.32 6.38 7.05 6.67C6.78 6.96 6.02 7.67 6.02 9.13C6.02 10.59 7.08 12 7.23 12.2C7.38 12.4 9.32 15.39 12.29 16.67C13 16.98 13.56 17.17 13.99 17.31C14.71 17.54 15.36 17.51 15.88 17.43C16.46 17.34 17.66 16.7 17.91 16C18.16 15.3 18.16 14.7 18.08 14.58C18 14.45 17.82 14.48 17.52 14.33Z" />
  </svg>
);

export const WhatsAppAssistantBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Choose Service, 2: Event Type & Date, 3: Equipments & Hours, 4: Summary & Transfer
  const [selectedService, setSelectedService] = useState<ServicePreset>(SERVICE_PRESETS[0]);
  
  // Client conversational inputs
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventCity, setEventCity] = useState('Huancayo');
  const [recordingHours, setRecordingHours] = useState('6 horas');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [extraDetails, setExtraDetails] = useState('');
  const [budgetEstimate, setBudgetEstimate] = useState('');
  const [copied, setCopied] = useState(false);

  // Position state for floating draggable button
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    return {
      x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 84) : 300,
      y: typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 150) : 550
    };
  });

  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const elementStartPosRef = useRef({ x: 0, y: 0 });
  const hasMovedSignificantlyRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(Math.max(16, prev.x), window.innerWidth - 76),
        y: Math.min(Math.max(16, prev.y), window.innerHeight - 76)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasMovedSignificantlyRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    elementStartPosRef.current = { ...position };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - dragStartPosRef.current.x;
      const deltaY = moveEvent.clientY - dragStartPosRef.current.y;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMovedSignificantlyRef.current = true;
      }

      const newX = Math.min(Math.max(12, elementStartPosRef.current.x + deltaX), window.innerWidth - 72);
      const newY = Math.min(Math.max(12, elementStartPosRef.current.y + deltaY), window.innerHeight - 72);
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    hasMovedSignificantlyRef.current = false;
    dragStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    elementStartPosRef.current = { ...position };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingRef.current || moveEvent.touches.length !== 1) return;
      const currentTouch = moveEvent.touches[0];
      const deltaX = currentTouch.clientX - dragStartPosRef.current.x;
      const deltaY = currentTouch.clientY - dragStartPosRef.current.y;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasMovedSignificantlyRef.current = true;
      }

      const newX = Math.min(Math.max(12, elementStartPosRef.current.x + deltaX), window.innerWidth - 72);
      const newY = Math.min(Math.max(12, elementStartPosRef.current.y + deltaY), window.innerHeight - 72);
      setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (hasMovedSignificantlyRef.current) {
      e.preventDefault();
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleSelectServicePreset = (preset: ServicePreset) => {
    setSelectedService(preset);
    setSelectedEquipments(preset.recommendedEquipments.slice(0, 3));
    setStep(2);
  };

  const toggleEquipment = (eq: string) => {
    if (selectedEquipments.includes(eq)) {
      setSelectedEquipments(selectedEquipments.filter(e => e !== eq));
    } else {
      setSelectedEquipments([...selectedEquipments, eq]);
    }
  };

  const buildWhatsAppMessage = () => {
    let msg = `*¡HOLA CORPORACIÓN TCT!* 👋🎬\n`;
    msg += `Solicito cotización y atención de asesor comercial:\n\n`;
    msg += `📌 *Servicio:* ${selectedService.label}\n`;
    if (clientName.trim()) msg += `👤 *Cliente:* ${clientName.trim()}\n`;
    if (eventDate) msg += `📅 *Fecha aproximada:* ${eventDate}\n`;
    if (eventCity) msg += `📍 *Ciudad / Locación:* ${eventCity}\n`;
    if (recordingHours) msg += `⏱ *Horas estimadas:* ${recordingHours}\n`;
    if (selectedEquipments.length > 0) {
      msg += `🎥 *Equipos de interés:* ${selectedEquipments.join(', ')}\n`;
    }
    if (budgetEstimate) msg += `💰 *Presupuesto referencial:* S/. ${budgetEstimate}\n`;
    if (extraDetails.trim()) msg += `📝 *Detalles adicionales:* ${extraDetails.trim()}\n`;
    msg += `\n✨ *Origen:* Bot Inteligente de Cotizaciones TCT`;
    return msg;
  };

  const handleSendToWhatsApp = () => {
    const rawMessage = buildWhatsAppMessage();
    const encoded = encodeURIComponent(rawMessage);
    const waUrl = `https://wa.me/51${TCT_WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(buildWhatsAppMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetBot = () => {
    setStep(1);
    setSelectedService(SERVICE_PRESETS[0]);
    setClientName('');
    setEventDate('');
    setExtraDetails('');
    setBudgetEstimate('');
  };

  return (
    <>
      {/* 1. FLOATING 3D WHATSAPP BUTTON WITH TRUE WHATSAPP ICON */}
      <div
        id="tct-floating-whatsapp-btn"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleButtonClick}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          touchAction: 'none'
        }}
        className="cursor-grab active:cursor-grabbing select-none group"
        title="Bot de WhatsApp Corporación TCT (Arrastra para mover)"
      >
        <div className="relative flex items-center justify-center">
          {/* Animated Pulsating Rings */}
          <div className="absolute -inset-2 bg-emerald-500/35 rounded-full blur-md animate-pulse pointer-events-none" />
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 rounded-full opacity-80 group-hover:opacity-100 transition duration-300 pointer-events-none" />
          
          {/* Main 3D WhatsApp Button */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-emerald-400 p-2.5 flex items-center justify-center shadow-xl shadow-emerald-950/60 transform group-hover:scale-110 group-active:scale-95 transition-transform duration-200 border-2 border-white/30">
            <OfficialWhatsAppIcon className="w-9 h-9 text-white filter drop-shadow-md" />
            
            {/* Live Online Ping Badge */}
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-950 flex items-center justify-center shadow-md">
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
            </span>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE CONVERSATIONAL WHATSAPP BOT MODAL */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full sm:max-w-lg bg-slate-950 text-white rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-4 sm:p-5 border-b border-slate-800 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <OfficialWhatsAppIcon className="w-7 h-7 text-white" />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-1.5 leading-tight">
                      <span>Bot Asistente TCT</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        En Línea 24/7
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>Asesoría directa al</span>
                      <strong className="text-emerald-400">{TCT_WHATSAPP_DISPLAY}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleResetBot}
                    title="Reiniciar conversación"
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Steps Indicator */}
              <div className="flex items-center space-x-1 mt-3">
                <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${step >= 4 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
              </div>
            </div>

            {/* Conversational Bot Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              
              {/* Bot Greeting Bubble */}
              <div className="flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-800 space-y-1 max-w-[85%]">
                  <p className="font-bold text-emerald-400 text-[11px]">Asistente Virtual TCT</p>
                  <p className="text-slate-200 leading-relaxed text-xs">
                    ¡Hola! Soy tu asistente de Corporación TCT. Te guiaré paso a paso para armar tu solicitud y conectarte de inmediato con un asesor comercial.
                  </p>
                </div>
              </div>

              {/* STEP 1: CHOOSE SERVICE PRESET */}
              {step === 1 && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                    <p className="text-amber-300 font-bold">¿Qué servicio audiovisual deseas cotizar hoy?</p>
                    <p className="text-slate-400 text-[11px]">Elige una de las siguientes opciones:</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {SERVICE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectServicePreset(preset)}
                        className="w-full text-left p-3 rounded-2xl bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 text-emerald-400">
                            {preset.icon}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white group-hover:text-emerald-300 block">
                              {preset.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {preset.category}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: EVENT TYPE & DATE & LOCATION */}
              {step === 2 && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-800 text-slate-200 text-xs leading-relaxed max-w-[85%]">
                      {selectedService.initialBotQuestion}
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        Tu nombre completo:
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ej: Carlos Mendoza"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Fecha estimada del evento/rodaje:
                        </label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Ciudad / Locación:
                        </label>
                        <input
                          type="text"
                          value={eventCity}
                          onChange={(e) => setEventCity(e.target.value)}
                          placeholder="Ej: Huancayo, El Tambo"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        ← Volver a servicios
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <span>Siguiente: Equipos & Horas</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: EQUIPMENTS & RECORDING HOURS & BUDGET */}
              {step === 3 && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-800 text-slate-200 text-xs leading-relaxed max-w-[85%]">
                      🎥 ¡Excelente! Cuéntame: ¿Qué equipos deseas incluir y cuántas horas de grabación estimas aproximadamente?
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-300">
                        Equipos y Coberturas recomendadas (Marca las que te interesan):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedService.recommendedEquipments.map((eq) => {
                          const isChecked = selectedEquipments.includes(eq);
                          return (
                            <button
                              key={eq}
                              type="button"
                              onClick={() => toggleEquipment(eq)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <Check className={`w-3 h-3 ${isChecked ? 'opacity-100 text-emerald-400' : 'opacity-0'}`} />
                              <span>{eq}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Horas estimadas de rodaje:
                        </label>
                        <select
                          value={recordingHours}
                          onChange={(e) => setRecordingHours(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                        >
                          <option value="4 horas (Medio día)">4 horas (Medio día)</option>
                          <option value="6 horas">6 horas</option>
                          <option value="8 horas (Jornada completa)">8 horas (Jornada completa)</option>
                          <option value="12 horas (Día completo + fiesta)">12 horas (Día completo + fiesta)</option>
                          <option value="Varios días de rodaje">Varios días de rodaje</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Presupuesto estimado en S/. (opcional):
                        </label>
                        <input
                          type="number"
                          value={budgetEstimate}
                          onChange={(e) => setBudgetEstimate(e.target.value)}
                          placeholder="Ej: 1500"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        Detalles adicionales o requerimientos específicos:
                      </label>
                      <textarea
                        rows={2}
                        value={extraDetails}
                        onChange={(e) => setExtraDetails(e.target.value)}
                        placeholder="Ej: Requerimos entrega en USB y tomas aéreas de la iglesia..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        ← Volver a fecha
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <span>Ver Resumen y Conectar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: SUMMARY & REDIRECT TO COMMERCIAL ADVISOR */}
              {step === 4 && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-800 text-slate-200 text-xs leading-relaxed max-w-[85%] space-y-1">
                      <p className="font-bold text-emerald-400">🎯 ¡Solicitud lista!</p>
                      <p>
                        He recopilado todos tus datos. A continuación te pasaré directamente con un <strong>Asesor Comercial Oficial de Corporación TCT</strong> por WhatsApp para enviarte la proforma y disponibilidad de fechas.
                      </p>
                    </div>
                  </div>

                  {/* Summary Message Box */}
                  <div className="bg-slate-900/95 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                      <span>Mensaje estructurado listo para enviar:</span>
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                      {buildWhatsAppMessage()}
                    </div>
                  </div>

                  <div className="flex items-center justify-start pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      ← Modificar datos
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transform active:scale-[0.99] transition-all cursor-pointer"
              >
                <OfficialWhatsAppIcon className="w-5 h-5 text-slate-950" />
                <span>Hablar con Asesor Comercial en WhatsApp ({TCT_WHATSAPP_DISPLAY})</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
