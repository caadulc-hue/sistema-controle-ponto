import { supabase } from './supabase.js';

/**
 * Obtém a sessão do usuário atualmente autenticado
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Erro ao verificar sessão:', error);
      return null;
    }
    return session;
  } catch (err) {
    console.warn('Exceção ao obter sessão:', err);
    return null;
  }
}

/**
 * Obtém o usuário atualmente autenticado
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session ? session.user : null;
}

/**
 * Verifica se o usuário atual possui privilégios de administrador
 * Checa a tabela ou metadata do usuário/perfil
 */
export async function isUserAdmin(user) {
  if (!user) return false;

  // 1. Verificar role / app_metadata
  if (user.app_metadata && (user.app_metadata.role === 'admin' || user.app_metadata.is_admin === true)) {
    return true;
  }

  // 2. Verificar user_metadata
  if (user.user_metadata && (user.user_metadata.role === 'admin' || user.user_metadata.is_admin === true)) {
    return true;
  }

  // 3. Consultar perfil do usuário no Supabase
  try {
    const { data, error } = await supabase
      .from('perfis')
      .select('role, is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      if (data.role === 'admin' || data.is_admin === true) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Exceção ao verificar perfil do usuário no banco:', err);
  }

  return false;
}

/**
 * Guard de autenticação para páginas administrativas.
 * Se o usuário não for administrador válido, redireciona para a página inicial.
 */
export async function requireAdminAuth(redirectTo = 'index.html') {
  const user = await getCurrentUser();
  const isAdmin = await isUserAdmin(user);

  if (!isAdmin) {
    console.warn('Acesso negado: usuário não autorizado.');
    window.location.href = redirectTo;
    return null;
  }

  return user;
}
