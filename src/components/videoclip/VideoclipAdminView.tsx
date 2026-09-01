import React, { useState } from 'react';
import { VideoclipCatalog, ShotPlan, ShotCategory, VideoclipShot } from '../../types/videoclip';
import { 
  User, 
  Music, 
  Aperture, 
  Camera, 
  MapPin, 
  Shirt, 
  Film, 
  Sliders, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles, 
  Download, 
  Upload, 
  RotateCcw,
  Layers,
  ChevronRight
} from 'lucide-react';
import { INITIAL_CATALOG, INITIAL_SEEDED_SHOTS } from '../../utils/videoclipStorage';

interface VideoclipAdminViewProps {
  catalog: VideoclipCatalog;
  shots: VideoclipShot[];
  onUpdateCatalog: (newCatalog: VideoclipCatalog) => void;
  onUpdateShots: (newShots: VideoclipShot[]) => void;
}

type AdminSubTab = 'TOMAS' | 'FILTROS' | 'DATOS';

export const VideoclipAdminView: React.FC<VideoclipAdminViewProps> = ({
  catalog,
  shots,
  onUpdateCatalog,
  onUpdateShots
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('TOMAS');

  // Currently open catalog editor drawer
  const [activeEditingCatalog, setActiveEditingCatalog] = useState<
    'artists' | 'themes' | 'lenses' | 'cameraOperators' | 'locations' | 'wardrobes' | 'shotPlans' | null
  >(null);

  // New item input state
  const [newItemValue, setNewItemValue] = useState('');

  // Shot Plan Editing/Creation State
  const [editingPlan, setEditingPlan] = useState<ShotPlan | null>(null);
  const [planCode, setPlanCode] = useState('');
  const [planName, setPlanName] = useState('');
  const [planCategory, setPlanCategory] = useState<ShotCategory>('GENERAL');
  const [planDescription, setPlanDescription] = useState('');

  // Catalog CRUD Operations
  const handleAddItem = (type: 'artists' | 'themes' | 'lenses' | 'cameraOperators' | 'locations' | 'wardrobes') => {
    if (!newItemValue.trim()) return;
    const val = newItemValue.trim();
    if (catalog[type].includes(val)) {
      alert(`"${val}" ya existe en este catálogo.`);
      return;
    }
    const updated = {
      ...catalog,
      [type]: [...catalog[type], val]
    };
    onUpdateCatalog(updated);
    setNewItemValue('');
  };

  const handleDeleteItem = (type: 'artists' | 'themes' | 'lenses' | 'cameraOperators' | 'locations' | 'wardrobes', item: string) => {
    if (catalog[type].length <= 1) {
      alert('Debe mantener al menos una opción en este catálogo.');
      return;
    }
    if (confirm(`¿Eliminar "${item}" del catálogo?`)) {
      const updated = {
        ...catalog,
        [type]: catalog[type].filter(i => i !== item)
      };
      onUpdateCatalog(updated);
    }
  };

  // Shot Plan CRUD Operations
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planCode.trim() || !planName.trim()) {
      alert('Por favor ingrese código y nombre para el plano.');
      return;
    }

    let updatedPlans = [...catalog.shotPlans];
    if (editingPlan) {
      // Update existing
      updatedPlans = updatedPlans.map(p => 
        p.id === editingPlan.id
          ? {
              ...p,
              code: planCode.trim().toUpperCase(),
              name: planName.trim(),
              category: planCategory,
              description: planDescription.trim()
            }
          : p
      );
    } else {
      // Create new
      const newPlan: ShotPlan = {
        id: `plan-${Date.now()}`,
        code: planCode.trim().toUpperCase(),
        name: planName.trim(),
        category: planCategory,
        description: planDescription.trim() || 'Plano de grabación TCT',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'
      };
      updatedPlans.push(newPlan);
    }

    onUpdateCatalog({
      ...catalog,
      shotPlans: updatedPlans
    });

    setEditingPlan(null);
    setPlanCode('');
    setPlanName('');
    setPlanDescription('');
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('¿Eliminar este plano del catálogo?')) {
      onUpdateCatalog({
        ...catalog,
        shotPlans: catalog.shotPlans.filter(p => p.id !== planId)
      });
    }
  };

  // Data Export & Import
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      catalog,
      shots
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TCT_Videoclip_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.catalog && Array.isArray(parsed.catalog.artists)) {
          onUpdateCatalog(parsed.catalog);
          if (Array.isArray(parsed.shots)) {
            onUpdateShots(parsed.shots);
          }
          alert('¡Respaldo importado con éxito!');
        } else {
          alert('El archivo no contiene un formato de respaldo válido de Videoclip TCT.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Restablecer catálogos y tomas a los valores predeterminados de muestra?')) {
      onUpdateCatalog(INITIAL_CATALOG);
      onUpdateShots(INITIAL_SEEDED_SHOTS);
      alert('Se han restaurado los datos predeterminados.');
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      
      {/* Admin Nav Sub-Tabs (Matching Screenshot Image 5: "TOMAS", "GRUPO · FILTROS", "DATOS") */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => { setActiveSubTab('TOMAS'); setActiveEditingCatalog(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'TOMAS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>TOMAS (CATÁLOGOS)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('FILTROS'); setActiveEditingCatalog(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'FILTROS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>GRUPO · REGLAS</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('DATOS'); setActiveEditingCatalog(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'DATOS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>DATOS & RESPALDO</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB: TOMAS (Matching Screenshot Image 5 & 6)              */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'TOMAS' && !activeEditingCatalog && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              Catálogos de Producción
            </h3>
            <p className="text-xs text-slate-400">
              Seleccione una categoría para agregar, modificar o eliminar opciones del formulario de tomas.
            </p>
          </div>

          {/* Cards Grid (Matching Image 5: Artista, Tema, Lentes, Camarógrafo, Locaciones, Vestuario, Plano de Grabación) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Card 1: Artista */}
            <CatalogCard
              title="Artista"
              count={catalog.artists.length}
              icon={<User className="w-5 h-5 text-amber-400" />}
              description="Nombres de solistas, bandas y agrupaciones musicales."
              preview={catalog.artists.slice(0, 3).join(', ')}
              onClick={() => setActiveEditingCatalog('artists')}
            />

            {/* Card 2: Tema */}
            <CatalogCard
              title="Tema"
              count={catalog.themes.length}
              icon={<Music className="w-5 h-5 text-amber-400" />}
              description="Mixes, canciones y títulos musicales de la producción."
              preview={catalog.themes.slice(0, 3).join(', ')}
              onClick={() => setActiveEditingCatalog('themes')}
            />

            {/* Card 3: Lentes */}
            <CatalogCard
              title="Lentes"
              count={catalog.lenses.length}
              icon={<Aperture className="w-5 h-5 text-amber-400" />}
              description="Ópticas cinematográficas: Drone, 10mm, 15mm, 35mm, 50mm, 85mm..."
              preview={catalog.lenses.slice(0, 3).join(', ')}
              onClick={() => setActiveEditingCatalog('lenses')}
            />

            {/* Card 4: Camarógrafo */}
            <CatalogCard
              title="Camarógrafo"
              count={catalog.cameraOperators.length}
              icon={<Camera className="w-5 h-5 text-amber-400" />}
              description="Equipo de camarógrafos y directores de fotografía."
              preview={catalog.cameraOperators.slice(0, 3).join(', ')}
              onClick={() => setActiveEditingCatalog('cameraOperators')}
            />

            {/* Card 5: Locaciones */}
            <CatalogCard
              title="Locaciones"
              count={catalog.locations.length}
              icon={<MapPin className="w-5 h-5 text-amber-400" />}
              description="Haciendas, estudios, paisajes y sets de filmación."
              preview={catalog.locations.slice(0, 3).join(', ')}
              onClick={() => setActiveEditingCatalog('locations')}
            />

            {/* Card 6: Vestuario */}
            <CatalogCard
              title="Vestuario"
              count={catalog.wardrobes.length}
              icon={<Shirt className="w-5 h-5 text-amber-400" />}
              description="Trajes de gala, ropa típica, atuendos de cambio."
              preview={catalog.wardrobes.slice(0, 3).join(', ')}
              onClick={() => setActiveEditingCatalog('wardrobes')}
            />

            {/* Card 7: Plano de Grabación (Spans across or prominent) */}
            <div className="sm:col-span-2 lg:col-span-3">
              <CatalogCard
                title="Plano de grabación"
                count={catalog.shotPlans.length}
                icon={<Film className="w-5 h-5 text-amber-400" />}
                description="Catálogo visual maestro de planos: Panorámicos, Generales, Enteros, Americanos, Medios, Primer Plano y Detalle."
                preview="PGP, PG-AM, PG-AB, PE-A, PE-BV, PM-A, PP-A, PD-I..."
                isHighlight
                onClick={() => setActiveEditingCatalog('shotPlans')}
              />
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DRAWER: EDIT SIMPLE STRING CATALOG (Artists, Themes, etc.)    */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'TOMAS' && activeEditingCatalog && activeEditingCatalog !== 'shotPlans' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Administrar Catálogo:</span>
                <span className="text-amber-400 uppercase">{activeEditingCatalog}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Agregue o elimine las opciones disponibles en el formulario de tomas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveEditingCatalog(null)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
            >
              ← Volver a Catálogos
            </button>
          </div>

          {/* Add Input */}
          <div className="flex items-center gap-2 max-w-lg">
            <input
              type="text"
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
              placeholder={`Nuevo elemento para ${activeEditingCatalog}...`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem(activeEditingCatalog as any);
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-bold"
            />
            <button
              type="button"
              onClick={() => handleAddItem(activeEditingCatalog as any)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </button>
          </div>

          {/* Items List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
            {catalog[activeEditingCatalog].map(item => (
              <div
                key={item}
                className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-2 group hover:border-slate-700 transition-colors"
              >
                <span className="text-xs font-bold text-white truncate font-mono">{item}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(activeEditingCatalog as any, item)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Eliminar de catálogo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DRAWER: EDIT SHOT PLANS CATALOG                               */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'TOMAS' && activeEditingCatalog === 'shotPlans' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Catálogo de Planos Cinematográficos</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-black border border-amber-400/40">
                  {catalog.shotPlans.length} PLANOS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Administre los códigos cinematográficos, nombres y categorías técnicas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveEditingCatalog(null)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
            >
              ← Volver a Catálogos
            </button>
          </div>

          {/* Form to Add or Edit Shot Plan */}
          <form onSubmit={handleSavePlan} className="p-4 bg-slate-900 rounded-2xl border border-amber-500/30 space-y-3">
            <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>{editingPlan ? `Editar Plano [${editingPlan.code}]` : 'Crear Nuevo Plano Cinematográfico'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Código (ej. PE-MG):</label>
                <input
                  type="text"
                  required
                  placeholder="PE-MG"
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Nombre Descriptivo:</label>
                <input
                  type="text"
                  required
                  placeholder="Entero Músico Guitarra"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Categoría:</label>
                <select
                  value={planCategory}
                  onChange={(e) => setPlanCategory(e.target.value as ShotCategory)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
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
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {editingPlan && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlan(null);
                    setPlanCode('');
                    setPlanName('');
                    setPlanDescription('');
                  }}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                {editingPlan ? 'Guardar Cambios' : '+ Agregar Plano'}
              </button>
            </div>
          </form>

          {/* Shot Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {catalog.shotPlans.map(plan => (
              <div
                key={plan.id || plan.code}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-amber-400">
                      {plan.code}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-slate-950 text-slate-400 rounded-md border border-slate-800">
                      {plan.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">
                    {plan.name}
                  </h4>
                  {plan.description && (
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-950">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlan(plan);
                      setPlanCode(plan.code);
                      setPlanName(plan.name);
                      setPlanCategory(plan.category);
                      setPlanDescription(plan.description || '');
                    }}
                    className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Editar plano"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.id || plan.code)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Eliminar plano"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB: FILTROS & REGLAS                                     */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'FILTROS' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <h3 className="text-base font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Reglas de Grabación & Filtros Inteligentes</span>
          </h3>
          <p className="text-xs text-slate-400">
            Configure asociaciones recomendadas entre la distancia focal de lentes y los planos cinematográficos sugeridos en rodaje.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">Sugerencia Automática de Lentes</h4>
                <p className="text-[11px] text-slate-400">
                  Al elegir un plano en la galería visual, sugiere automáticamente la distancia focal recomendada.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                ACTIVADO
              </span>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">Control Consecutivo de Tomas</h4>
                <p className="text-[11px] text-slate-400">
                  Numeración automática correlativa (#001, #002, #003) sin saltos.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                ACTIVADO
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB: DATOS & RESPALDO                                     */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'DATOS' && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <span>Gestión de Datos, Respaldo y Sincronización</span>
            </h3>
            <p className="text-xs text-slate-400">
              Exporte el registro de tomas y catálogos en formato JSON para transferir entre dispositivos o guardar copias de seguridad de rodaje.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Export */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <Download className="w-6 h-6 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Exportar Respaldo JSON</h4>
                <p className="text-xs text-slate-400">
                  Descarga un archivo con todas las tomas registradas y catálogos configurados.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Descargar Backup
              </button>
            </div>

            {/* Import */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <Upload className="w-6 h-6 text-sky-400" />
                <h4 className="text-sm font-bold text-white">Importar Respaldo JSON</h4>
                <p className="text-xs text-slate-400">
                  Restaura tomas y catálogos desde un archivo de respaldo previo.
                </p>
              </div>
              <label className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-md text-center cursor-pointer block">
                <span>Seleccionar Archivo JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <RotateCcw className="w-6 h-6 text-red-400" />
                <h4 className="text-sm font-bold text-white">Restablecer Valores Iniciales</h4>
                <p className="text-xs text-slate-400">
                  Restaura los datos de muestra y catálogos originales de fábrica.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="w-full py-2.5 bg-slate-800 hover:bg-red-950 text-red-400 font-bold text-xs rounded-xl border border-red-900/50 cursor-pointer"
              >
                Restablecer a Fábrica
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// Subcomponent: Catalog Card (Matching Image 5)
interface CatalogCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  description: string;
  preview: string;
  isHighlight?: boolean;
  onClick: () => void;
}

const CatalogCard: React.FC<CatalogCardProps> = ({
  title,
  count,
  icon,
  description,
  preview,
  isHighlight,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 flex flex-col justify-between hover:scale-[1.01] shadow-lg group ${
        isHighlight
          ? 'bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-amber-500/50 hover:border-amber-400'
          : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 group-hover:scale-105 transition-transform">
              {icon}
            </div>
            <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
              {title}
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-mono font-bold">
            {count} opciones
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
          {preview}
        </span>
        <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
          <span>Editar</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
