import { MAX_HISTORY } from './constants';
import type { HistoryEntry } from './types';

const DATABASE_NAME = 'image-generator';
const STORE_NAME = 'history';

function openHistoryDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (db.objectStoreNames.contains('results')) {
        db.deleteObjectStore('results');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listHistory(): Promise<HistoryEntry[]> {
  const database = await openHistoryDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as HistoryEntry[]).sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error);
  });
}

export async function addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): Promise<void> {
  const database = await openHistoryDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).add(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  const all = await listHistory();
  if (all.length > MAX_HISTORY) {
    const excess = all.slice(MAX_HISTORY);
    await Promise.all(excess.map((item) => item.id !== undefined ? deleteHistoryEntry(item.id) : Promise.resolve()));
  }
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  const database = await openHistoryDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearHistory(): Promise<void> {
  const database = await openHistoryDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
