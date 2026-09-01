import React, { useState, useMemo } from 'react';
import { ShotPlan, ShotCategory } from '../../types/videoclip';
import { Search, X, Check, Camera, Sparkles, Plus, Film } from 'lucide-react';

interface ShotPlanPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: ShotPlan) => void;
  selectedPlanCode?: string;
  allPlans: ShotPlan[];
  onAddNewPlan?: (newPlan: ShotPlan) => void;
}

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'TODOS', value: 'ALL' },
  { label: 'PANORÁMICO', value: 'PANORÁMICO' },
  { label: 'GENERAL', value: 'GENERAL' },
  { label: 'ENTERO', value: 'ENTERO' },
  { label: 'AMERICANO', value: 'AMERICANO' },
  { label: 'MEDIO', value: 'MEDIO' },
  { label: 'PRIMER PLANO', value: 'PRIMER PLANO' },
  { label: 'DETALLE', value: 'DETALLE' }
];

export const ShotPlanPickerModal: React.FC<ShotPlanPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  selectedPlanCode,
  allPlans,
  onAddNewPlan
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New Custom Plan Form State
  const [newCode, setNewCode] = useState('');
  const [newName] = useState('');
  const [newCategory, setNewCategory] = useState<ShotCategory>('GENERAL');
  const [newDescription, setNewDescription] = useState('');
  const [newCustomName, setNewCustomName] = useState('');

  // Filtered and categorized plans
  const filteredPlans = useMemo(() => {
    return allPlans.filter(plan => {
      const matchesSearch = 
        !searchTerm.trim() ||
        plan.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = 
        activeCategory === 'ALL' || plan.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allPlans, searchTerm, activeCategory]);

  // Group plans by category if "ALL" is selected
  const groupedByCategory: Record<string, ShotPlan[]> = useMemo(() => {
    const groups: Record<string, ShotPlan[]> = {};
    filteredPlans.forEach(plan => {
      if (!groups[plan.category]) {
        groups[plan.category] = [];
      }
      groups[plan.category].push(plan);
    });
    return groups;
  }, [filteredPlans]);

  if (!isOpen) return null;

  const handleCreateCustomPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newCustomName.trim()) {
      alert('Por favor ingrese el código (ej. PE-GUIT) y el nombre del plano.');
      return;
    }
    const created: ShotPlan = {
      id: `custom-plan-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      name: newCustomName.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Plano de grabación personalizado TCT',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'
    };
    if (onAddNewPlan) {
      onAddNewPlan(created);
    }
    onSelectPlan(created);
    setIsCreatingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-slate-950 text-slate-100 w-full max-w-6xl max-h-[92vh] rounded-3xl border-2 border-amber-500/40 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar (Matching Image 2) */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 flex-wrap">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Galería de Planos de Grabación</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-400/40">
                  {allPlans.length} PLANOS DISPONIBLES
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Seleccione el encuadre cinematográfico objetivo para registrar la toma en vivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-1 max-w-md ml-auto">
            {/* Search input (Matching Image 2: "Buscar código o nombre") */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar código o nombre (ej: PGP, PE-BV, General)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-black rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Plano</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Cerrar galería"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Pills Filter Bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeCategory === cat.value
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Create Custom Plan Drawer */}
        {isCreatingNew && (
          <form onSubmit={handleCreateCustomPlan} className="p-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-amber-500/30 animate-fade-in shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Registrar Nuevo Plano Cinematográfico Personalizado
              </span>
              <button 
                type="button" 
                onClick={() => setIsCreatingNew(false)} 
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Código (ej. PE-MG):</label>
                <input
                  type="text"
                  required
                  placeholder="PE-MG"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nombre Descriptivo:</label>
                <input
                  type="text"
                  required
                  placeholder="Entero Músico Guitarra"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Categoría:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ShotCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="PANORÁMICO">PANORÁMICO</option>
                  <option value="GENERAL">GENERAL</option>
                  <option value="ENTERO">ENTERO</option>
                  <option value="AMERICANO">AMERICANO</option>
                  <option value="MEDIO">MEDIO</option>
                  <option value="PRIMER PLANO">PRIMER PLANO</option>
                  <option value="DETALLE">DETALLE</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  + Agregar y Usar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Main Gallery Grid (Matching Image 2) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Camera className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">
                No se encontraron planos que coincidan con "{searchTerm}".
              </p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setActiveCategory('ALL'); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl"
              >
                Limpiar filtros de búsqueda
              </button>
            </div>
          ) : activeCategory !== 'ALL' ? (
            /* Single Category Grid */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-amber-400">
                  {activeCategory}
                </span>
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-[11px] text-slate-500 font-mono">
                  {filteredPlans.length} {filteredPlans.length === 1 ? 'plano' : 'planos'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPlans.map(plan => (
                  <PlanCard
                    key={plan.id || plan.code}
                    plan={plan}
                    isSelected={selectedPlanCode === plan.code}
                    onSelect={() => {
                      onSelectPlan(plan);
                      onClose();
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Categorized Sections View (Matching Image 2 Section Headers: PANORÁMICO, GENERAL, ENTERO, etc.) */
            Object.entries(groupedByCategory).map(([category, plans]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase text-amber-400 font-mono">
                    {category}
                  </span>
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-[11px] text-slate-500 font-mono">
                    {plans.length} {plans.length === 1 ? 'plano' : 'planos'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {plans.map(plan => (
                    <PlanCard
                      key={plan.id || plan.code}
                      plan={plan}
                      isSelected={selectedPlanCode === plan.code}
                      onSelect={() => {
                        onSelectPlan(plan);
                        onClose();
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Haga clic en cualquier tarjeta para fijar el plano en el registro de toma.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Cerrar Galería
          </button>
        </div>
      </div>
    </div>
  );
};

// Plan Card Component (Matching Image 2 with Gold Headline & Dark Cinematic Reference)
interface PlanCardProps {
  plan: ShotPlan;
  isSelected: boolean;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isSelected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative bg-slate-900/90 rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer flex flex-col hover:scale-[1.02] hover:shadow-2xl ${
        isSelected
          ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/50'
          : 'border-slate-800/80 hover:border-amber-500/60'
      }`}
    >
      {/* Cinematic Preview Banner */}
      <div className="relative h-32 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {plan.imageUrl ? (
          <img
            src={plan.imageUrl}
            alt={plan.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950/40" />
        )}

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Category Chip (Top Left - Matching Image 2) */}
        <div className="absolute top-2 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold tracking-wider text-slate-300 border border-white/10 uppercase">
          {plan.category}
        </div>

        {/* Selection Indicator (Top Right) */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg font-black">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}

        {/* Center Prominent Glowing Golden Code (Matching Image 2: "PGP", "PG-AM", "PE-A", "PE-BV", etc.) */}
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <span className="text-xl sm:text-2xl font-black tracking-wider text-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)] group-hover:scale-110 transition-transform font-mono">
            {plan.code}
          </span>
        </div>

        {/* Sub-label inside banner (Matching Image 2 bottom-left inside image) */}
        <div className="absolute bottom-1.5 left-2.5 right-2.5 truncate">
          <span className="text-[10px] text-slate-300 font-medium drop-shadow-md">
            {plan.name}
          </span>
        </div>
      </div>

      {/* Card Body & Description */}
      <div className="p-3 bg-slate-950/95 flex-1 flex flex-col justify-between border-t border-slate-800/80">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-black text-amber-400 font-mono">
              {plan.code}
            </span>
            {plan.recommendedLenses && plan.recommendedLenses.length > 0 && (
              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[120px]">
                🔍 {plan.recommendedLenses[0]}
              </span>
            )}
          </div>
          <h4 className="text-xs font-bold text-white mt-0.5 leading-snug line-clamp-1">
            {plan.name}
          </h4>
          {plan.description && (
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {plan.description}
            </p>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-400/80 group-hover:text-amber-300 transition-colors">
            Seleccionar Plano →
          </span>
          <span className="text-[9px] font-mono text-slate-500">TCT</span>
        </div>
      </div>
    </div>
  );
};
