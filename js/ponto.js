import { supabase } from './supabase.js';
import { getReferenceDate } from './calc.js';

const PENDING_PUNCHES_KEY = 'ponto_pending_punches';

/**
 * Obtém a fila local de batidas offline
 */
export function getPendingPunches() {
  try {
    const raw = localStorage.getItem(PENDING_PUNCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Erro ao ler batidas pendentes:', err);
    return [];
  }
}

/**
 * Salva a fila local de batidas offline
 */
export function savePendingPunches(punches) {
  try {
    localStorage.setItem(PENDING_PUNCHES_KEY, JSON.stringify(punches));
  } catch (err) {
    console.error('Erro ao salvar batidas pendentes:', err);
  }
}

/**
 * Adiciona uma nova batida à fila local offline
 */
export function enqueuePunch(punch) {
  const pending = getPendingPunches();
  pending.push(punch);
  savePendingPunches(pending);
}

/**
 * Tenta registrar um ponto (enviando diretamente se online, ou salvando localmente se offline)
 */
export async function registerPunch({ funcionarioId, tipo, isNightShiftOvernight = false, shiftStartDate = null }) {
  const now = new Date();
  const timestampIso = now.toISOString();

  // Ancoragem da data de referência
  const dataReferencia = getReferenceDate(now, shiftStartDate);

  const punchData = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `offline_${Date.now()}_${Math.random()}`,
    funcionario_id: funcionarioId,
    timestamp: timestampIso,
    tipo: tipo, // 'entrada1' | 'saida1' | 'entrada2' | 'saida2'
    data_referencia: dataReferencia,
    origem: navigator.onLine ? 'quiosque' : 'quiosque_offline',
    created_at: timestampIso
  };

  if (!navigator.onLine) {
    enqueuePunch(punchData);
    return {
      success: true,
      offline: true,
      data: punchData,
      message: 'Ponto registrado em modo offline. Será sincronizado ao reconectar.'
    };
  }

  try {
    const { data, error } = await supabase
      .from('registros_ponto')
      .insert([{
        id: punchData.id,
        funcionario_id: punchData.funcionario_id,
        timestamp: punchData.timestamp,
        tipo: punchData.tipo,
        data_referencia: punchData.data_referencia,
        origem: punchData.origem
      }])
      .select();

    if (error) {
      console.warn('Erro ao enviar ponto ao Supabase. Armazenando offline:', error);
      enqueuePunch(punchData);
      return {
        success: true,
        offline: true,
        data: punchData,
        message: 'Ponto armazenado localmente devido a indisponibilidade de rede.'
      };
    }

    return {
      success: true,
      offline: false,
      data: data[0] || punchData,
      message: 'Ponto registrado com sucesso!'
    };
  } catch (err) {
    console.warn('Exceção na chamada do Supabase. Armazenando offline:', err);
    enqueuePunch(punchData);
    return {
      success: true,
      offline: true,
      data: punchData,
      message: 'Ponto armazenado localmente para posterior sincronização.'
    };
  }
}

/**
 * Tenta sincronizar registros pendentes do localStorage com o banco de dados Supabase
 */
export async function syncPendingPunches() {
  if (!navigator.onLine) return { syncedCount: 0, totalRemaining: getPendingPunches().length };

  const pending = getPendingPunches();
  if (pending.length === 0) return { syncedCount: 0, totalRemaining: 0 };

  const remaining = [];
  let syncedCount = 0;

  for (const punch of pending) {
    try {
      const { error } = await supabase
        .from('registros_ponto')
        .insert([{
          id: punch.id,
          funcionario_id: punch.funcionario_id,
          timestamp: punch.timestamp,
          tipo: punch.tipo,
          data_referencia: punch.data_referencia,
          origem: 'quiosque_sincronizado'
        }]);

      if (error) {
        console.error('Falha ao sincronizar registro:', punch.id, error);
        remaining.push(punch);
      } else {
        syncedCount++;
      }
    } catch (err) {
      console.error('Exceção ao sincronizar registro:', punch.id, err);
      remaining.push(punch);
    }
  }

  savePendingPunches(remaining);
  return {
    syncedCount,
    totalRemaining: remaining.length
  };
}

// Configurar listener automático de reconexão
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Conexão reestabelecida. Sincronizando batidas pendentes...');
    syncPendingPunches();
  });
}
