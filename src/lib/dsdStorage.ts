// Utilitário de persistência robusto para Estudos de Simulação de Sorriso (DSD) e Imagens
// Utiliza IndexedDB como armazenamento principal (sem limite de 5MB do localStorage) com fallback seguro.

const DB_NAME = 'ambulatorio_dsd_db';
const DB_VERSION = 1;
const STORE_NAME = 'dsd_studies';

function openDsdDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado neste navegador'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Otimiza e comprime imagem base64 para economizar memória e tráfego
export async function optimizeImageBase64(dataUrl: string, maxWidth = 1200, quality = 0.82): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(dataUrl);
      }

      ctx.drawImage(img, 0, 0, width, height);
      const optimized = canvas.toDataURL('image/jpeg', quality);
      resolve(optimized);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Salva lista de estudos do paciente (IndexedDB + LocalStorage seguro)
export async function saveDsdStudies(patientKey: string, studies: any[]): Promise<boolean> {
  const cleanKey = patientKey || 'geral';

  // 1. Tenta salvar no IndexedDB
  try {
    const db = await openDsdDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put({ id: cleanKey, studies, updatedAt: new Date().toISOString() });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (idbErr) {
    console.warn('Aviso IndexedDB:', idbErr);
  }

  // 2. Tenta salvar versão leve/comprimida no LocalStorage como redundância
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `ambulatorio_dsd_history_${cleanKey}`;
      const previewList = studies.slice(0, 10);
      localStorage.setItem(storageKey, JSON.stringify(previewList));
    } catch (lsErr) {
      console.warn('LocalStorage quota excedida: dados persistidos no IndexedDB com sucesso.');
    }
  }

  return true;
}

// Carrega lista de estudos do paciente (IndexedDB -> fallback LocalStorage)
export async function loadDsdStudies(patientKey: string): Promise<any[]> {
  const cleanKey = patientKey || 'geral';

  // 1. Tenta carregar do IndexedDB
  try {
    const db = await openDsdDatabase();
    const result = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(cleanKey);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    });

    if (result && Array.isArray(result.studies) && result.studies.length > 0) {
      return result.studies;
    }
  } catch (idbErr) {
    console.warn('Aviso ao ler do IndexedDB:', idbErr);
  }

  // 2. Fallback para LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `ambulatorio_dsd_history_${cleanKey}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Fallback legado único
      const legacySingle = localStorage.getItem(`ambulatorio_dsd_simulation_${cleanKey}`);
      if (legacySingle) {
        const parsed = JSON.parse(legacySingle);
        if (parsed.beforeImage) {
          return [{
            id: `study_legacy_${Date.now()}`,
            title: 'Estudo Inicial DSD',
            savedAt: parsed.savedAt || new Date().toISOString(),
            dateFormatted: parsed.dateFormatted || new Date().toLocaleDateString('pt-BR'),
            beforeImage: parsed.beforeImage,
            afterImage: parsed.afterImage,
            selectedGoals: parsed.selectedGoals || [],
            clinicalNotes: parsed.clinicalNotes || '',
            analysisResult: parsed.analysisResult || null
          }];
        }
      }
    } catch (lsErr) {
      console.warn('Erro ao ler fallback do LocalStorage:', lsErr);
    }
  }

  return [];
}


