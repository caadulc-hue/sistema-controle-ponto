import { supabase } from './supabase.js';

const EMPLOYEES_CACHE_KEY = 'ponto_cached_employees';

const FALLBACK_EMPLOYEES = [
  { id: '11111111-1111-1111-1111-111111111111', nome: 'Carlos Silva', cargo: 'Desenvolvedor Senior', status: 'ativo', saldo_minutos: 120 },
  { id: '22222222-2222-2222-2222-222222222222', nome: 'Ana Souza', cargo: 'Analista de RH', status: 'ativo', saldo_minutos: -1260 },
  { id: '33333333-3333-3333-3333-333333333333', nome: 'Roberto Lima', cargo: 'Operador de Suporte', status: 'ativo', saldo_minutos: -45 }
];

/**
 * Obtém a lista de funcionários com cache local para suporte offline
 */
export async function fetchEmployees() {
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome');

      if (!error && data && data.length > 0) {
        saveEmployeesCache(data);
        return { employees: data, fromCache: false, error: null };
      }
    } catch (err) {
      console.warn('Exceção ao carregar funcionários do Supabase:', err);
    }
  }

  // Se offline ou falha na API, tenta recuperar do cache local
  const cached = getEmployeesCache();
  if (cached && cached.length > 0) {
    return { employees: cached, fromCache: true, error: navigator.onLine ? 'Falha de conexão com servidor. Usando dados cacheados.' : 'Modo offline. Usando dados cacheados.' };
  }

  // Se nada no cache, usa os colaboradores padrão
  return { employees: FALLBACK_EMPLOYEES, fromCache: true, error: 'Usando dados locais de contingência.' };
}

function saveEmployeesCache(employees) {
  try {
    localStorage.setItem(EMPLOYEES_CACHE_KEY, JSON.stringify(employees));
  } catch (err) {
    console.error('Erro ao salvar cache de funcionários:', err);
  }
}

export function getEmployeesCache() {
  try {
    const raw = localStorage.getItem(EMPLOYEES_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Erro ao ler cache de funcionários:', err);
    return null;
  }
}
