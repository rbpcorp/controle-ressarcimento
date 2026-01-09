
import { 
  Cliente, ClienteCreate, 
  Processo, ProcessoCreate, 
  Baixa, BaixaCreate, 
  DashboardStats 
} from '../types';

const getMockData = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setMockData = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const api = {
  resetDatabase: async () => {
    localStorage.removeItem('db_clientes');
    localStorage.removeItem('db_processos');
    localStorage.removeItem('app_data_cleaned');
    localStorage.removeItem('app_initialized');
    await new Promise(resolve => setTimeout(resolve, 100));
  },

  getClientes: async (): Promise<Cliente[]> => {
    return getMockData('db_clientes');
  },

  createCliente: async (data: ClienteCreate): Promise<Cliente> => {
    const clientes = getMockData('db_clientes');
    // Evita duplicidade por CNPJ
    const cleanCNPJ = data.cnpj.replace(/\D/g, '');
    const filtered = clientes.filter((c: Cliente) => c.cnpj.replace(/\D/g, '') !== cleanCNPJ);
    const newCliente = { ...data, cnpj: cleanCNPJ, id: Date.now() + Math.random() };
    setMockData('db_clientes', [...filtered, newCliente]);
    return newCliente;
  },

  getProcessos: async (clienteId?: number): Promise<Processo[]> => {
    const processos = getMockData('db_processos');
    const clientes = getMockData('db_clientes');
    let result = processos.map((p: any) => ({
      ...p,
      cliente: clientes.find((c: any) => c.id === p.cliente_id)
    }));
    if (clienteId) result = result.filter((p: any) => p.cliente_id === clienteId);
    return result;
  },

  createProcesso: async (data: ProcessoCreate): Promise<Processo> => {
    const processos = getMockData('db_processos');
    const newProcesso = { 
      ...data, 
      id: Date.now() + Math.random(), 
      data_criacao: new Date().toISOString().split('T')[0],
      baixas: [],
      tipo_processo: data.tipo_processo || "Pedido de Ressarcimento",
      responsabilidade_patrimonium: data.responsabilidade_patrimonium ?? true,
      percentual_honorarios: data.percentual_honorarios ?? 10
    };
    setMockData('db_processos', [newProcesso, ...processos]);
    return newProcesso;
  },

  createBaixa: async (processoId: number, data: BaixaCreate): Promise<Baixa> => {
    const processos = getMockData('db_processos');
    const newBaixa = { ...data, id: Date.now() + Math.random(), processo_id: processoId };
    const updatedProcessos = processos.map((p: any) => {
      if (p.id === processoId) {
        // Evita duplicar a mesma baixa se já houver uma idêntica (mesmo valor e data)
        const existe = (p.baixas || []).some((b: any) => b.valor === data.valor && b.data_baixa === data.data_baixa);
        if (existe) return p;
        return { ...p, baixas: [...(p.baixas || []), newBaixa] };
      }
      return p;
    });
    setMockData('db_processos', updatedProcessos);
    return newBaixa;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const processos = await api.getProcessos();
    let total_creditos_mapeados = 0;
    let total_recuperado_cliente = 0;
    let patrimonium_honorarios_recebidos = 0;
    let patrimonium_honorarios_totais = 0;

    processos.forEach((p: Processo) => {
      const perc = (p.percentual_honorarios || 10) / 100;
      total_creditos_mapeados += p.valor;
      patrimonium_honorarios_totais += (p.valor * perc);
      
      const totalBaixasDoProcesso = (p.baixas || []).reduce((acc, b) => acc + b.valor, 0);
      total_recuperado_cliente += totalBaixasDoProcesso;
      patrimonium_honorarios_recebidos += (totalBaixasDoProcesso * perc);
    });

    return {
      global: {
        total_creditos_mapeados,
        total_recuperado_cliente,
        saldo_pendente_cliente: total_creditos_mapeados - total_recuperado_cliente,
        patrimonium_honorarios_totais,
        patrimonium_honorarios_recebidos,
        patrimonium_honorarios_a_receber: patrimonium_honorarios_totais - patrimonium_honorarios_recebidos,
        taxa_sucesso: total_creditos_mapeados > 0 ? (total_recuperado_cliente / total_creditos_mapeados) * 100 : 0,
        qtd_processos: processos.length
      }
    };
  }
};
