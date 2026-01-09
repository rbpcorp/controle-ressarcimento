
// Enums baseados na documentação
export enum TipoBaixa {
  CONTA_CORRENTE = 'CONTA CORRENTE',
  COMPENSACAO = 'COMPENSACAO'
}

export enum RegimeTributario {
  SIMPLES = 'Simples Nacional',
  LUCRO_PRESUMIDO = 'Lucro Presumido',
  LUCRO_REAL = 'Lucro Real'
}

export enum TaxType {
  ICMS_ST = 'ICMS_ST',
  IPI = 'IPI',
  PIS_COFINS = 'PIS_COFINS',
  ISS = 'ISS'
}

export enum EntryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export interface Cliente {
  id: number;
  razao_social: string;
  cnpj: string;
  contrato_inicio: string; 
  percentual_honorarios: number;
}

export interface ClienteCreate {
  razao_social: string;
  cnpj: string;
  contrato_inicio: string;
  percentual_honorarios: number;
}

export interface Baixa {
  id: number;
  processo_id: number;
  tipo: TipoBaixa;
  tributo_compensado?: string;
  valor: number;
  data_baixa: string; 
}

export interface BaixaCreate {
  tipo: TipoBaixa;
  tributo_compensado?: string;
  valor: number;
  data_baixa: string;
}

export interface Processo {
  id: number;
  cliente_id: number;
  cliente?: Cliente; 
  tipo_processo: string; 
  responsabilidade_patrimonium: boolean;
  percentual_honorarios: number;
  trimestre: string;
  ano: number;
  regime_tributario: string;
  valor: number;
  data_lancamento_rfb: string;
  data_criacao: string;
  baixas: Baixa[]; 
}

export interface ProcessoCreate {
  cliente_id: number;
  tipo_processo?: string;
  responsabilidade_patrimonium?: boolean;
  percentual_honorarios?: number;
  trimestre: string;
  ano: number;
  regime_tributario: string;
  valor: number;
  data_lancamento_rfb: string;
}

export interface DashboardStats {
  global: {
    total_creditos_mapeados: number;
    total_recuperado_cliente: number;
    saldo_pendente_cliente: number;
    
    patrimonium_honorarios_totais: number;
    patrimonium_honorarios_recebidos: number;
    patrimonium_honorarios_a_receber: number;
    
    taxa_sucesso: number;
    qtd_processos: number;
  };
}
