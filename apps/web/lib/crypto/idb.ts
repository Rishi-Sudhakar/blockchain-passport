// Minimal IndexedDB wrapper — just enough to store one non-extractable
// CryptoKeyPair per signing address. Avoids pulling in a dependency for what
// is a handful of lines; CryptoKey objects support structured clone, so they
// can be stored directly as IndexedDB values.

const DB_NAME = "blockchain-passport";
const STORE = "signing-keys";

interface StoredKeyRecord {
  address: string;
  privateKey: CryptoKey;
  publicKeyJwk: JsonWebKey;
  deviceLabel: string;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "address" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putSigningKey(record: StoredKeyRecord): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getSigningKey(address: string): Promise<StoredKeyRecord | undefined> {
  const db = await openDB();
  const result = await new Promise<StoredKeyRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(address);
    req.onsuccess = () => resolve(req.result as StoredKeyRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export async function listSigningKeys(): Promise<StoredKeyRecord[]> {
  const db = await openDB();
  const result = await new Promise<StoredKeyRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as StoredKeyRecord[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export type { StoredKeyRecord };
