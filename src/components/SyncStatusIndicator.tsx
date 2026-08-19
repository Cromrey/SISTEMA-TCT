import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  CloudOff,
  Database
} from 'lucide-react';
import { 
  getSyncQueue, 
  getSyncStatus, 
  processSyncQueue, 
  clearSyncedItems,
  SyncStatus
} from '../utils/syncQueue';

interface SyncStatusIndicatorProps {
  onSyncCompleted?: () => void;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  onSyncCompleted
}) => {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());
  const [showDetails, setShowDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getSyncStatus());
    }, 1500);

    const handleOnline = () => {
      setStatus(getSyncStatus());
      // Trigger automatic sync on reconnect
      handleManualSync();
    };

    const handleOffline = () => {
      setStatus(getSyncStatus());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await processSyncQueue();
      clearSyncedItems();
      setStatus(getSyncStatus());
      if (onSyncCompleted) onSyncCompleted();
    } catch (e) {
      console.error('Error during sync:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const queue = getSyncQueue();
  const pendingCount = queue.filter(q => q.status === 'pending' || q.status === 'syncing').length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs ${
          !status.isOnline
            ? 'bg-amber-100 border-amber-300 text-amber-950 animate-pulse'
            : pendingCount > 0
            ? 'bg-blue-50 border-blue-300 text-blue-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
        }`}
        title="Estado de Red y Sincronización Local / Nube TCT"
      >
        {!status.isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Modo Offline ({pendingCount} en cola)</span>
            <span className="sm:hidden">Offline ({pendingCount})</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isProcessing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sincronizando ({pendingCount})</span>
            <span className="sm:hidden">Sync ({pendingCount})</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Online & Sincronizado</span>
            <span className="sm:hidden">Online</span>
          </>
        )}
      </button>

      {/* Popover details modal */}
      {showDetails && (
        <div className="absolute right-0 top-10 mt-1 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-amber-500" />
              <h4 className="font-black text-slate-900">Motor de Sincronización TCT</h4>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Estado Conexión:</span>
              <span className={`font-black ${status.isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                {status.isOnline ? '🟢 En Línea (Internet OK)' : '🟠 Sin Conexión (Modo Local)'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Cola de Acciones Offline:</span>
              <span className="font-bold text-slate-900">{pendingCount} transacciones</span>
            </div>

            {status.lastSyncTime && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-[11px]">
                <span className="text-slate-500 font-medium">Última Sincronización:</span>
                <span className="text-slate-700 font-mono">{status.lastSyncTime}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            Todos los cambios, firmas y evidencias se guardan de inmediato en la base de datos local y se reintentan automáticamente al volver a tener internet.
          </p>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleManualSync}
              disabled={isProcessing || !status.isOnline}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-400 font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Sincronizando ahora...' : 'Forzar Sincronización'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
