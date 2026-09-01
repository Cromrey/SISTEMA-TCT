import React, { useState, useMemo } from 'react';
import { VideoclipShot, VideoclipCatalog, ShotPlan } from '../../types/videoclip';
import { formatShotNumber } from '../../utils/videoclipStorage';
import { 
  Search, 
  Filter, 
  Table, 
  Share2, 
  Trash2, 
  Edit3, 
  Download, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Sparkles,
  User,
  Music,
  MapPin,
  Shirt,
  Camera,
  Aperture,
  FileText,
  X,
  Save,
  Printer
} from 'lucide-react';

interface VideoclipShotsLogViewProps {
  shots: VideoclipShot[];
  catalog: VideoclipCatalog;
  onUpdateShot: (shot: VideoclipShot) => void;
  onDeleteShot: (shotId: string) => void;
  onNavigateToNewShot?: () => void;
}

export const VideoclipShotsLogView: React.FC<VideoclipShotsLogViewProps> = ({
  shots,
  catalog,
  onUpdateShot,
  onDeleteShot,
  onNavigateToNewShot
}) => {
  // Cross Filters State (Matching Screenshot Image 4: "FILTROS CRUZADOS")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterArtist, setFilterArtist] = useState('ALL');
  const [filterTheme, setFilterTheme] = useState('ALL');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterCameraOp, setFilterCameraOp] = useState('ALL');
  const [filterLens, setFilterLens] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Modals
  const [is11ColumnsModalOpen, setIs11ColumnsModalOpen] = useState(false);
  const [editingShot, setEditingShot] = useState<VideoclipShot | null>(null);

  // Filter computation
  const filteredShots = useMemo(() => {
    return shots.filter(shot => {
      // Search
      const searchMatch = !filterSearch.trim() ||
        String(shot.shotNumber).includes(filterSearch) ||
        shot.artist.toLowerCase().includes(filterSearch.toLowerCase()) ||
        shot.theme.toLowerCase().includes(filterSearch.toLowerCase()) ||
        shot.shotPlanCode.toLowerCase().includes(filterSearch.toLowerCase()) ||
        shot.shotPlanName.toLowerCase().includes(filterSearch.toLowerCase()) ||
        shot.cameraOperator.toLowerCase().includes(filterSearch.toLowerCase()) ||
        (shot.notes && shot.notes.toLowerCase().includes(filterSearch.toLowerCase()));

      const artistMatch = filterArtist === 'ALL' || shot.artist === filterArtist;
      const themeMatch = filterTheme === 'ALL' || shot.theme === filterTheme;
      const locMatch = filterLocation === 'ALL' || shot.location === filterLocation;
      const camMatch = filterCameraOp === 'ALL' || shot.cameraOperator === filterCameraOp;
      const lensMatch = filterLens === 'ALL' || shot.lens === filterLens;
      const catMatch = filterCategory === 'ALL' || shot.shotPlanCategory === filterCategory;

      return searchMatch && artistMatch && themeMatch && locMatch && camMatch && lensMatch && catMatch;
    });
  }, [shots, filterSearch, filterArtist, filterTheme, filterLocation, filterCameraOp, filterLens, filterCategory]);

  const hasActiveFilters = 
    filterSearch !== '' || 
    filterArtist !== 'ALL' || 
    filterTheme !== 'ALL' || 
    filterLocation !== 'ALL' || 
    filterCameraOp !== 'ALL' || 
    filterLens !== 'ALL' || 
    filterCategory !== 'ALL';

  const handleResetFilters = () => {
    setFilterSearch('');
    setFilterArtist('ALL');
    setFilterTheme('ALL');
    setFilterLocation('ALL');
    setFilterCameraOp('ALL');
    setFilterLens('ALL');
    setFilterCategory('ALL');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Nro Toma',
      'Fecha y Hora',
      'Código Plano',
      'Nombre del Plano',
      'Categoría',
      'Artista',
      'Tema',
      'Locación',
      'Vestuario',
      'Camarógrafo',
      'Lente Final',
      'Notas / Operador'
    ];

    const rows = filteredShots.map(s => [
      formatShotNumber(s.shotNumber),
      `"${s.displayDate}"`,
      `"${s.shotPlanCode}"`,
      `"${s.shotPlanName}"`,
      `"${s.shotPlanCategory}"`,
      `"${s.artist}"`,
      `"${s.theme}"`,
      `"${s.location}"`,
      `"${s.wardrobe}"`,
      `"${s.cameraOperator}"`,
      `"${s.lens}"`,
      `"${s.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TCT_Tomas_Videoclip_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const total = filteredShots.length;
    const summary = filteredShots.slice(0, 8).map(s => 
      `• *${formatShotNumber(s.shotNumber)}* [${s.shotPlanCode}] ${s.shotPlanName} - Cam: ${s.cameraOperator} (${s.lens})`
    ).join('\n');

    const text = encodeURIComponent(
      `🎬 *REPORTE DE TOMAS TCT VIDEOCLIP*\n` +
      `Total tomas registradas: ${total}\n\n` +
      `${summary}\n\n` +
      `_Corporación TCT • Marcando Historia_`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="w-full space-y-5 animate-fade-in max-w-6xl mx-auto pb-12">
      
      {/* Top Action Bar (Matching Image 4: "Cuadro 11 columnas" & "Compartir") */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-black text-amber-400">
            REGISTRO CINEMATOGRÁFICO
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-xs text-slate-300">
            Monitoreo y toma de decisiones en rodaje
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIs11ColumnsModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 hover:border-amber-400/50 shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            title="Abrir vista de auditoría Cuadro 11 columnas"
          >
            <Table className="w-4 h-4 text-amber-400" />
            <span>Cuadro 11 columnas</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Exportar a Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="p-2 sm:px-3.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Compartir reporte de tomas por WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Compartir</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: FILTROS CRUZADOS (Matching Screenshot Image 4)       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div 
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="px-5 py-3.5 bg-slate-900/90 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black tracking-wider uppercase text-amber-400 font-mono">
              FILTROS CRUZADOS
            </span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                Activos
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <span className="text-xs text-slate-400 hidden sm:inline">
              {isFiltersOpen ? 'Ocultar filtros' : 'Desplegar filtros'}
            </span>
            {isFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Filter Body */}
        {isFiltersOpen && (
          <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800/80 space-y-4 animate-fade-in">
            {/* Quick Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Buscar por número, código de plano, notas, artista..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Dropdown Filters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Artista */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">ARTISTA:</label>
                <select
                  value={filterArtist}
                  onChange={(e) => setFilterArtist(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="ALL">Todos</option>
                  {catalog.artists.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Tema */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">TEMA:</label>
                <select
                  value={filterTheme}
                  onChange={(e) => setFilterTheme(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="ALL">Todos</option>
                  {catalog.themes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Locación */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">LOCACIÓN:</label>
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="ALL">Todas</option>
                  {catalog.locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Camarógrafo */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">CAMARÓGRAFO:</label>
                <select
                  value={filterCameraOp}
                  onChange={(e) => setFilterCameraOp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="ALL">Todos</option>
                  {catalog.cameraOperators.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Lente */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">LENTE:</label>
                <select
                  value={filterLens}
                  onChange={(e) => setFilterLens(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="ALL">Todos</option>
                  {catalog.lenses.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Categoría Plano */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">CATEGORÍA:</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="ALL">Todas</option>
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

            {/* Reset Button */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Filtros</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SHOTS LIST HEADER & CARDS (Matching Screenshot Image 4)       */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black tracking-wider uppercase text-slate-400 font-mono">
            TOMAS REGISTRADAS
          </span>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
            {filteredShots.length}/{shots.length}
          </span>
        </div>

        {filteredShots.length === 0 ? (
          <div className="p-12 border border-dashed border-slate-800 rounded-3xl text-center space-y-3 bg-slate-950/70">
            <Camera className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">
              No hay tomas que coincidan con los filtros actuales.
            </h4>
            <div className="flex items-center justify-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl"
                >
                  Limpiar filtros
                </button>
              )}
              {onNavigateToNewShot && (
                <button
                  type="button"
                  onClick={onNavigateToNewShot}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl"
                >
                  + Registrar Nueva Toma
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShots.map(shot => (
              <ShotLogCard
                key={shot.id}
                shot={shot}
                onEdit={() => setEditingShot(shot)}
                onDelete={() => {
                  if (confirm(`¿Eliminar la toma ${formatShotNumber(shot.shotNumber)} [${shot.shotPlanCode}]?`)) {
                    onDeleteShot(shot.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CUADRO 11 COLUMNAS (Full Cinematic Log Auditor)        */}
      {/* ------------------------------------------------------------- */}
      {is11ColumnsModalOpen && (
        <Audit11ColumnsModal
          shots={filteredShots}
          onClose={() => setIs11ColumnsModalOpen(false)}
          onExportCSV={handleExportCSV}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT SHOT                                              */}
      {/* ------------------------------------------------------------- */}
      {editingShot && (
        <EditShotModal
          shot={editingShot}
          catalog={catalog}
          onClose={() => setEditingShot(null)}
          onSave={(updated) => {
            onUpdateShot(updated);
            setEditingShot(null);
          }}
        />
      )}

    </div>
  );
};

// Subcomponent: Shot Log Card (Exact styling of Image 4)
interface ShotLogCardProps {
  shot: VideoclipShot;
  onEdit: () => void;
  onDelete: () => void;
}

const ShotLogCard: React.FC<ShotLogCardProps> = ({ shot, onEdit, onDelete }) => {
  return (
    <div className="bg-slate-950/95 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xl transition-all space-y-3 relative group">
      
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          
          {/* Thumbnail Box with Plan Code */}
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden text-center p-1">
            <span className="text-[10px] font-mono font-black text-amber-400 drop-shadow-md">
              {shot.shotPlanCode}
            </span>
          </div>

          {/* Shot Number, Timestamp & Plan Title */}
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-sm font-black text-amber-400 font-mono">
                {formatShotNumber(shot.shotNumber)}
              </span>
              <span className="text-[11px] font-medium text-slate-400 font-mono">
                {shot.displayDate}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-black text-white truncate">
              [{shot.shotPlanCode}] {shot.shotPlanName}
            </h4>
          </div>
        </div>

        {/* Edit & Delete Action Buttons (Matching Screenshot Image 4) */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
            title="Editar toma"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Eliminar toma"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metadata Badges Row (Matching Image 4 metadata icons) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-900/80 text-[11px]">
        
        {/* Artista */}
        <div className="flex items-center space-x-1.5 text-slate-300 truncate">
          <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-500 uppercase text-[9px] font-bold">ARTISTA:</span>
          <span className="font-semibold text-white truncate">{shot.artist}</span>
        </div>

        {/* Tema */}
        <div className="flex items-center space-x-1.5 text-slate-300 truncate">
          <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-500 uppercase text-[9px] font-bold">TEMA:</span>
          <span className="font-semibold text-white truncate">{shot.theme}</span>
        </div>

        {/* Locación */}
        <div className="flex items-center space-x-1.5 text-slate-300 truncate">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-500 uppercase text-[9px] font-bold">LOCACIÓN:</span>
          <span className="font-semibold text-white truncate">{shot.location}</span>
        </div>

        {/* Vestuario */}
        <div className="flex items-center space-x-1.5 text-slate-300 truncate">
          <Shirt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-500 uppercase text-[9px] font-bold">VESTUARIO:</span>
          <span className="font-semibold text-white truncate">{shot.wardrobe}</span>
        </div>

        {/* Camarógrafo */}
        <div className="flex items-center space-x-1.5 text-slate-300 truncate">
          <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-500 uppercase text-[9px] font-bold">CAMARÓGRAFO:</span>
          <span className="font-semibold text-white truncate">{shot.cameraOperator}</span>
        </div>

        {/* Lente Final */}
        <div className="flex items-center space-x-1.5 text-slate-300 truncate">
          <Aperture className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-500 uppercase text-[9px] font-bold">LENTE:</span>
          <span className="font-mono font-bold text-amber-300 truncate">{shot.lens}</span>
        </div>
      </div>

      {/* Notes & Recorded By Row (Matching Image 4: "NOTAS: Registrado por: ELITA") */}
      <div className="flex items-start space-x-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-900/60">
        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span className="text-slate-500 uppercase text-[9px] font-bold">NOTAS:</span>
        <span className="text-slate-300 font-medium">
          {shot.notes || `Registrado por: ${shot.recordedBy}`}
        </span>
      </div>
    </div>
  );
};

// Subcomponent: Audit 11 Columns Modal
interface Audit11ColumnsModalProps {
  shots: VideoclipShot[];
  onClose: () => void;
  onExportCSV: () => void;
}

const Audit11ColumnsModal: React.FC<Audit11ColumnsModalProps> = ({ shots, onClose, onExportCSV }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 text-slate-100 w-full max-w-7xl max-h-[92vh] rounded-3xl border-2 border-amber-500/40 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-md">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Cuadro Oficial de 11 Columnas de Grabación
              </h3>
              <p className="text-xs text-slate-400">
                Planilla de control técnico y desglose cinematográfico completo.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-900 text-amber-400 border-b border-slate-800 text-[10px] uppercase font-black tracking-wider">
                <th className="p-2.5"># Toma</th>
                <th className="p-2.5">Fecha/Hora</th>
                <th className="p-2.5">Código</th>
                <th className="p-2.5">Plano</th>
                <th className="p-2.5">Categoría</th>
                <th className="p-2.5">Artista</th>
                <th className="p-2.5">Tema</th>
                <th className="p-2.5">Locación</th>
                <th className="p-2.5">Vestuario</th>
                <th className="p-2.5">Camarógrafo</th>
                <th className="p-2.5">Lente</th>
                <th className="p-2.5">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {shots.map(s => (
                <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="p-2.5 font-bold text-amber-300">{formatShotNumber(s.shotNumber)}</td>
                  <td className="p-2.5 text-slate-400 whitespace-nowrap">{s.displayDate}</td>
                  <td className="p-2.5 font-bold text-emerald-400">{s.shotPlanCode}</td>
                  <td className="p-2.5 font-sans font-medium text-white">{s.shotPlanName}</td>
                  <td className="p-2.5 text-[10px] text-slate-400">{s.shotPlanCategory}</td>
                  <td className="p-2.5 font-sans">{s.artist}</td>
                  <td className="p-2.5 font-sans">{s.theme}</td>
                  <td className="p-2.5 font-sans">{s.location}</td>
                  <td className="p-2.5 font-sans">{s.wardrobe}</td>
                  <td className="p-2.5 font-sans">{s.cameraOperator}</td>
                  <td className="p-2.5 text-amber-200">{s.lens}</td>
                  <td className="p-2.5 text-[11px] text-slate-400 max-w-xs truncate">{s.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Total: {shots.length} tomas listadas</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Edit Shot Modal
interface EditShotModalProps {
  shot: VideoclipShot;
  catalog: VideoclipCatalog;
  onClose: () => void;
  onSave: (updated: VideoclipShot) => void;
}

const EditShotModal: React.FC<EditShotModalProps> = ({ shot, catalog, onClose, onSave }) => {
  const [shotNumber, setShotNumber] = useState(shot.shotNumber);
  const [artist, setArtist] = useState(shot.artist);
  const [theme, setTheme] = useState(shot.theme);
  const [location, setLocation] = useState(shot.location);
  const [wardrobe, setWardrobe] = useState(shot.wardrobe);
  const [cameraOperator, setCameraOperator] = useState(shot.cameraOperator);
  const [lens, setLens] = useState(shot.lens);
  const [planCode, setPlanCode] = useState(shot.shotPlanCode);
  const [notes, setNotes] = useState(shot.notes || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedPlan = catalog.shotPlans.find(p => p.code === planCode);
    const now = new Date();
    const editNotice = `[REGISTRO EDITADO • ${now.toLocaleDateString()}, ${now.toLocaleTimeString()}]`;

    const updated: VideoclipShot = {
      ...shot,
      shotNumber,
      artist,
      theme,
      location,
      wardrobe,
      cameraOperator,
      lens,
      shotPlanCode: planCode,
      shotPlanName: matchedPlan?.name || shot.shotPlanName,
      shotPlanCategory: matchedPlan?.category || shot.shotPlanCategory,
      notes: notes.includes('EDITADO') ? notes : `${notes} ${editNotice}`.trim()
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 text-white w-full max-w-lg rounded-3xl border-2 border-amber-500/40 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black">Editar Toma {formatShotNumber(shot.shotNumber)}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nro Toma:</label>
              <input
                type="number"
                value={shotNumber}
                onChange={(e) => setShotNumber(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Plano:</label>
              <select
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {catalog.shotPlans.map(p => (
                  <option key={p.code} value={p.code}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Artista:</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tema:</label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Camarógrafo:</label>
              <input
                type="text"
                value={cameraOperator}
                onChange={(e) => setCameraOperator(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Lente Final:</label>
              <select
                value={lens}
                onChange={(e) => setLens(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              >
                {catalog.lenses.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Notas:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
            />
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
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
