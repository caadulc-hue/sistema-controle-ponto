import { supabase } from './supabase.js';
import { formatSaldo, checkCriticalLimit } from './calc.js';

/**
 * Busca a lista de funcionários do banco de dados (ou fallback offline)
 */
export async function getEmployees() {
  try {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('nome');

    if (error || !data) {
      console.warn('Erro ou offline ao buscar funcionários:', error);
      return getFallbackEmployees();
    }
    return data;
  } catch (err) {
    console.warn('Exceção ao carregar funcionários:', err);
    return getFallbackEmployees();
  }
}

function getFallbackEmployees() {
  return [
    { id: '11111111-1111-1111-1111-111111111111', nome: 'Carlos Silva', cargo: 'Desenvolvedor Senior', status: 'ativo', saldo_minutos: 120 },
    { id: '22222222-2222-2222-2222-222222222222', nome: 'Ana Souza', cargo: 'Analista de RH', status: 'ativo', saldo_minutos: -1260 },
    { id: '33333333-3333-3333-3333-333333333333', nome: 'Roberto Lima', cargo: 'Operador de Suporte', status: 'ativo', saldo_minutos: -45 }
  ];
}

/**
 * Busca os registros de ponto com opção de filtros
 */
export async function getPunchRecords(filters = {}) {
  try {
    let query = supabase.from('registros_ponto').select('*, funcionarios(nome, cargo)').order('timestamp', { ascending: false });

    if (filters.funcionarioId) {
      query = query.eq('funcionario_id', filters.funcionarioId);
    }
    if (filters.dataReferencia) {
      query = query.eq('data_referencia', filters.dataReferencia);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar registros:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Exceção ao buscar registros:', err);
    return [];
  }
}

/**
 * Realiza ajuste retroativo de um registro com justificativa obrigatória e gera log de auditoria
 */
export async function adjustPunchRecord({ registroId, novoTimestamp, novoTipo, motivo, usuarioResponsavelId = 'admin-user' }) {
  if (!motivo || motivo.trim().length === 0) {
    throw new Error('Justificativa é obrigatória para ajustes retroativos.');
  }

  // 1. Obter valor anterior para auditoria
  const { data: currentRecords, error: fetchErr } = await supabase
    .from('registros_ponto')
    .select('*')
    .eq('id', registroId);

  if (fetchErr || !currentRecords || currentRecords.length === 0) {
    throw new Error('Registro original não encontrado.');
  }

  const recordOriginal = currentRecords[0];

  // 2. Atualizar registro
  const { data: updated, error: updateErr } = await supabase
    .from('registros_ponto')
    .update({
      timestamp: novoTimestamp || recordOriginal.timestamp,
      tipo: novoTipo || recordOriginal.tipo
    })
    .eq('id', registroId)
    .select();

  if (updateErr) {
    throw new Error('Falha ao atualizar registro de ponto: ' + updateErr.message);
  }

  // 3. Inserir na trilha de auditoria
  const { error: auditErr } = await supabase
    .from('auditoria')
    .insert([{
      usuario_id: usuarioResponsavelId,
      acao: 'AJUSTE_RETROATIVO_PONTO',
      entidade: 'registros_ponto',
      entidade_id: registroId,
      valor_anterior: JSON.stringify(recordOriginal),
      valor_novo: JSON.stringify(updated[0]),
      motivo: motivo.trim()
    }]);

  if (auditErr) {
    console.warn('Registro atualizado, porém houve falha na gravação do log de auditoria:', auditErr);
  }

  return updated[0];
}

/**
 * Busca logs da trilha de auditoria
 */
export async function getAuditLogs() {
  try {
    const { data, error } = await supabase
      .from('auditoria')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar auditoria:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Exceção ao buscar auditoria:', err);
    return [];
  }
}
