import { MAX_VIDEO_HISTORY } from './constants';
import type { VideoHistoryEntry } from './types';

const DATABASE_NAME = 'image-generator';
const STORE_NAME = 'videoHistory';

function openHistoryDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 4);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listVideoHistory(): Promise<VideoHistoryEntry[]> {
  const database = await openHistoryDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as VideoHistoryEntry[]).sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error);
  });
}

export async function addVideoHistoryEntry(entry: Omit<VideoHistoryEntry, 'id'>): Promise<void> {
  const database = await openHistoryDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).add(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  const all = await listVideoHistory();
  if (all.length > MAX_VIDEO_HISTORY) {
    const excess = all.slice(MAX_VIDEO_HISTORY);
    await Promise.all(excess.map((item) => item.id !== undefined ? deleteVideoHistoryEntry(item.id) : Promise.resolve()));
  }
}

export async function deleteVideoHistoryEntry(id: number): Promise<void> {
  const database = await openHistoryDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearVideoHistory(): Promise<void> {
  const database = await openHistoryDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
