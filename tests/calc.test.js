import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  minutesToTime,
  formatSaldo,
  calculateToleranceDeviation,
  getReferenceDate,
  calculateIntervalMinutes,
  calculateDailyBalance,
  checkCriticalLimit
} from '../js/calc.js';

test('timeToMinutes & minutesToTime conversions', () => {
  assert.equal(timeToMinutes('08:00'), 480);
  assert.equal(timeToMinutes('17:30'), 1050);
  assert.equal(timeToMinutes('00:00'), 0);

  assert.equal(minutesToTime(480), '08:00');
  assert.equal(minutesToTime(1050), '17:30');
  assert.equal(minutesToTime(0), '00:00');
});

test('formatSaldo formatting', () => {
  assert.equal(formatSaldo(0), '00:00');
  assert.equal(formatSaldo(90), '+01:30');
  assert.equal(formatSaldo(-120), '-02:00');
  assert.equal(formatSaldo(-1200), '-20:00');
});

test('Tolerância de 15 minutos', () => {
  // Horário previsto: 08:00 (480 min)
  const expected = 480;

  // 08:10 -> +10 min (dentro da tolerância -> desvio 0)
  assert.equal(calculateToleranceDeviation(timeToMinutes('08:10'), expected, 15), 0);

  // 08:15 -> +15 min (limite da tolerância -> desvio 0)
  assert.equal(calculateToleranceDeviation(timeToMinutes('08:15'), expected, 15), 0);

  // 08:16 -> +16 min (ultrapassou tolerância -> desvio integral +16)
  assert.equal(calculateToleranceDeviation(timeToMinutes('08:16'), expected, 15), 16);

  // 07:45 -> -15 min (dentro da tolerância -> desvio 0)
  assert.equal(calculateToleranceDeviation(timeToMinutes('07:45'), expected, 15), 0);

  // 07:44 -> -16 min (ultrapassou tolerância -> desvio integral -16)
  assert.equal(calculateToleranceDeviation(timeToMinutes('07:44'), expected, 15), -16);
});

test('Turnos Noturnos e Virada de Dia', () => {
  // Duração de 22:00 até 06:00 do dia seguinte (8h = 480 min)
  assert.equal(calculateIntervalMinutes('22:00', '06:00'), 480);

  // Ancoragem de data de referência para turno noturno
  const shiftStart = '2026-09-22';
  const punchDate = new Date('2026-09-23T06:00:00');
  assert.equal(getReferenceDate(punchDate, shiftStart), '2026-09-22');
});

test('Cálculo de saldo diário com tolerância', () => {
  // Jornada esperada 8h (480 min)
  // Trabalhado 8h10m (490 min) -> variação +10 min <= 15 min -> Saldo 0
  assert.equal(calculateDailyBalance(490, 480, 15), 0);

  // Trabalhado 8h20m (500 min) -> variação +20 min > 15 min -> Saldo +20
  assert.equal(calculateDailyBalance(500, 480, 15), 20);

  // Trabalhado 7h30m (450 min) -> variação -30 min > 15 min -> Saldo -30
  assert.equal(calculateDailyBalance(450, 480, 15), -30);
});

test('Limite Crítico (-20:00 horas / -1200 minutos)', () => {
  // Saldo de -15h (-900 min) -> NORMAL
  assert.deepEqual(checkCriticalLimit(-900), {
    isCritical: false,
    status: 'NORMAL',
    limitMinutes: -1200
  });

  // Saldo de -20h (-1200 min) -> ALERTA_CRITICO
  assert.deepEqual(checkCriticalLimit(-1200), {
    isCritical: true,
    status: 'ALERTA_CRITICO',
    limitMinutes: -1200
  });

  // Saldo de -21h (-1260 min) -> ALERTA_CRITICO
  assert.deepEqual(checkCriticalLimit(-1260), {
    isCritical: true,
    status: 'ALERTA_CRITICO',
    limitMinutes: -1200
  });
});
