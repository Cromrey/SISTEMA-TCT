import React, { useState, useEffect } from 'react';
import { AuthUser } from '../../types';
import { 
  VideoclipShot, 
  VideoclipCatalog, 
  VideoclipGoal 
} from '../../types/videoclip';
import { 
  getStoredVideoclipCatalog, 
  saveVideoclipCatalog, 
  getStoredVideoclipShots, 
  saveVideoclipShots, 
  getStoredVideoclipGoals, 
  saveVideoclipGoals 
} from '../../utils/videoclipStorage';
import { VideoclipNewShotView } from './VideoclipNewShotView';
import { VideoclipShotsLogView } from './VideoclipShotsLogView';
import { VideoclipGoalsKpiView } from './VideoclipGoalsKpiView';
import { VideoclipAdminView } from './VideoclipAdminView';
import { 
  Film, 
  ArrowLeft, 
  ListPlus, 
  Table, 
  Target, 
  Settings, 
  Sparkles, 
  CheckCircle, 
  Layers,
  X
} from 'lucide-react';

interface VideoclipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
}

type VideoclipTab = 'NEW_SHOT' | 'RECORDED_SHOTS' | 'GOALS_KPI' | 'ADMIN';

export const VideoclipModal: React.FC<VideoclipModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<VideoclipTab>('NEW_SHOT');
  const [catalog, setCatalog] = useState<VideoclipCatalog>(getStoredVideoclipCatalog());
  const [shots, setShots] = useState<VideoclipShot[]>(getStoredVideoclipShots());
  const [goals, setGoals] = useState<VideoclipGoal[]>(getStoredVideoclipGoals());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setCatalog(getStoredVideoclipCatalog());
      setShots(getStoredVideoclipShots());
      setGoals(getStoredVideoclipGoals());
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Shot Operations
  const handleSaveShot = (newShot: VideoclipShot) => {
    const updated = [newShot, ...shots];
    setShots(updated);
    saveVideoclipShots(updated);
    showToast(`✅ Toma #${String(newShot.shotNumber).padStart(3, '0')} [${newShot.shotPlanCode}] registrada con éxito`);
  };

  const handleUpdateShot = (updatedShot: VideoclipShot) => {
    const updated = shots.map(s => s.id === updatedShot.id ? updatedShot : s);
    setShots(updated);
    saveVideoclipShots(updated);
    showToast(`✏️ Toma #${String(updatedShot.shotNumber).padStart(3, '0')} actualizada`);
  };

  const handleDeleteShot = (shotId: string) => {
    const updated = shots.filter(s => s.id !== shotId);
    setShots(updated);
    saveVideoclipShots(updated);
    showToast(`🗑️ Toma eliminada`);
  };

  // Goal Operations
  const handleSaveGoal = (goal: VideoclipGoal) => {
    const updated = [goal, ...goals];
    setGoals(updated);
    saveVideoclipGoals(updated);
    showToast(`🎯 Meta "${goal.title}" creada`);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter(g => g.id !== goalId);
    setGoals(updated);
    saveVideoclipGoals(updated);
    showToast(`Meta eliminada`);
  };

  // Catalog Operations
  const handleUpdateCatalog = (newCatalog: VideoclipCatalog) => {
    setCatalog(newCatalog);
    saveVideoclipCatalog(newCatalog);
  };

  const handleUpdateShots = (newShots: VideoclipShot[]) => {
    setShots(newShots);
    saveVideoclipShots(newShots);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 text-slate-100 flex flex-col overflow-hidden animate-fade-in">
      
      {/* ------------------------------------------------------------- */}
      {/* TOP BAR (Matching User Screenshots & Corporate Header)        */}
      {/* ------------------------------------------------------------- */}
      <header className="bg-slate-950 border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 flex-wrap shadow-xl">
        
        {/* Left: Back Button & Title */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Atrás</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5 font-mono">
                  <span>VIDEOCLIP</span>
                  <span className="text-amber-400">• TOMAS EN VIVO</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  EN LÍNEA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                Corporación TCT • Marcando Historia | Registro & Toma de Decisiones en Rodaje
              </p>
            </div>
          </div>
        </div>

        {/* Right: User Identity & Close */}
        <div className="flex items-center space-x-3 ml-auto">
          <div className="hidden md:flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">Operador:</span>
            <span className="font-bold text-amber-300">
              {currentUser?.fullName || currentUser?.username || 'ELITA'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {currentUser?.role === 'admin' ? '🛡️ Admin' : '🎬 Técnico'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
            title="Cerrar módulo Videoclip"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* NAVIGATION TABS BAR                                           */}
      {/* ------------------------------------------------------------- */}
      <nav className="bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        
        {/* Tab 1: NUEVA TOMA */}
        <button
          type="button"
          onClick={() => setActiveTab('NEW_SHOT')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'NEW_SHOT'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
              : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <ListPlus className="w-4 h-4" />
          <span>📝 NUEVA TOMA</span>
        </button>

        {/* Tab 2: TOMAS REGISTRADAS */}
        <button
          type="button"
          onClick={() => setActiveTab('RECORDED_SHOTS')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'RECORDED_SHOTS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
              : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>📋 TOMAS REGISTRADAS</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'RECORDED_SHOTS' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
          }`}>
            {shots.length}
          </span>
        </button>

        {/* Tab 3: MIS METAS & KPI */}
        <button
          type="button"
          onClick={() => setActiveTab('GOALS_KPI')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'GOALS_KPI'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
              : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>🎯 METAS & KPI</span>
        </button>

        {/* Tab 4: ADMINISTRACIÓN */}
        <button
          type="button"
          onClick={() => setActiveTab('ADMIN')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'ADMIN'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
              : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>⚙️ ADMINISTRACIÓN</span>
        </button>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIEW CONTENT CONTAINER                                   */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
        
        {activeTab === 'NEW_SHOT' && (
          <VideoclipNewShotView
            currentUser={currentUser}
            catalog={catalog}
            shots={shots}
            goals={goals}
            onSaveShot={handleSaveShot}
            onSaveGoal={handleSaveGoal}
            onDeleteGoal={handleDeleteGoal}
            onUpdateCatalog={handleUpdateCatalog}
            onNavigateToLog={() => setActiveTab('RECORDED_SHOTS')}
          />
        )}

        {activeTab === 'RECORDED_SHOTS' && (
          <VideoclipShotsLogView
            shots={shots}
            catalog={catalog}
            onUpdateShot={handleUpdateShot}
            onDeleteShot={handleDeleteShot}
            onNavigateToNewShot={() => setActiveTab('NEW_SHOT')}
          />
        )}

        {activeTab === 'GOALS_KPI' && (
          <VideoclipGoalsKpiView
            shots={shots}
            catalog={catalog}
            goals={goals}
            onSaveGoal={handleSaveGoal}
            onDeleteGoal={handleDeleteGoal}
            onNavigateToNewShot={() => setActiveTab('NEW_SHOT')}
          />
        )}

        {activeTab === 'ADMIN' && (
          <VideoclipAdminView
            catalog={catalog}
            shots={shots}
            onUpdateCatalog={handleUpdateCatalog}
            onUpdateShots={handleUpdateShots}
          />
        )}

      </main>

      {/* ------------------------------------------------------------- */}
      {/* FLOATING TOAST NOTIFICATION                                   */}
      {/* ------------------------------------------------------------- */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-amber-500/80 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-black">{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
