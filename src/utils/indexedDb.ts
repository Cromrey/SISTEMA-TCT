/**
 * IndexedDB persistence layer for Corporación TCT Audiovisual Management System.
 * Provides resilient, high-capacity offline storage that does not suffer from localStorage 5MB quota limitations.
 */

const DB_NAME = 'tct_production_idb_v1';
const DB_VERSION = 1;

export const STORES = {
  PROJECTS: 'projects',
  RULES: 'rules',
  SYNC_QUEUE: 'sync_queue'
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export const getIDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        db.createObjectStore(STORES.PROJECTS);
      }
      if (!db.objectStoreNames.contains(STORES.RULES)) {
        db.createObjectStore(STORES.RULES);
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        db.createObjectStore(STORES.SYNC_QUEUE);
      }
    };

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      console.warn('IndexedDB failed to open, falling back to in-memory/localStorage:', event);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
};

export const getIdbItem = async <T>(storeName: string, key: string): Promise<T | null> => {
  try {
    const db = await getIDB();
    return new Promise<T | null>((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve((request.result as T) ?? null);
      };

      request.onerror = () => {
        console.warn(`IndexedDB read error on store ${storeName}:`, request.error);
        resolve(null);
      };
    });
  } catch (err) {
    console.warn(`IndexedDB error fetching ${storeName}/${key}:`, err);
    return null;
  }
};

export const setIdbItem = async <T>(storeName: string, key: string, value: T): Promise<boolean> => {
  try {
    const db = await getIDB();
    return new Promise<boolean>((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.warn(`IndexedDB write error on store ${storeName}:`, request.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn(`IndexedDB error saving to ${storeName}/${key}:`, err);
    return false;
  }
};

export const clearIdbStore = async (storeName: string): Promise<boolean> => {
  try {
    const db = await getIDB();
    return new Promise<boolean>((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn(`IndexedDB error clearing ${storeName}:`, err);
    return false;
  }
};
