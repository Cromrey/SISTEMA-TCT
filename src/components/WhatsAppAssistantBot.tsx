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
  PhoneCall
} from 'lucide-react';

const TCT_WHATSAPP_NUMBER = '990010020';
const TCT_WHATSAPP_DISPLAY = '+51 990 010 020';

interface ServiceOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultDetail: string;
  estimateHint: string;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: 'proforma',
    label: 'Quiero una proforma',
    icon: <FileText className="w-4 h-4 text-emerald-400" />,
    defaultDetail: 'Solicito cotización detallada y paquetes disponibles.',
    estimateHint: 'Proforma personalizada con desglose de equipos, cámaras 4K y plazos de entrega.'
  },
  {
    id: 'videoclip',
    label: 'Grabar un videoclip',
    icon: <Film className="w-4 h-4 text-purple-400" />,
    defaultDetail: 'Producción de videoclip musical con rodaje cinematográfico y edición.',
    estimateHint: 'Dirección de arte, iluminación cinematográfica, dron 4K y corrección de color.'
  },
  {
    id: 'sesion_fotos',
    label: 'Sesión de fotos',
    icon: <Camera className="w-4 h-4 text-blue-400" />,
    defaultDetail: 'Sesión fotográfica en exteriores / estudio con retoque digital.',
    estimateHint: 'Cámaras Sony Full Frame, iluminación profesional, galería digital y fotolibro opcional.'
  },
  {
    id: 'diseno_logo',
    label: 'Diseño de logo',
    icon: <Palette className="w-4 h-4 text-amber-400" />,
    defaultDetail: 'Identidad visual y diseño de logo profesional para marca o empresa.',
    estimateHint: 'Manual de marca, paleta cromática, tipografías y formatos vectoriales listos para imprimir.'
  },
  {
    id: 'creacion_flyer',
    label: 'Creación de flyer',
    icon: <ImageIcon className="w-4 h-4 text-cyan-400" />,
    defaultDetail: 'Diseño publicitario para redes sociales o impresión de evento.',
    estimateHint: 'Formatos optimizados para historias de Instagram, posts y cartelería de alta resolución.'
  },
  {
    id: 'evento_social',
    label: 'Filmación de evento social',
    icon: <PartyPopper className="w-4 h-4 text-rose-400" />,
    defaultDetail: 'Cobertura completa para Boda, XV Años o Aniversario.',
    estimateHint: 'Multicámara 4K, tomas aéreas con dron, audio directo de consola y USB corporativo en 15 días.'
  },
  {
    id: 'alquiler_drone',
    label: 'Alquiler de drone',
    icon: <Zap className="w-4 h-4 text-yellow-400" />,
    defaultDetail: 'Servicio de dron 4K con piloto certificado para tomas aéreas.',
    estimateHint: 'Piloto profesional certificado, grabación 4K UHD, baterías ilimitadas y permisos de vuelo.'
  },
  {
    id: 'spot_audio_video',
    label: 'Spot de audio o video',
    icon: <Mic className="w-4 h-4 text-indigo-400" />,
    defaultDetail: 'Producción de spot comercial publicitario para radio, TV o redes.',
    estimateHint: 'Locución profesional, guion creativo, efectos sonoros y post-producción dinámica.'
  },
  {
    id: 'otro_pedido',
    label: 'Otro pedido',
    icon: <Sparkles className="w-4 h-4 text-emerald-300" />,
    defaultDetail: 'Requiero un servicio audiovisual o tecnológico personalizado.',
    estimateHint: 'Asesoría directa y propuesta técnica adaptada a tu requerimiento específico.'
  }
];

