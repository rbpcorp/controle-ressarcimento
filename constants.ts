import { TaxType, EntryStatus, RegimeTributario } from './types';

export const TAX_LABELS: Record<TaxType, string> = {
  [TaxType.ICMS_ST]: 'ICMS ST',
  [TaxType.IPI]: 'IPI',
  [TaxType.PIS_COFINS]: 'PIS/COFINS',
  [TaxType.ISS]: 'ISS'
};

export const REGIME_LABELS: Record<RegimeTributario, string> = {
  [RegimeTributario.SIMPLES]: 'Simples Nacional',
  [RegimeTributario.LUCRO_PRESUMIDO]: 'Lucro Presumido',
  [RegimeTributario.LUCRO_REAL]: 'Lucro Real'
};

export const STATUS_LABELS: Record<EntryStatus, string> = {
  [EntryStatus.PENDING]: 'Pendente',
  [EntryStatus.APPROVED]: 'Aprovado',
  [EntryStatus.COMPLETED]: 'Baixado',
  [EntryStatus.REJECTED]: 'Rejeitado'
};

export const STATUS_COLORS: Record<EntryStatus, string> = {
  [EntryStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [EntryStatus.APPROVED]: 'bg-blue-100 text-blue-800',
  [EntryStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [EntryStatus.REJECTED]: 'bg-red-100 text-red-800'
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};