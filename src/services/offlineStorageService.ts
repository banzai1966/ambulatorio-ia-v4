// Serviço de Armazenamento Local e Sincronização Offline do Ambulatório IA
import { SupabaseClient } from '@supabase/supabase-js';

export interface OfflineRecord {
  offline_id: string;
  saved_at: string;
  is_offline_pending: boolean;
  id?: string;
  medico_id?: string;
  user_id?: string;
  profissional_responsavel?: string;
  paciente_nome_completo: string;
  paciente_cpf?: string;
  paciente_data_nascimento?: string;
  especialidade: string;
  paciente_status: string;
  paciente_telefone?: string;
  queixa_principal?: string;
  exame_fisico?: string;
  hipotese_diagnostica?: string;
  conduta_plano_terapeutico?: string;
  prescricao?: string;
  resumo_formatado: string;
  sugestao_conduta: string;
  dados_clinicos?: any;
  exame_neurologico?: any;
  checklist_integrativo?: any;
  dados_especialidade?: any;
  mapeamento_corporal?: any;
  vitals?: any;
  data_consulta?: string;
  created_at?: string;
}

const STORAGE_KEY = 'AMBULATORIO_OFFLINE_RECORDS';
const LOCAL_PATIENTS_CACHE = 'AMBULATORIO_PATIENTS_CACHE';

/**
 * Obtém a lista de prontuários salvos localmente
 */
export function getOfflineRecords(): OfflineRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('[OfflineStorage] Erro ao carregar registros locais:', err);
    return [];
  }
}

/**
 * Salva um novo prontuário localmente no computador
 */
export function saveRecordLocally(recordData: Partial<OfflineRecord>): OfflineRecord {
  const records = getOfflineRecords();
  
  const offlineId = `OFFLINE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newOfflineRecord: OfflineRecord = {
    ...recordData,
    offline_id: offlineId,
    saved_at: now,
    is_offline_pending: true,
    created_at: recordData.created_at || now,
    data_consulta: recordData.data_consulta || now.split('T')[0],
    paciente_nome_completo: recordData.paciente_nome_completo || 'Paciente Offline',
    especialidade: recordData.especialidade || 'Geral',
    paciente_status: recordData.paciente_status || 'Ativo',
    resumo_formatado: recordData.resumo_formatado || '',
    sugestao_conduta: recordData.sugestao_conduta || ''
  };

  // Prepend para aparecer em primeiro no histórico
  records.unshift(newOfflineRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  
  console.log('[OfflineStorage] Prontuário salvo localmente com sucesso:', offlineId);
  return newOfflineRecord;
}

/**
 * Remove ou marca como sincronizado um registro local
 */
export function removeOfflineRecord(offlineId: string) {
  try {
    const records = getOfflineRecords();
    const updated = records.filter(r => r.offline_id !== offlineId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[OfflineStorage] Erro ao remover registro local:', err);
  }
}

/**
 * Realiza a sincronização automática de registros pendentes com a Nuvem (Supabase)
 */
export async function syncOfflineRecordsWithCloud(supabase: SupabaseClient): Promise<{ syncedCount: number; errorsCount: number }> {
  if (!navigator.onLine) {
    console.log('[OfflineStorage] Dispositivo offline. Sincronização ignorada.');
    return { syncedCount: 0, errorsCount: 0 };
  }

  const records = getOfflineRecords();
  const pending = records.filter(r => r.is_offline_pending);

  if (pending.length === 0) {
    return { syncedCount: 0, errorsCount: 0 };
  }

  console.log(`[OfflineStorage] Iniciando sincronização de ${pending.length} registros offline...`);
  let syncedCount = 0;
  let errorsCount = 0;

  const EXPLICIT_ALLOWED_COLUMNS = [
    'medico_id', 'user_id', 'profissional_responsavel', 'paciente_nome_completo', 
    'paciente_cpf', 'paciente_data_nascimento', 'especialidade', 'paciente_status', 
    'paciente_telefone', 'queixa_principal', 'hipotese_diagnostica', 
    'conduta_plano_terapeutico', 'prescricao', 'resumo_formatado', 
    'sugestao_conduta', 'dados_clinicos', 'data_consulta', 'created_at',
    'exame_neurologico', 'exame_fisico', 'checklist_integrativo', 'dados_especialidade'
  ];

  for (const rec of pending) {
    try {
      const payload: any = {};
      EXPLICIT_ALLOWED_COLUMNS.forEach(col => {
        if ((rec as any)[col] !== undefined && (rec as any)[col] !== null) {
          payload[col] = (rec as any)[col];
        }
      });

      // Mapeamento de dores e vitais dentro de dados_especialidade
      if (rec.mapeamento_corporal) {
        payload.dados_especialidade = payload.dados_especialidade || {};
        payload.dados_especialidade.mapeamento_corporal = rec.mapeamento_corporal;
      }
      if (rec.vitals) {
        payload.dados_especialidade = payload.dados_especialidade || {};
        payload.dados_especialidade.vitals = rec.vitals;
      }

      const { error } = await supabase.from('prontuarios').insert(payload);

      if (!error) {
        syncedCount++;
        removeOfflineRecord(rec.offline_id);
      } else {
        console.error('[OfflineStorage] Falha ao sincronizar registro:', rec.offline_id, error);
        errorsCount++;
      }
    } catch (err) {
      console.error('[OfflineStorage] Exceção ao sincronizar:', err);
      errorsCount++;
    }
  }

  console.log(`[OfflineStorage] Sincronização concluída: ${syncedCount} sincronizados, ${errorsCount} erros.`);
  return { syncedCount, errorsCount };
}

/**
 * Exporta todo o banco de dados e registros para um arquivo JSON local no computador
 */
export function exportLocalDataJSON(records: any[]) {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `BACKUP_AMBULATORIO_IA_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('[OfflineStorage] Erro ao exportar backup local:', err);
  }
}

