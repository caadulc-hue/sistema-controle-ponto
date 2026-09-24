import { supabase } from './supabase.js';
import {
    getReferenceDate,
    PUNCH_SEQUENCE,
    getNextExpectedPunchType,
    validatePunchSequence
} from './calc.js';

export {
    PUNCH_SEQUENCE,
    getNextExpectedPunchType,
    validatePunchSequence
};

const PENDING_PUNCHES_KEY = 'ponto_pending_punches';

/**
 * Obtém a fila local de batidas offline.
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
 * Salva a fila local de batidas offline.
 */
export function savePendingPunches(punches) {
    try {
        localStorage.setItem(
            PENDING_PUNCHES_KEY,
            JSON.stringify(punches)
        );
    } catch (err) {
        console.error('Erro ao salvar batidas pendentes:', err);
    }
}

/**
 * Adiciona uma nova batida à fila local.
 */
export function enqueuePunch(punch) {
    const pending = getPendingPunches();

    pending.push(punch);

    savePendingPunches(pending);
}

/**
 * Converte o tipo lógico da batida para
 * a coluna correspondente no banco.
 */
function getPunchColumn(tipo) {
    const columns = {
        entrada1: 'entrada_1',
        saida1: 'saida_1',
        entrada2: 'entrada_2',
        saida2: 'saida_2'
    };

    return columns[tipo] || null;
}

/**
 * Salva uma batida no registro diário.
 *
 * O banco utiliza uma única linha por funcionário/dia:
 *
 * entrada_1
 * saida_1
 * entrada_2
 * saida_2
 */
async function savePunchToDailyRecord(punch) {
    const column = getPunchColumn(punch.tipo);

    if (!column) {
        throw new Error(
            `Tipo de batida inválido: ${punch.tipo}`
        );
    }

    /*
     * Procura se já existe um registro daquele
     * funcionário na data de referência.
     */
    const {
        data: existingRows,
        error: findError
    } = await supabase
        .from('registros_ponto')
        .select(
            'id, entrada_1, saida_1, entrada_2, saida_2'
        )
        .eq('funcionario_id', punch.funcionario_id)
        .eq('data_referencia', punch.data_referencia)
        .limit(1);

    if (findError) {
        throw findError;
    }

    const existing = existingRows?.[0] || null;

    /*
     * PRIMEIRA BATIDA DO DIA
     *
     * Ainda não existe registro.
     * Cria uma nova linha.
     */
    if (!existing) {
        const {
            data,
            error
        } = await supabase
            .from('registros_ponto')
            .insert([
                {
                    id: punch.id,
                    funcionario_id: punch.funcionario_id,
                    data_referencia: punch.data_referencia,
                    [column]: punch.timestamp,
                    created_at: punch.created_at
                }
            ])
            .select(
                `
                id,
                funcionario_id,
                data_referencia,
                entrada_1,
                saida_1,
                entrada_2,
                saida_2,
                minutos_atraso,
                minutos_extra,
                created_at
                `
            )
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    /*
     * BATIDAS SEGUINTES
     *
     * Atualiza a mesma linha do dia.
     */
    const {
        data,
        error
    } = await supabase
        .from('registros_ponto')
        .update({
            [column]: punch.timestamp
        })
        .eq('id', existing.id)
        .select(
            `
            id,
            funcionario_id,
            data_referencia,
            entrada_1,
            saida_1,
            entrada_2,
            saida_2,
            minutos_atraso,
            minutos_extra,
            created_at
            `
        )
        .single();

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Registra uma batida.
 *
 * Se estiver online:
 *     salva diretamente no Supabase.
 *
 * Se estiver offline:
 *     salva no localStorage para sincronização posterior.
 */
export async function registerPunch({
    funcionarioId,
    tipo,
    isNightShift = false,
    shiftStartDate = null
}) {
    const now = new Date();

    const timestampIso = now.toISOString();

    /*
     * Define a data de referência.
     * Isso mantém o tratamento de jornada noturna.
     */
    const dataReferencia = getReferenceDate(
        now,
        {
            isNightShift,
            shiftStartDate
        }
    );

    /*
     * Objeto interno da batida.
     *
     * IMPORTANTE:
     * timestamp, tipo e origem NÃO são enviados
     * para a tabela registros_ponto.
     *
     * Eles são utilizados internamente pelo sistema
     * para saber qual coluna deve ser atualizada.
     */
    const punchData = {
        id:
            typeof crypto !== 'undefined' &&
            crypto.randomUUID
                ? crypto.randomUUID()
                : `offline_${Date.now()}_${Math.random()}`,

        funcionario_id: funcionarioId,

        timestamp: timestampIso,

        tipo,

        data_referencia: dataReferencia,

        origem: navigator.onLine
            ? 'quiosque'
            : 'quiosque_offline',

        created_at: timestampIso
    };

    /*
     * SEM INTERNET
     */
    if (!navigator.onLine) {
        enqueuePunch(punchData);

        return {
            success: true,
            offline: true,
            data: punchData,
            message:
                'Ponto registrado em modo offline. Será sincronizado ao reconectar.'
        };
    }

    /*
     * COM INTERNET
     */
    try {
        const data =
            await savePunchToDailyRecord(
                punchData
            );

        return {
            success: true,
            offline: false,
            data,
            message:
                'Ponto registrado com sucesso!'
        };
    } catch (error) {
        /*
         * Se o Supabase falhar, não perde a batida.
         * Guarda localmente para sincronizar depois.
         */
        console.warn(
            'Erro ao enviar ponto ao Supabase. Armazenando offline:',
            error
        );

        enqueuePunch(punchData);

        return {
            success: true,
            offline: true,
            data: punchData,
            message:
                'Ponto armazenado localmente devido a indisponibilidade de rede.'
        };
    }
}

/**
 * Sincroniza as batidas que ficaram pendentes
 * no localStorage.
 */
export async function syncPendingPunches() {
    /*
     * Sem internet não tenta sincronizar.
     */
    if (!navigator.onLine) {
        return {
            syncedCount: 0,
            totalRemaining:
                getPendingPunches().length
        };
    }

    const pending = getPendingPunches();

    /*
     * Não há nada para sincronizar.
     */
    if (pending.length === 0) {
        return {
            syncedCount: 0,
            totalRemaining: 0
        };
    }

    const remaining = [];

    let syncedCount = 0;

    /*
     * Mantém a ordem das batidas.
     */
    for (const punch of pending) {
        try {
            await savePunchToDailyRecord(
                punch
            );

            syncedCount++;
        } catch (error) {
            console.error(
                'Falha ao sincronizar registro:',
                punch.id,
                error
            );

            /*
             * Mantém a batida na fila para
             * tentar novamente depois.
             */
            remaining.push(punch);
        }
    }

    savePendingPunches(remaining);

    return {
        syncedCount,
        totalRemaining: remaining.length
    };
}

/**
 * Quando a internet voltar,
 * tenta sincronizar automaticamente.
 */
if (typeof window !== 'undefined') {
    window.addEventListener(
        'online',
        () => {
            console.log(
                'Conexão reestabelecida. Sincronizando batidas pendentes...'
            );

            syncPendingPunches();
        }
    );
}
