import { SyncQueueItem } from '../types';
import { getIdbItem, setIdbItem, STORES } from './indexedDb';

const SYNC_QUEUE_KEY = 'tct_sync_queue_v1';
const IDB_SYNC_QUEUE_KEY = 'sync_queue_items';
let memoryQueueCache: SyncQueueItem[] | null = null;

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncProgress: number;
  lastSyncTime?: string;
}

// Listeners for sync state changes
type SyncCallback = (queue: SyncQueueItem[], isSyncing: boolean, progress: number) => void;
const subscribers: Set<SyncCallback> = new Set();

export const subscribeToSyncQueue = (callback: SyncCallback): (() => void) => {
  subscribers.add(callback);
  callback(getSyncQueue(), isSyncingActive, currentSyncProgress);
  return () => {
    subscribers.delete(callback);
  };
};

let isSyncingActive = false;
let currentSyncProgress = 0;
let lastSuccessfulSyncTime: string | undefined = new Date().toLocaleTimeString();

const notifySubscribers = () => {
  const queue = getSyncQueue();
  subscribers.forEach(cb => cb(queue, isSyncingActive, currentSyncProgress));
  window.dispatchEvent(new CustomEvent('tct_sync_queue_change', { 
    detail: { queue, isSyncing: isSyncingActive, progress: currentSyncProgress } 
  }));
};

export const getSyncStatus = (): SyncStatus => {
  const queue = getSyncQueue();
  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: queue.filter(q => q.status === 'pending' || q.status === 'syncing').length,
    isSyncing: isSyncingActive,
    syncProgress: currentSyncProgress,
    lastSyncTime: lastSuccessfulSyncTime
  };
};

export const getSyncQueue = (): SyncQueueItem[] => {
  if (memoryQueueCache) return memoryQueueCache;
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryQueueCache = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('Notice reading sync queue from localStorage:', err);
  }
  memoryQueueCache = [];
  return [];
};

export const saveSyncQueue = (queue: SyncQueueItem[]): void => {
  memoryQueueCache = queue;
  setIdbItem(STORES.SYNC_QUEUE, IDB_SYNC_QUEUE_KEY, queue).catch((err) => {
    console.warn('Notice saving sync queue to IndexedDB:', err);
  });
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Notice saving sync queue to localStorage (quota protected, stored in IDB):', err);
  }
  notifySubscribers();
};

export const addToSyncQueue = (
  projectId: string, 
  action: SyncQueueItem['action'], 
  description: string,
  projectCode?: string
): SyncQueueItem => {
  const queue = getSyncQueue();
  const newItem: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    projectId,
    projectCode,
    action,
    description,
    timestamp: new Date().toLocaleTimeString(),
    status: 'pending',
    retryCount: 0
  };

  queue.push(newItem);
  saveSyncQueue(queue);
  return newItem;
};

export const removeSyncQueueItem = (id: string): void => {
  const queue = getSyncQueue().filter(item => item.id !== id);
  saveSyncQueue(queue);
};

export const clearSyncQueue = (): void => {
  saveSyncQueue([]);
};

export const clearSyncedItems = (): void => {
  const pending = getSyncQueue().filter(q => q.status === 'pending' || q.status === 'syncing');
  saveSyncQueue(pending);
};

// Process sync queue with auto-retry and visible progression
export const processSyncQueue = async (
  onProgress?: (syncedCount: number, total: number) => void
): Promise<{ success: boolean; processed: number }> => {
  const queue = getSyncQueue();
  if (queue.length === 0) {
    lastSuccessfulSyncTime = new Date().toLocaleTimeString();
    return { success: true, processed: 0 };
  }
  if (isSyncingActive) return { success: false, processed: 0 };

  isSyncingActive = true;
  currentSyncProgress = 0;
  notifySubscribers();

  const total = queue.length;
  let processed = 0;

  for (let i = 0; i < queue.length; i++) {
    queue[i].status = 'syncing';
    saveSyncQueue([...queue]);

    // Simulate reliable network transaction
    await new Promise(resolve => setTimeout(resolve, 400));

    // Mark as synced
    queue[i].status = 'synced';
    processed++;
    currentSyncProgress = Math.round((processed / total) * 100);
    if (onProgress) onProgress(processed, total);
    notifySubscribers();
  }

  // After completion, clear synced items after a small delay
  await new Promise(resolve => setTimeout(resolve, 300));
  saveSyncQueue([]);
  isSyncingActive = false;
  currentSyncProgress = 100;
  lastSuccessfulSyncTime = new Date().toLocaleTimeString();
  notifySubscribers();

  return { success: true, processed };
};
