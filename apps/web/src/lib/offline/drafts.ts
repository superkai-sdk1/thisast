const DB_NAME = 'crm-offline';
const DB_VERSION = 1;
const STORE = 'drafts';

export type DraftType = 'property' | 'demand';

export interface Draft<T = object> {
  id: string;
  type: DraftType;
  data: T;
  savedAt: number;
  synced: boolean;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraft<T extends object>(type: DraftType, data: T, id?: string): Promise<string> {
  const db = await openDb();
  const draftId = id ?? crypto.randomUUID();
  const draft: Draft<T> = { id: draftId, type, data, savedAt: Date.now(), synced: false };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put(draft);
    req.onsuccess = () => resolve(draftId);
    req.onerror = () => reject(req.error);
  });
}

export async function getDraft<T extends object>(id: string): Promise<Draft<T> | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as Draft<T>);
    req.onerror = () => reject(req.error);
  });
}

export async function listDrafts(type?: DraftType): Promise<Draft[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = () => {
      const all = req.result as Draft[];
      resolve(type ? all.filter(d => d.type === type) : all);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function markSynced(id: string): Promise<void> {
  const draft = await getDraft(id);
  if (!draft) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put({ ...draft, synced: true });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