export const WhatsAppAssistantBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('proforma');
  const [clientName, setClientName] = useState<string>('');
  const [detailText, setDetailText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'request' | 'faq'>('request');
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

  // Keep within window bounds on resize
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

  // Mouse drag handlers
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

  // Touch drag handlers for mobile devices
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

  // Build the formatted WhatsApp message
  const currentServiceObj = SERVICE_OPTIONS.find(s => s.id === selectedService) || SERVICE_OPTIONS[0];

  const buildWhatsAppMessage = () => {
    let message = `¡Hola Corporación TCT! 👋🎬\n\n`;
    message += `📌 *Solicitud de Servicio:* ${currentServiceObj.label}\n`;
    if (clientName.trim()) {
      message += `👤 *Cliente:* ${clientName.trim()}\n`;
    }
    const finalDetail = detailText.trim() || currentServiceObj.defaultDetail;
    message += `📝 *Detalles:* ${finalDetail}\n\n`;
    message += `📍 *Origen:* Bot Inteligente Web TCT`;
    return message;
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

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FLOATING DRAGGABLE 3D WHATSAPP BUTTON (Aura & Glow, Moves anywhere)   */}
      {/* ========================================================================= */}
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
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 rounded-full opacity-80 group-hover:opacity-100 transition duration-300 animate-spin-slow pointer-events-none" />
          
          {/* Main 3D WhatsApp Speech Bubble Button (Direct high-fidelity render) */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center transform group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
            {/* 3D Glossy WhatsApp Icon with transparent speech bubble tail */}
            <img
              src="/assets/whatsapp-3d.png"
              alt="WhatsApp 3D Corporación TCT"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(4,47,26,0.6)] select-none pointer-events-none"
            />

            {/* Online Indicator Badge */}
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-950 flex items-center justify-center shadow-md">
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE WHATSAPP BOT MODAL (Image 2 exact UI + Smart Enhancements) */}
      {/* ========================================================================= */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full sm:max-w-lg bg-slate-950 text-white rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Modal Header with 3D WhatsApp & TCT Branding */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-4 sm:p-5 border-b border-slate-800 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center p-1.5 overflow-hidden">
                        <img 
                          src="/assets/whatsapp-3d.png" 
                          alt="WhatsApp 3D" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-1.5 leading-tight">
                      <span>Bot Asistente TCT</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        WhatsApp 24/7
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>Atención directa al</span>
                      <strong className="text-emerald-400">{TCT_WHATSAPP_DISPLAY}</strong>
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs inside modal */}
              <div className="flex items-center space-x-2 mt-4 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('request')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'request'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Generar Solicitud / Cotización</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('faq')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'faq'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Preguntas Frecuentes TCT</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {activeTab === 'request' ? (
                <>
                  {/* Select Intent Options */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Selecciona tu tipo de pedido:
                    </label>

                    <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                      {SERVICE_OPTIONS.map((opt) => {
                        const isSelected = selectedService === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSelectedService(opt.id);
                              if (!detailText) {
                                setDetailText(opt.defaultDetail);
                              }
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-sm ring-1 ring-emerald-500/40'
                                : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                                {opt.icon}
                              </div>
                              <span className="font-bold text-xs truncate">{opt.label}</span>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Smart estimate hint banner */}
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-black text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Inclusiones estándar TCT:</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {currentServiceObj.estimateHint}
                    </p>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-400">
                        Tu nombre (opcional)
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ej: Daniel Sánchez"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-400">
                        Detalle: fecha, lugar, presupuesto...
                      </label>
                      <textarea
                        rows={2}
                        value={detailText}
                        onChange={(e) => setDetailText(e.target.value)}
                        placeholder="Ej: Boda en Huancayo el 15 de Noviembre, requerimos 2 cámaras y dron..."
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                      />
                    </div>
                  </div>

                  {/* Live Message Preview Box */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                      <span>Vista previa del mensaje:</span>
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                      {buildWhatsAppMessage()}
                    </div>
                  </div>
                </>
              ) : (
                /* FAQ Tab */
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      ¿En qué ciudades brinda cobertura Corporación TCT?
                    </h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Atendemos a nivel nacional en todo el Perú (Huancayo, Lima, Tarma, La Merced, Huánuco, Ayacucho, Arequipa y más provincias).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5 text-emerald-400">
                      <Film className="w-4 h-4" />
                      ¿Cuáles son los plazos oficiales de entrega?
                    </h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Por regla institucional: <strong>15 días calendario</strong> para video editado en USB corporativo y <strong>30 días</strong> para fotolibro impreso de lujo.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5 text-emerald-400">
                      <Zap className="w-4 h-4" />
                      ¿Cómo es la modalidad de pago y liquidación?
                    </h4>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Adelanto inicial al firmar contrato, y el saldo se cancela el mismo día del evento antes de las <strong>7:00 PM</strong> en campo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transform active:scale-[0.99] transition-all cursor-pointer"
              >
                <img 
                  src="/assets/whatsapp-3d.png" 
                  alt="WA" 
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 object-contain"
                />
                <span>Enviar por WhatsApp a +51 990 010 020</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
