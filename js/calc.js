/**
 * Módulo de Cálculos e Regras de Negócio do Banco de Horas e Registro de Ponto
 */

/**
 * Converte horário no formato "HH:MM" para minutos a partir da meia-noite.
 * @param {string} timeStr - Horário no formato "HH:MM"
 * @returns {number} Minutos
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + (minutes || 0);
}

/**
 * Converte minutos para string "HH:MM"
 * @param {number} totalMinutes
 * @returns {string}
 */
export function minutesToTime(totalMinutes) {
  const absMin = Math.abs(totalMinutes);
  const hours = Math.floor(absMin / 60);
  const minutes = absMin % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}`;
}

/**
 * Formata um saldo em minutos para exibição (+HH:MM, -HH:MM ou 00:00)
 * @param {number} saldoMinutos
 * @returns {string}
 */
export function formatSaldo(saldoMinutos) {
  if (saldoMinutos === 0) return '00:00';
  const sign = saldoMinutos > 0 ? '+' : '-';
  return `${sign}${minutesToTime(saldoMinutos)}`;
}

/**
 * Calcula o desvio entre o horário realizado e o esperado aplicando a margem de tolerância.
 * Se a variação for de até `toleranceMinutes` (padrão 15 min), o desvio é 0.
 * Se ultrapassar a tolerância, retorna o desvio integral.
 *
 * @param {number} actualMinutes - Minutos do horário registrado
 * @param {number} expectedMinutes - Minutos do horário previsto
 * @param {number} toleranceMinutes - Margem de tolerância em minutos (padrão 15)
 * @returns {number} Desvio integral em minutos se fora da tolerância, ou 0 se dentro.
 */
export function calculateToleranceDeviation(actualMinutes, expectedMinutes, toleranceMinutes = 15) {
  const diff = actualMinutes - expectedMinutes;
  if (Math.abs(diff) <= toleranceMinutes) {
    return 0;
  }
  return diff;
}

/**
 * Determina a data de referência de uma batida de ponto.
 * Se for turno noturno e a batida ocorrer no dia seguinte (ex: 01:00 do dia N+1),
 * a data de referência ancorada será a data civil de início do turno (dia N).
 *
 * @param {Date|string} punchDate - Data/Hora do registro
 * @param {string} shiftStartDate - Data YYYY-MM-DD do início do turno (caso seja batida subsequente do turno)
 * @returns {string} Data de referência YYYY-MM-DD
 */
/**
 * Determina a data de referência de uma batida de ponto considerando regras de turno noturno.
 * Se for marcado como turno noturno (isNightShift = true) e a batida ocorrer nas primeiras horas do dia (ex: 00:00 às 08:00),
 * a batida pertence ao turno iniciado no dia anterior (N-1).
 * Se um `shiftStartDate` explícito for fornecido, ele é priorizado.
 *
 * @param {Date|string} punchDate - Data/Hora da batida
 * @param {object} options - Opções adicionais
 * @param {boolean} options.isNightShift - Indica se o colaborador está em turno noturno
 * @param {string|null} options.shiftStartDate - Data de início do turno (YYYY-MM-DD) se informada
 * @param {number} options.nightCutoffHour - Hora limite matutina para virada de turno noturno (padrão 8, ou seja, até as 08:00)
 * @returns {string} Data de referência YYYY-MM-DD
 */
export function getReferenceDate(punchDate, options = {}) {
  const { isNightShift = false, shiftStartDate = null, nightCutoffHour = 8 } = (typeof options === 'string' ? { shiftStartDate: options } : options);

  if (shiftStartDate) {
    return shiftStartDate;
  }

  const dateObj = typeof punchDate === 'string' ? new Date(punchDate) : new Date(punchDate.getTime());
  const hours = dateObj.getHours();

  // Se for turno noturno e a batida ocorrer na madrugada (ex: 00:00 - 07:59), pertence ao dia anterior
  if (isNightShift && hours < nightCutoffHour) {
    dateObj.setDate(dateObj.getDate() - 1);
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula a duração em minutos de um intervalo de horas considerando possível virada de dia (meia-noite).
 * Exemplo: 22:00 até 06:00 -> 8 horas = 480 minutos.
 *
 * @param {string} startStr - "HH:MM"
 * @param {string} endStr - "HH:MM"
 * @returns {number} Duração em minutos
 */
export function calculateIntervalMinutes(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  let startMin = timeToMinutes(startStr);
  let endMin = timeToMinutes(endStr);

  if (endMin < startMin) {
    // Virada de dia (passou de meia-noite)
    endMin += 24 * 60;
  }
  return endMin - startMin;
}

/**
 * Calcula o saldo diário de horas trabalhadas vs jornada esperada com aplicação da tolerância.
 *
 * @param {number} totalWorkedMinutes - Total trabalhado no dia em minutos
 * @param {number} expectedMinutes - Jornada padrão esperada (ex: 480 min para 8h)
 * @param {number} toleranceMinutes - Tolerância configurada (15 min)
 * @returns {number} Saldo em minutos (positivo ou negativo)
 */
export function calculateDailyBalance(totalWorkedMinutes, expectedMinutes = 480, toleranceMinutes = 15) {
  const diff = totalWorkedMinutes - expectedMinutes;
  if (Math.abs(diff) <= toleranceMinutes) {
    return 0;
  }
  return diff;
}

/**
 * Verifica se o saldo acumulado atingiu o limite crítico.
 * Limite crítico padrão: -20 horas (-1200 minutos).
 *
 * @param {number} saldoMinutos - Saldo acumulado em minutos
 * @param {number} criticalLimitMinutes - Limite crítico em minutos (padrão -1200)
 * @returns {object} Status e flag do alerta
 */
export function checkCriticalLimit(saldoMinutos, criticalLimitMinutes = -1200) {
  const isCritical = saldoMinutos <= criticalLimitMinutes;
  return {
    isCritical,
    status: isCritical ? 'ALERTA_CRITICO' : 'NORMAL',
    limitMinutes: criticalLimitMinutes
  };
}

export const PUNCH_SEQUENCE = ['entrada1', 'saida1', 'entrada2', 'saida2'];

/**
 * Retorna a próxima batida esperada na sequência lógica
 * @param {string|null} lastType
 * @returns {string}
 */
export function getNextExpectedPunchType(lastType) {
  if (!lastType) return 'entrada1';
  const idx = PUNCH_SEQUENCE.indexOf(lastType.toLowerCase());
  if (idx === -1 || idx === PUNCH_SEQUENCE.length - 1) {
    return 'entrada1';
  }
  return PUNCH_SEQUENCE[idx + 1];
}

/**
 * Valida se a nova batida atende à sequência esperada
 * @param {string|null} lastType
 * @param {string} newType
 * @returns {object} { valid: boolean, expected: string }
 */
export function validatePunchSequence(lastType, newType) {
  if (!lastType) {
    return { valid: newType === 'entrada1', expected: 'entrada1' };
  }
  const expected = getNextExpectedPunchType(lastType);
  return { valid: newType === expected, expected };
}
