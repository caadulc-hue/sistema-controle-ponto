import { requireAdminAuth } from './auth.js';
import { getEmployees, getPunchRecords, adjustPunchRecord, getAuditLogs } from './admin.js';
import { formatSaldo, checkCriticalLimit } from './calc.js';

let currentRecordsPage = 1;
let recordsTotalPages = 1;
let currentAuditPage = 1;
let auditTotalPages = 1;

export function updateNetworkStatus() {
  const badge = document.getElementById('network-status-badge');
  if (!badge) return;
  if (navigator.onLine) {
    badge.textContent = '● Online';
    badge.style.color = '#81c784';
  } else {
    badge.textContent = '● Offline — dados locais';
    badge.style.color = '#e57373';
  }
}

export function showNotification(message, type = 'info') {
  const el = document.getElementById('admin-notification');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';

  if (type === 'success') {
    el.style.backgroundColor = 'rgba(46, 125, 50, 0.2)';
    el.style.borderLeft = '4px solid #2e7d32';
  } else if (type === 'error') {
    el.style.backgroundColor = 'rgba(198, 40, 40, 0.2)';
    el.style.borderLeft = '4px solid #c62828';
  } else {
    el.style.backgroundColor = 'rgba(2, 136, 209, 0.2)';
    el.style.borderLeft = '4px solid #0288d1';
  }

  setTimeout(() => {
    el.style.display = 'none';
  }, 5000);
}

const tabs = {};

export function showTab(name) {
  tabs.dashboard = document.getElementById('sec-dashboard');
  tabs.registros = document.getElementById('sec-registros');
  tabs.auditoria = document.getElementById('sec-auditoria');

  Object.keys(tabs).forEach(k => {
    if (tabs[k]) {
      tabs[k].style.display = (k === name) ? 'block' : 'none';
    }
  });

  if (window.location.hash !== `#${name}`) {
    history.replaceState(null, '', `#${name}`);
  }

  if (name === 'dashboard') loadDashboard();
  if (name === 'registros') loadRecords(1);
  if (name === 'auditoria') loadAudit(1);
}

export async function loadDashboard() {
  const employees = await getEmployees();
  const tbody = document.getElementById('tbl-employees');
  const selectFilter = document.getElementById('filter-employee');

  if (!tbody || !selectFilter) return;

  tbody.replaceChildren();
  selectFilter.replaceChildren();

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Todos os Colaboradores';
  selectFilter.appendChild(defaultOpt);

  if (!employees || employees.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'Nenhum colaborador encontrado.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  employees.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp.id;
    opt.textContent = emp.nome;
    selectFilter.appendChild(opt);

    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    const strongName = document.createElement('strong');
    strongName.textContent = emp.nome || '';
    tdName.appendChild(strongName);

    const tdCargo = document.createElement('td');
    tdCargo.textContent = emp.cargo || '';

    const tdStatus = document.createElement('td');
    tdStatus.textContent = emp.status || 'ativo';

    const tdSaldo = document.createElement('td');
    const codeSaldo = document.createElement('code');
    const saldoMinutos = emp.saldo_minutos || 0;
    codeSaldo.textContent = formatSaldo(saldoMinutos);
    tdSaldo.appendChild(codeSaldo);

    const tdConf = document.createElement('td');
    const criticalInfo = checkCriticalLimit(saldoMinutos);
    const spanBadge = document.createElement('span');
    if (criticalInfo.isCritical) {
      spanBadge.className = 'status-badge status-critico';
      const icon = document.createElement('i');
      icon.setAttribute('data-lucide', 'alert-triangle');
      spanBadge.appendChild(icon);
      spanBadge.appendChild(document.createTextNode(' ALERTA CRÍTICO'));
    } else {
      spanBadge.className = 'status-badge status-normal';
      const icon = document.createElement('i');
      icon.setAttribute('data-lucide', 'check-circle');
      spanBadge.appendChild(icon);
      spanBadge.appendChild(document.createTextNode(' NORMAL'));
    }
    tdConf.appendChild(spanBadge);

    tr.appendChild(tdName);
    tr.appendChild(tdCargo);
    tr.appendChild(tdStatus);
    tr.appendChild(tdSaldo);
    tr.appendChild(tdConf);

    tbody.appendChild(tr);
  });

  if (window.lucide) window.lucide.createIcons();
}