/**
 * Restaura e importa registros de um arquivo JSON backup
 */
export function importLocalDataJSON(fileContent: string): OfflineRecord[] {
  try {
    const parsed = JSON.parse(fileContent);
    if (!Array.isArray(parsed)) {
      throw new Error('Formato de backup inválido. Esperado um array de prontuários.');
    }
    const currentOffline = getOfflineRecords();
    const merged = [...parsed, ...currentOffline];
    
    // Remove duplicatas por ID ou nome+data
    const uniqueMap = new Map();
    merged.forEach(item => {
      const key = item.id || item.offline_id || `${item.paciente_nome_completo}_${item.data_consulta}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    const result = Array.from(uniqueMap.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('[OfflineStorage] Erro ao importar backup local:', err);
    throw err;
  }
}

/**
 * Importa pacientes/prontuários a partir de uma planilha CSV (Excel)
 */
export function importLocalDataCSV(csvText: string): OfflineRecord[] {
  try {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('O arquivo CSV deve conter ao menos um cabeçalho e uma linha de dados.');
    }

    // Identificar separador (, ou ;)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));

    const findIndex = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const idxName = findIndex(['nome', 'paciente', 'cliente']);
    const idxCPF = findIndex(['cpf', 'documento']);
    const idxDOB = findIndex(['nascimento', 'dob', 'data_nasc', 'data nascimento']);
    const idxPhone = findIndex(['telefone', 'celular', 'phone', 'whatsapp']);
    const idxDate = findIndex(['data', 'consulta', 'atendimento']);
    const idxNotes = findIndex(['obs', 'observacao', 'queixa', 'historico', 'anotacao']);

    const currentOffline = getOfflineRecords();
    const newRecords: OfflineRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Regex para separar por vírgula/ponto e vírgula respeitando aspas
      const values = line.split(new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`)).map(v => v.trim().replace(/^"|"$/g, ''));

      const name = idxName !== -1 && values[idxName] ? values[idxName] : `Paciente Importado ${i}`;
      const cpf = idxCPF !== -1 && values[idxCPF] ? values[idxCPF] : '';
      const dob = idxDOB !== -1 && values[idxDOB] ? values[idxDOB] : '';
      const phone = idxPhone !== -1 && values[idxPhone] ? values[idxPhone] : '';
      const date = idxDate !== -1 && values[idxDate] ? values[idxDate] : new Date().toISOString().split('T')[0];
      const notes = idxNotes !== -1 && values[idxNotes] ? values[idxNotes] : 'Cadastro importado via planilha CSV/Excel';

      const record: OfflineRecord = {
        id: `imp_csv_${Date.now()}_${i}`,
        paciente_nome_completo: name,
        paciente_cpf: cpf,
        paciente_data_nascimento: dob,
        paciente_telefone: phone,
        data_consulta: date,
        especialidade: 'integrativa',
        queixa_principal: notes,
        status: 'estavel',
        medico_responsavel: 'Médico de Atendimento'
      };

      newRecords.push(record);
    }

    const merged = [...newRecords, ...currentOffline];
    const uniqueMap = new Map();
    merged.forEach(item => {
      const key = item.id || `${item.paciente_nome_completo}_${item.data_consulta}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    const result = Array.from(uniqueMap.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('[OfflineStorage] Erro ao importar CSV:', err);
    throw err;
  }
}

