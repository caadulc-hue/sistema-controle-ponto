import { supabase } from './supabase.js';
import { fetchEmployees } from './employees.js';
import { getCurrentUser } from './auth.js';

/**
 * Busca a lista de funcionários do banco de dados utilizando o serviço centralizado
 */
export async function getEmployees() {
  const result = await fetchEmployees();
  return result.employees;
}

/**
 * Busca os registros de ponto com opção de filtros
 */
export async function getPunchRecords(filters = {}, pagination = { page: 1, limit: 10 }) {
  try {
    let query = supabase.from('registros_ponto').select('*, funcionarios(nome, cargo)', { count: 'exact' }).order('timestamp', { ascending: false });

    if (filters.funcionarioId) {
      query = query.eq('funcionario_id', filters.funcionarioId);
    }
    if (filters.dataReferencia) {
      query = query.eq('data_referencia', filters.dataReferencia);
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      console.error('Erro ao buscar registros:', error);
      return { data: [], count: 0, page, limit, totalPages: 1 };
    }
    const totalCount = count !== null ? count : (data ? data.length : 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return {
      data: data || [],
      count: totalCount,
      page,
      limit,
      totalPages
    };
  } catch (err) {
    console.error('Exceção ao buscar registros:', err);
    return { data: [], count: 0, page: 1, limit: 10, totalPages: 1 };
  }
}

/**
 * Realiza ajuste retroativo de um registro com justificativa obrigatória e gera log de auditoria
 */
export async function adjustPunchRecord({ registroId, novoTimestamp, novoTipo, motivo, usuarioResponsavelId = null }) {
  if (!motivo || motivo.trim().length === 0) {
    throw new Error('Justificativa é obrigatória para ajustes retroativos.');
  }

  // Obter usuário autenticado
  if (!usuarioResponsavelId) {
    const activeUser = await getCurrentUser();
    usuarioResponsavelId = activeUser ? (activeUser.email || activeUser.id) : 'gestor_autenticado';
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
export async function getAuditLogs(pagination = { page: 1, limit: 10 }) {
  try {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('auditoria')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar auditoria:', error);
      return { data: [], count: 0, page, limit, totalPages: 1 };
    }

    const totalCount = count !== null ? count : (data ? data.length : 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return {
      data: data || [],
      count: totalCount,
      page,
      limit,
      totalPages
    };
  } catch (err) {
    console.error('Exceção ao buscar auditoria:', err);
    return { data: [], count: 0, page: 1, limit: 10, totalPages: 1 };
  }
}
