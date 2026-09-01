import React, { useState, useEffect } from 'react';
import { VideoclipShot, ShotPlan, VideoclipGoal, VideoclipCatalog } from '../../types/videoclip';
import { AuthUser } from '../../types';
import { formatShotNumber, getNextShotNumber } from '../../utils/videoclipStorage';
import { ShotPlanPickerModal } from './ShotPlanPickerModal';
import { 
  Save, 
  Plus, 
  Image as ImageIcon, 
  Target, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Music, 
  MapPin, 
  Shirt, 
  Camera, 
  Aperture, 
  ChevronRight,
  Trash2,
  Check,
  Film
} from 'lucide-react';

interface VideoclipNewShotViewProps {
  currentUser: AuthUser | null;
  catalog: VideoclipCatalog;
  shots: VideoclipShot[];
  goals: VideoclipGoal[];
  onSaveShot: (shot: VideoclipShot) => void;
  onSaveGoal: (goal: VideoclipGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateCatalog: (newCatalog: VideoclipCatalog) => void;
  onNavigateToLog?: () => void;
}

export const VideoclipNewShotView: React.FC<VideoclipNewShotViewProps> = ({
  currentUser,
  catalog,
  shots,
  goals,
  onSaveShot,
  onSaveGoal,
  onDeleteGoal,
  onUpdateCatalog,
  onNavigateToLog
}) => {
  // Real-time live date and time clock
  const [currentDateTime, setCurrentDateTime] = useState<{
    dateStr: string;
    timeStr: string;
  }>({
    dateStr: '',
    timeStr: ''
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
      
      const dayName = days[now.getDay()];
      const dayNum = now.getDate();
      const monthName = months[now.getMonth()];
      const yearShort = String(now.getFullYear()).slice(-2);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      setCurrentDateTime({
        dateStr: `${dayName}, ${dayNum} ${monthName} ${yearShort}`,
        timeStr: `${hours}:${minutes}:${seconds}`
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Form State
  const nextNumber = getNextShotNumber(shots);
  const [shotNumber, setShotNumber] = useState<number>(nextNumber);
  const [artist, setArtist] = useState<string>(catalog.artists[0] || '');
  const [theme, setTheme] = useState<string>(catalog.themes[0] || '');
  const [location, setLocation] = useState<string>(catalog.locations[0] || '');
  const [wardrobe, setWardrobe] = useState<string>(catalog.wardrobes[0] || '');
  const [cameraOperator, setCameraOperator] = useState<string>(catalog.cameraOperators[0] || '');
  const [lens, setLens] = useState<string>(catalog.lenses[1] || '10mm f/2.8'); // Default 10mm f/2.8
  const [selectedPlan, setSelectedPlan] = useState<ShotPlan | null>(catalog.shotPlans[0] || null);
  const [notes, setNotes] = useState<string>('');
  
  // Modal states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);

  // Quick inline add modals
  const [quickAddType, setQuickAddType] = useState<'artist' | 'theme' | 'location' | 'wardrobe' | 'cameraOperator' | 'lens' | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');

  // Keep shot number synchronized with shots count
  useEffect(() => {
    setShotNumber(getNextShotNumber(shots));
  }, [shots]);

  // Handle Shot Submission
  const handleSubmitShot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.trim()) {
      alert('Por favor seleccione o agregue un Artista.');
      return;
    }
    if (!theme.trim()) {
      alert('Por favor seleccione o agregue un Tema / Canción.');
      return;
    }
    if (!selectedPlan) {
      alert('Por favor elija un Plano de Grabación de la galería visual.');
      setIsPlanModalOpen(true);
      return;
    }

    const now = new Date();
    const nowDisplay = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newShot: VideoclipShot = {
      id: `shot-${Date.now()}`,
      shotNumber: shotNumber,
      timestamp: now.toISOString(),
      displayDate: nowDisplay,
      artist: artist.trim(),
      theme: theme.trim(),
      location: location.trim() || 'Locación Principal',
      wardrobe: wardrobe.trim() || 'Vestuario 1',
      cameraOperator: cameraOperator.trim() || 'Técnico TCT',
      lens: lens.trim() || '35mm f/2.0',
      shotPlanCode: selectedPlan.code,
      shotPlanName: selectedPlan.name,
      shotPlanCategory: selectedPlan.category,
      notes: notes.trim(),
      recordedBy: currentUser?.fullName || currentUser?.username || 'ELITA',
      status: 'ok'
    };

    onSaveShot(newShot);
    setNotes(''); // Clear notes for next take
    // Set next consecutive shot number
    setShotNumber(shotNumber + 1);
  };

  // Quick add helper
  const handleConfirmQuickAdd = () => {
    if (!quickAddValue.trim() || !quickAddType) return;
    const val = quickAddValue.trim();
    const updated = { ...catalog };

    if (quickAddType === 'artist') {
      if (!updated.artists.includes(val)) updated.artists.push(val);
      setArtist(val);
    } else if (quickAddType === 'theme') {
      if (!updated.themes.includes(val)) updated.themes.push(val);
      setTheme(val);
    } else if (quickAddType === 'location') {
      if (!updated.locations.includes(val)) updated.locations.push(val);
      setLocation(val);
    } else if (quickAddType === 'wardrobe') {
      if (!updated.wardrobes.includes(val)) updated.wardrobes.push(val);
      setWardrobe(val);
    } else if (quickAddType === 'cameraOperator') {
      if (!updated.cameraOperators.includes(val)) updated.cameraOperators.push(val);
      setCameraOperator(val);
    } else if (quickAddType === 'lens') {
      if (!updated.lenses.includes(val)) updated.lenses.push(val);
      setLens(val);
    }

    onUpdateCatalog(updated);
    setQuickAddType(null);
    setQuickAddValue('');
  };

  return (
    <div className="w-full space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      
      {/* ------------------------------------------------------------- */}
      {/* MAIN NEW SHOT CARD (Matching Screenshot Image 1)              */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Shot Number Badge & Real-Time Live Clock */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 font-mono">
              NUEVA TOMA
            </span>
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                {formatShotNumber(shotNumber)}
              </span>
              <button
                type="button"
                onClick={() => {
                  const custom = prompt('Ingrese el número consecutivo de la toma:', String(shotNumber));
                  if (custom && !isNaN(Number(custom))) {
                    setShotNumber(Math.max(1, parseInt(custom, 10)));
                  }
                }}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 text-[10px] font-bold rounded-lg border border-slate-800 transition-colors cursor-pointer"
                title="Modificar número de toma manual"
              >
                Editar #
              </button>
            </div>
          </div>

          {/* Clock & Online Indicator (Matching Screenshot Image 1) */}
          <div className="text-right">
            <div className="text-xs sm:text-sm font-bold text-slate-400">
              {currentDateTime.dateStr || 'Lun, 31 Ago 26'}
            </div>
            <div className="text-2xl sm:text-4xl font-black text-amber-400 font-mono tracking-wider drop-shadow-md">
              {currentDateTime.timeStr || '19:12:48'}
            </div>
          </div>
        </div>

        {/* Form Fields Grid (Matching Screenshot Image 1) */}
        <form onSubmit={handleSubmitShot} className="space-y-5">
          
          {/* Row 1: ARTISTA & TEMA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Field: ARTISTA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black tracking-wider uppercase text-slate-300 flex items-center gap-1.5 font-mono">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>ARTISTA</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setQuickAddType('artist'); setQuickAddValue(''); }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Agregar nuevo artista"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="relative">
                <select
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {catalog.artists.map(a => (
                    <option key={a} value={a} className="bg-slate-950 text-white py-1">
                      {a}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  ▼
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Agrega opciones desde Admin → Artista
              </p>
            </div>

            {/* Field: TEMA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black tracking-wider uppercase text-slate-300 flex items-center gap-1.5 font-mono">
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  <span>TEMA / CANCIÓN</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setQuickAddType('theme'); setQuickAddValue(''); }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Agregar nuevo tema"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="relative">
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {catalog.themes.map(t => (
                    <option key={t} value={t} className="bg-slate-950 text-white py-1">
                      {t}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  ▼
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Agrega opciones desde Admin → Tema
              </p>
            </div>
          </div>

          {/* Row 2: LOCACIÓN & VESTUARIO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Field: LOCACIÓN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black tracking-wider uppercase text-slate-300 flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>LOCACIÓN</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setQuickAddType('location'); setQuickAddValue(''); }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Agregar nueva locación"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {catalog.locations.map(loc => (
                    <option key={loc} value={loc} className="bg-slate-950 text-white py-1">
                      {loc}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  ▼
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Agrega opciones desde Admin → Locación
              </p>
            </div>

            {/* Field: VESTUARIO */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black tracking-wider uppercase text-slate-300 flex items-center gap-1.5 font-mono">
                  <Shirt className="w-3.5 h-3.5 text-amber-400" />
                  <span>VESTUARIO</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setQuickAddType('wardrobe'); setQuickAddValue(''); }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Agregar nuevo vestuario"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="relative">
                <select
                  value={wardrobe}
                  onChange={(e) => setWardrobe(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {catalog.wardrobes.map(w => (
                    <option key={w} value={w} className="bg-slate-950 text-white py-1">
                      {w}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  ▼
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Agrega opciones desde Admin → Vestuario
              </p>
            </div>
          </div>

          {/* Row 3: CAMARÓGRAFO & LENTE FINAL (Matching Image 3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Field: CAMARÓGRAFO */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black tracking-wider uppercase text-slate-300 flex items-center gap-1.5 font-mono">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>CAMARÓGRAFO</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setQuickAddType('cameraOperator'); setQuickAddValue(''); }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Agregar nuevo camarógrafo"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="relative">
                <select
                  value={cameraOperator}
                  onChange={(e) => setCameraOperator(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {catalog.cameraOperators.map(cam => (
                    <option key={cam} value={cam} className="bg-slate-950 text-white py-1">
                      {cam}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  ▼
                </div>
              </div>
            </div>

            {/* Field: LENTE FINAL (Matching Screenshot Image 3 dropdown) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black tracking-wider uppercase text-slate-300 flex items-center gap-1.5 font-mono">
                  <Aperture className="w-3.5 h-3.5 text-amber-400" />
                  <span>LENTE FINAL</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setQuickAddType('lens'); setQuickAddValue(''); }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Agregar nuevo lente"
                >
                  <Plus className="w-3 h-3" />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="relative">
                <select
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-amber-300 font-bold focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {catalog.lenses.map(l => (
                    <option key={l} value={l} className="bg-slate-950 text-white py-1">
                      {l}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: PLANO DE GRABACIÓN (Interactive Visual Reference Box - Matching Image 1) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black tracking-wider uppercase text-slate-300 flex items-center gap-1.5 font-mono">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span>PLANO DE GRABACIÓN</span>
            </label>

            <div
              onClick={() => setIsPlanModalOpen(true)}
              className="w-full bg-slate-950/95 border-2 border-dashed border-slate-800 hover:border-amber-400/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-slate-900 group shadow-inner"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 group-hover:scale-105 group-hover:border-amber-400 transition-all shrink-0 overflow-hidden relative">
                  {selectedPlan?.imageUrl ? (
                    <img 
                      src={selectedPlan.imageUrl} 
                      alt={selectedPlan.name} 
                      className="w-full h-full object-cover opacity-70"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                  {selectedPlan && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="font-mono text-[10px] font-black text-amber-300">
                        {selectedPlan.code}
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  {selectedPlan ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-amber-400 font-mono tracking-wide">
                          [{selectedPlan.code}]
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {selectedPlan.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[9px] font-mono text-slate-300 border border-slate-700">
                          {selectedPlan.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {selectedPlan.description || 'Toca para cambiar plano en la galería visual'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        Toca para elegir un plano
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Galería visual de referencias cinematográficas
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="hidden sm:inline text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  Ver Galería
                </span>
                <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
              </div>
            </div>
          </div>

          {/* Row 5: NOTAS */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black tracking-wider uppercase text-slate-300 flex items-center gap-1.5 font-mono">
              <span>NOTAS</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indicaciones de iluminación, encuadre, dirección, vestuario especial, tomas repetidas..."
              className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-amber-400 rounded-2xl p-4 text-xs sm:text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Row 6: Submit Button (Matching Image 1: "💾 Guardar Toma") */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] border border-amber-300"
          >
            <Save className="w-5 h-5" />
            <span>Guardar Toma {formatShotNumber(shotNumber)}</span>
          </button>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: MIS METAS PERSONALES (Matching Screenshot Image 1)   */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-wider uppercase text-amber-400 font-mono">
                MIS METAS PERSONALES
              </h3>
              <p className="text-xs text-slate-400">
                Arma tus propias metas marcando los planos objetivos. El avance se calcula sobre tus tomas registradas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewGoalModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva meta</span>
          </button>
        </div>

        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-2 bg-slate-950/60">
            <p className="text-xs text-slate-400">
              Aún no creas metas. Pulsa <strong className="text-amber-400">Nueva meta</strong> para empezar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => {
              // Calculate real-time progress based on recorded shots
              const relevantShots = shots.filter(s => 
                (!goal.artist || s.artist.toLowerCase() === goal.artist.toLowerCase()) &&
                (!goal.theme || s.theme.toLowerCase() === goal.theme.toLowerCase())
              );
              const completedPlans = goal.targetPlanCodes.filter(code => 
                relevantShots.some(s => s.shotPlanCode === code)
              );
              const progressPct = goal.targetPlanCodes.length > 0 
                ? Math.round((completedPlans.length / goal.targetPlanCodes.length) * 100)
                : 0;
              const isCompleted = progressPct === 100;

              return (
                <div 
                  key={goal.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-500/10'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white">
                          {goal.title}
                        </h4>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/40 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            COMPLETA
                          </span>
                        )}
                      </div>
                      {(goal.artist || goal.theme) && (
                        <p className="text-[11px] text-amber-300/80 font-medium">
                          {goal.artist} {goal.theme && `• ${goal.theme}`}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Eliminar meta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {completedPlans.length} de {goal.targetPlanCodes.length} planos grabados
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {progressPct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCompleted ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Target Plans Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {goal.targetPlanCodes.map(code => {
                      const isRecorded = relevantShots.some(s => s.shotPlanCode === code);
                      return (
                        <span
                          key={code}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isRecorded
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {isRecorded ? '✓ ' : ''}{code}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: SHOT PLAN PICKER GALLERY (Matching Image 2)            */}
      {/* ------------------------------------------------------------- */}
      <ShotPlanPickerModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        selectedPlanCode={selectedPlan?.code}
        allPlans={catalog.shotPlans}
        onSelectPlan={(plan) => setSelectedPlan(plan)}
        onAddNewPlan={(newPlan) => {
          const updated = {
            ...catalog,
            shotPlans: [...catalog.shotPlans, newPlan]
          };
          onUpdateCatalog(updated);
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* MODAL: QUICK ADD PROMPT                                       */}
      {/* ------------------------------------------------------------- */}
      {quickAddType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border-2 border-amber-500/50 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Agregar Nuevo(a) {quickAddType.toUpperCase()}</span>
            </h4>
            <input
              type="text"
              autoFocus
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              placeholder={`Nombre de ${quickAddType}...`}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmQuickAdd(); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-bold"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickAddType(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickAdd}
                className="px-4 py-1.5 bg-amber-500 text-slate-950 text-xs font-black rounded-xl hover:bg-amber-400 cursor-pointer"
              >
                Guardar y Usar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: NUEVA META PERSONAL                                    */}
      {/* ------------------------------------------------------------- */}
      {isNewGoalModalOpen && (
        <NewGoalModal
          catalog={catalog}
          onClose={() => setIsNewGoalModalOpen(false)}
          onSaveGoal={(g) => {
            onSaveGoal(g);
            setIsNewGoalModalOpen(false);
          }}
        />
      )}

    </div>
  );
};

// Subcomponent: New Goal Modal
interface NewGoalModalProps {
  catalog: VideoclipCatalog;
  onClose: () => void;
  onSaveGoal: (goal: VideoclipGoal) => void;
}

const NewGoalModal: React.FC<NewGoalModalProps> = ({ catalog, onClose, onSaveGoal }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState(catalog.artists[0] || '');
  const [theme, setTheme] = useState(catalog.themes[0] || '');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([
    'PG-AMB', 'PE-A', 'PE-BV', 'PP-A'
  ]);

  const toggleCode = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter(c => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor ingrese un título para la meta.');
      return;
    }
    if (selectedCodes.length === 0) {
      alert('Por favor seleccione al menos 1 plano objetivo.');
      return;
    }

    const created: VideoclipGoal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim() || undefined,
      theme: theme.trim() || undefined,
      targetPlanCodes: selectedCodes,
      createdAt: new Date().toISOString()
    };

    onSaveGoal(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 text-white w-full max-w-lg rounded-3xl border-2 border-amber-500/40 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black">Crear Nueva Meta Personal</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Título de la Meta:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Cobertura Completa Mix 1"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Artista:</label>
              <select
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="">Todos los artistas</option>
                {catalog.artists.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tema:</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="">Todos los temas</option>
                {catalog.themes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Seleccionar Planos Objetivos ({selectedCodes.length} seleccionados):
            </label>
            <div className="max-h-48 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-800 grid grid-cols-2 gap-1.5">
              {catalog.shotPlans.map(plan => {
                const isChecked = selectedCodes.includes(plan.code);
                return (
                  <button
                    type="button"
                    key={plan.code}
                    onClick={() => toggleCode(plan.code)}
                    className={`p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between ${
                      isChecked
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-mono">{plan.code}</span>
                    <span className="text-[10px] truncate max-w-[100px]">{plan.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              Crear Meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
