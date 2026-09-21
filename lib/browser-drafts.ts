const DB_NAME = "cfm-browser-drafts";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

export interface BrowserDraft<T> {
  key: string;
  version: number;
  updatedAt: string;
  value: T;
}

function indexedDbAvailable() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDraftDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!indexedDbAvailable()) {
      reject(new Error("IndexedDB indisponivel."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Nao foi possivel abrir os rascunhos locais."));
  });
}

export async function readBrowserDraft<T>(key: string) {
  if (!indexedDbAvailable()) return null;
  const db = await openDraftDb();
  return new Promise<BrowserDraft<T> | null>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as BrowserDraft<T> | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Nao foi possivel ler o rascunho local."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Nao foi possivel ler o rascunho local."));
    };
  });
}

export async function writeBrowserDraft<T>(draft: BrowserDraft<T>) {
  if (!indexedDbAvailable()) return;
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(draft);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Nao foi possivel guardar o rascunho local."));
    };
  });
}

export async function deleteBrowserDraft(key: string) {
  if (!indexedDbAvailable()) return;
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(key);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Nao foi possivel apagar o rascunho local."));
    };
  });
}
