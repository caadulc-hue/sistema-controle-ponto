import { registerPunch, syncPendingPunches, validatePunchSequence } from './ponto.js';
import { fetchEmployees } from './employees.js';

// Relógio
function updateClock() {
  const timeEl = document.getElementById('clock-time');
  const dateEl = document.getElementById('clock-date');
  if (!timeEl || !dateEl) return;

  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString('pt-BR');
  dateEl.textContent = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

let employeesList = [];
let isProcessingPunch = false;
let lastPunchTypeMap = {};

// Carregamento de Funcionários
export async function loadEmployees() {
  const select = document.getElementById('employee-select');
  if (!select) return;

  select.replaceChildren();

  const loadingOpt = document.createElement('option');
  loadingOpt.value = '';
  loadingOpt.disabled = true;
  loadingOpt.selected = true;
  loadingOpt.textContent = 'Carregando colaboradores...';
  select.appendChild(loadingOpt);

  const result = await fetchEmployees();
  employeesList = result.employees || [];

  select.replaceChildren();

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  defaultOpt.textContent = 'Selecione seu nome...';
  select.appendChild(defaultOpt);

  if (employeesList.length === 0) {
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.disabled = true;
    emptyOpt.textContent = 'Nenhum colaborador cadastrado.';
    select.appendChild(emptyOpt);
    showFeedback('Nenhum colaborador encontrado.', 'warning');
    return;
  }

  employeesList.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp.id;
    opt.textContent = `${emp.nome} - ${emp.cargo}`;
    select.appendChild(opt);
  });

  if (result.error) {
    showFeedback(result.error, 'warning');
  }
}

// Processamento de Batida
export async function handlePunch(tipo) {
  if (isProcessingPunch) return;

  const select = document.getElementById('employee-select');
  const empId = select ? select.value : '';

  if (!empId) {
    showFeedback('Por favor, selecione seu nome antes de registrar o ponto.', 'warning');
    return;
  }

  const lastPunch = lastPunchTypeMap[empId] || null;
  const seqCheck = validatePunchSequence(lastPunch, tipo);
  if (!seqCheck.valid) {
    showFeedback(`Sequência de batida inválida para este colaborador. A próxima batida esperada é: ${seqCheck.expected.toUpperCase()}`, 'warning');
  }

  setPunchingState(true);

  const selectedEmp = employeesList.find(e => e.id === empId);
  const nightCheck = document.getElementById('night-shift-check');
  const isNightShift = nightCheck ? nightCheck.checked : false;

  try {
    const result = await registerPunch({
      funcionarioId: empId,
      tipo: tipo,
      isNightShift: isNightShift
    });

    if (result.success) {
      lastPunchTypeMap[empId] = tipo;
      const msg = result.offline ? result.message : 'Ponto registrado com sucesso!';
      showFeedback(msg, result.offline ? 'warning' : 'success');
      showReceipt(selectedEmp, result.data);
    } else {
      showFeedback('Falha ao registrar o ponto.', 'error');
    }
  } catch (err) {
    showFeedback('Erro inesperado ao registrar ponto: ' + err.message, 'error');
  } finally {
    setPunchingState(false);
  }
}

function setPunchingState(disabled) {
  isProcessingPunch = disabled;
  document.querySelectorAll('.punch-btn').forEach(btn => {
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.6' : '1';
  });
  const select = document.getElementById('employee-select');
  if (select) select.disabled = disabled;
}

export function showFeedback(text, type) {
  const section = document.getElementById('feedback-message');
  const article = document.getElementById('feedback-article');
  const span = document.getElementById('feedback-text');

  if (!section || !article || !span) return;

  span.textContent = text;
  section.style.display = 'block';

  if (type === 'success') {
    article.style.borderLeft = '4px solid var(--success-color, #2e7d32)';
  } else if (type === 'warning') {
    article.style.borderLeft = '4px solid var(--warning-color, #f57c00)';
  } else {
    article.style.borderLeft = '4px solid var(--alert-color, #c62828)';
  }

  setTimeout(() => {
    section.style.display = 'none';
  }, 5000);
}

export function showReceipt(employee, punch) {
  const receiptEmpName = document.getElementById('receipt-emp-name');
  const receiptEmpId = document.getElementById('receipt-emp-id');
  const receiptTime = document.getElementById('receipt-time');
  const receiptType = document.getElementById('receipt-type');
  const receiptRefDate = document.getElementById('receipt-ref-date');
  const receiptAuth = document.getElementById('receipt-auth');
  const receiptSection = document.getElementById('receipt-section');

  if (receiptEmpName) receiptEmpName.textContent = employee ? employee.nome : 'Desconhecido';
  if (receiptEmpId) receiptEmpId.textContent = punch.funcionario_id;
  if (receiptTime) receiptTime.textContent = new Date(punch.timestamp).toLocaleString('pt-BR');
  if (receiptType) receiptType.textContent = (punch.tipo || '').toUpperCase();
  if (receiptRefDate) receiptRefDate.textContent = punch.data_referencia;
  if (receiptAuth) receiptAuth.textContent = punch.id;

  if (receiptSection) receiptSection.style.display = 'block';
}

// Inicialização do Quiosque
export function initKiosk() {
  setInterval(updateClock, 1000);
  updateClock();

  document.querySelectorAll('.punch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tipo = e.currentTarget.getAttribute('data-type');
      handlePunch(tipo);
    });
  });

  const printBtn = document.getElementById('btn-print-receipt');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  const closeReceiptBtn = document.getElementById('btn-close-receipt');
  if (closeReceiptBtn) {
    closeReceiptBtn.addEventListener('click', () => {
      const receiptSection = document.getElementById('receipt-section');
      if (receiptSection) receiptSection.style.display = 'none';
    });
  }

  loadEmployees();
  syncPendingPunches();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('Registro do Service Worker falhou:', err);
      });
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKiosk);
} else {
  initKiosk();
}