export async function loadRecords(page = 1) {
  currentRecordsPage = page;
  const empId = document.getElementById('filter-employee')?.value || '';
  const refDate = document.getElementById('filter-date')?.value || '';
  const searchText = (document.getElementById('search-employee-text')?.value || '').trim().toLowerCase();

  const tbody = document.getElementById('tbl-records');
  if (!tbody) return;

  tbody.replaceChildren();

  const trLoading = document.createElement('tr');
  const tdLoading = document.createElement('td');
  tdLoading.colSpan = 6;
  tdLoading.textContent = 'Carregando registros...';
  trLoading.appendChild(tdLoading);
  tbody.appendChild(trLoading);

  const result = await getPunchRecords({ funcionarioId: empId, dataReferencia: refDate }, { page, limit: 10 });
  tbody.replaceChildren();

  recordsTotalPages = result.totalPages || 1;
  const pageInfo = document.getElementById('records-page-info');
  if (pageInfo) pageInfo.textContent = `Página ${result.page} de ${recordsTotalPages}`;

  const btnPrev = document.getElementById('btn-records-prev');
  const btnNext = document.getElementById('btn-records-next');
  if (btnPrev) btnPrev.disabled = (result.page <= 1);
  if (btnNext) btnNext.disabled = (result.page >= recordsTotalPages);

  let records = result.data || [];

  if (searchText) {
    records = records.filter(rec => {
      const empName = rec.funcionarios ? rec.funcionarios.nome.toLowerCase() : '';
      const empCargo = rec.funcionarios ? (rec.funcionarios.cargo || '').toLowerCase() : '';
      return empName.includes(searchText) || empCargo.includes(searchText);
    });
  }

  if (!records || records.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = 'Nenhum registro encontrado.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  records.forEach(rec => {
    const tr = document.createElement('tr');
    const empName = rec.funcionarios ? rec.funcionarios.nome : (rec.funcionario_id || 'N/A');
    const formattedTime = new Date(rec.timestamp).toLocaleString('pt-BR');

    const tdTime = document.createElement('td');
    tdTime.textContent = formattedTime;

    const tdEmp = document.createElement('td');
    const strongEmp = document.createElement('strong');
    strongEmp.textContent = empName;
    tdEmp.appendChild(strongEmp);

    const tdTipo = document.createElement('td');
    const codeTipo = document.createElement('code');
    codeTipo.textContent = (rec.tipo || '').toUpperCase();
    tdTipo.appendChild(codeTipo);

    const tdRef = document.createElement('td');
    tdRef.textContent = rec.data_referencia || '';

    const tdOrigem = document.createElement('td');
    const smallOrigem = document.createElement('small');
    smallOrigem.textContent = rec.origem || 'quiosque';
    tdOrigem.appendChild(smallOrigem);

    const tdActions = document.createElement('td');
    const btnAdjust = document.createElement('button');
    btnAdjust.type = 'button';
    btnAdjust.className = 'outline primary';
    btnAdjust.style.padding = '0.2rem 0.5rem';
    btnAdjust.style.fontSize = '0.8rem';
    btnAdjust.textContent = 'Ajustar';
    btnAdjust.addEventListener('click', () => {
      openAdjustModal(rec.id, rec.timestamp, rec.tipo);
    });
    tdActions.appendChild(btnAdjust);

    tr.appendChild(tdTime);
    tr.appendChild(tdEmp);
    tr.appendChild(tdTipo);
    tr.appendChild(tdRef);
    tr.appendChild(tdOrigem);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

export function openAdjustModal(id, currentTs, currentTipo) {
  const modalAdjust = document.getElementById('modal-adjust');
  document.getElementById('adjust-record-id').value = id;
  document.getElementById('adjust-tipo').value = currentTipo;

  const d = new Date(currentTs);
  const isoLocal = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  document.getElementById('adjust-timestamp').value = isoLocal;

  if (modalAdjust) {
    if (typeof modalAdjust.showModal === 'function') {
      modalAdjust.showModal();
    } else {
      modalAdjust.setAttribute('open', 'true');
    }
  }
}

export function closeModal() {
  const modalAdjust = document.getElementById('modal-adjust');
  if (modalAdjust) {
    if (typeof modalAdjust.close === 'function') {
      modalAdjust.close();
    } else {
      modalAdjust.removeAttribute('open');
    }
  }
  const form = document.getElementById('form-adjust');
  if (form) form.reset();
}

export async function loadAudit(page = 1) {
  currentAuditPage = page;
  const tbody = document.getElementById('tbl-audit');
  if (!tbody) return;

  tbody.replaceChildren();

  const trLoading = document.createElement('tr');
  const tdLoading = document.createElement('td');
  tdLoading.colSpan = 5;
  tdLoading.textContent = 'Carregando logs de auditoria...';
  trLoading.appendChild(tdLoading);
  tbody.appendChild(trLoading);

  const result = await getAuditLogs({ page, limit: 10 });
  tbody.replaceChildren();

  auditTotalPages = result.totalPages || 1;
  const pageInfo = document.getElementById('audit-page-info');
  if (pageInfo) pageInfo.textContent = `Página ${result.page} de ${auditTotalPages}`;

  const btnPrev = document.getElementById('btn-audit-prev');
  const btnNext = document.getElementById('btn-audit-next');
  if (btnPrev) btnPrev.disabled = (result.page <= 1);
  if (btnNext) btnNext.disabled = (result.page >= auditTotalPages);

  const logs = result.data || [];

  if (!logs || logs.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'Nenhum evento de auditoria registrado.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  logs.forEach(log => {
    const tr = document.createElement('tr');
    const formattedTime = new Date(log.created_at).toLocaleString('pt-BR');

    const tdTime = document.createElement('td');
    tdTime.textContent = formattedTime;

    const tdUser = document.createElement('td');
    tdUser.textContent = log.usuario_id || 'Gestor';

    const tdAcao = document.createElement('td');
    const codeAcao = document.createElement('code');
    codeAcao.textContent = log.acao;
    tdAcao.appendChild(codeAcao);

    const tdEntidade = document.createElement('td');
    const smallEntidade = document.createElement('small');
    smallEntidade.textContent = log.entidade_id;
    tdEntidade.appendChild(smallEntidade);

    const tdMotivo = document.createElement('td');
    tdMotivo.textContent = log.motivo;

    tr.appendChild(tdTime);
    tr.appendChild(tdUser);
    tr.appendChild(tdAcao);
    tr.appendChild(tdEntidade);
    tr.appendChild(tdMotivo);

    tbody.appendChild(tr);
  });
}

export async function initAdminPage() {
  const adminUser = await requireAdminAuth();
  if (!adminUser) return;

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();

  document.getElementById('tab-dashboard')?.addEventListener('click', (e) => { e.preventDefault(); showTab('dashboard'); });
  document.getElementById('tab-registros')?.addEventListener('click', (e) => { e.preventDefault(); showTab('registros'); });
  document.getElementById('tab-auditoria')?.addEventListener('click', (e) => { e.preventDefault(); showTab('auditoria'); });

  document.getElementById('filter-employee')?.addEventListener('change', () => loadRecords(1));
  document.getElementById('filter-date')?.addEventListener('change', () => loadRecords(1));
  document.getElementById('search-employee-text')?.addEventListener('input', () => loadRecords(1));

  document.getElementById('btn-records-prev')?.addEventListener('click', () => {
    if (currentRecordsPage > 1) loadRecords(currentRecordsPage - 1);
  });
  document.getElementById('btn-records-next')?.addEventListener('click', () => {
    if (currentRecordsPage < recordsTotalPages) loadRecords(currentRecordsPage + 1);
  });

  document.getElementById('btn-audit-prev')?.addEventListener('click', () => {
    if (currentAuditPage > 1) loadAudit(currentAuditPage - 1);
  });
  document.getElementById('btn-audit-next')?.addEventListener('click', () => {
    if (currentAuditPage < auditTotalPages) loadAudit(currentAuditPage + 1);
  });

  document.getElementById('btn-close-modal')?.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
  document.getElementById('btn-cancel-adjust')?.addEventListener('click', closeModal);

  document.getElementById('form-adjust')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('adjust-record-id').value;
    const tsLocal = document.getElementById('adjust-timestamp').value;
    const tipo = document.getElementById('adjust-tipo').value;
    const motivo = document.getElementById('adjust-motivo').value;

    if (!motivo || !motivo.trim()) {
      showNotification('A justificativa é obrigatória para registrar o ajuste.', 'error');
      return;
    }

    try {
      const isoString = new Date(tsLocal).toISOString();
      await adjustPunchRecord({
        registroId: id,
        novoTimestamp: isoString,
        novoTipo: tipo,
        motivo: motivo
      });
      showNotification('Ajuste realizado e registrado na trilha de auditoria com sucesso!', 'success');
      closeModal();
      loadRecords(currentRecordsPage);
    } catch (err) {
      showNotification('Erro ao realizar ajuste: ' + err.message, 'error');
    }
  });

  const hash = (window.location.hash || '#dashboard').replace('#', '');
  const initialTab = ['dashboard', 'registros', 'auditoria'].includes(hash) ? hash : 'dashboard';
  showTab(initialTab);

  if (window.lucide) window.lucide.createIcons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminPage);
} else {
  initAdminPage();
}
