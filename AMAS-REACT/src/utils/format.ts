import type { StatusEvento } from '@/types';

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_EXT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function formatDataPublica(iso?: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  const monthIndex = Math.max(0, parseInt(month, 10) - 1);
  return `${day} de ${MESES_EXT[monthIndex]} de ${year}`;
}

export function formatDataCurta(iso?: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export function mesAbrev(month?: string): string {
  if (!month) return '--';
  return MESES_ABREV[Math.max(0, parseInt(month, 10) - 1)];
}

export interface Countdown {
  txt: string;
  cls: 'enc' | 'embreve' | 'realizado' | 'hoje' | 'breve' | 'futuro';
}

export function diasRestantes(iso: string, statusEvento?: StatusEvento): Countdown {
  const diff = (new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86400000;
  if (statusEvento === 'Encerrado') return { txt: 'Encerrado', cls: 'enc' };
  if (statusEvento === 'Em Breve') return { txt: 'Em breve', cls: 'embreve' };
  if (statusEvento === 'Cancelado') return { txt: 'Cancelado', cls: 'enc' };
  if (diff < -1) return { txt: 'Realizado', cls: 'realizado' };
  if (diff < 1) return { txt: 'Hoje!', cls: 'hoje' };
  if (diff < 2) return { txt: 'Amanhã', cls: 'breve' };
  return { txt: `Em ${Math.ceil(diff)} dias`, cls: diff < 8 ? 'breve' : 'futuro' };
}

export function formatMoney(v: number | string): string {
  return parseFloat(String(v || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
