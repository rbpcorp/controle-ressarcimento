
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, CheckCircle, Wallet, ListFilter, TrendingDown, TrendingUp } from 'lucide-react';
import { Processo, TipoBaixa } from '../types';
import { formatCurrency } from '../constants';
import { api } from '../services/api';

interface SettlementProps {
  entries?: Processo[];
  onUpdate?: () => void;
}

type StatusFilterType = 'ABERTO' | 'BAIXADO' | 'TODOS';

export const Settlement: React.FC<SettlementProps> = () => {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ABERTO');
  
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal Inputs
  const [baixaType, setBaixaType] = useState<TipoBaixa>(TipoBaixa.CONTA_CORRENTE);
  const [valorBaixa, setValorBaixa] = useState('');
  const [tributoCompensado, setTributoCompensado] = useState('');
  const [dataBaixa, setDataBaixa] = useState(new Date().toISOString().split('T')[0]);

  const tributosOpcoes = [
    'Pis', 'Cofins', 'IRPJ', 'CSLL', 'IPI', 'INSS', 'CRF', 'IRRF'
  ];

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await api.getProcessos();
      setProcessos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Helpers to calculate totals and status
  const getProcessoTotals = (p: Processo) => {
    const totalBaixado = (p.baixas || []).reduce((acc, b) => acc + b.valor, 0);
    const saldo = p.valor - totalBaixado;
    const isCompleted = saldo <= 0.01;
    return { totalBaixado, saldo, isCompleted };
  };

  const filteredProcessos = useMemo(() => {
    return processos.filter(p => {
      const { isCompleted } = getProcessoTotals(p);
      const matchesSearch = 
        p.cliente?.razao_social.toLowerCase().includes(filterText.toLowerCase()) ||
        p.tipo_processo.toLowerCase().includes(filterText.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'TODOS' || 
        (statusFilter === 'ABERTO' && !isCompleted) || 
        (statusFilter === 'BAIXADO' && isCompleted);

      return matchesSearch && matchesStatus;
    });
  }, [processos, filterText, statusFilter]);

  // Totals for the summary section based on filtered data
  const filteredSummary = useMemo(() => {
    return filteredProcessos.reduce((acc, p) => {
      const { totalBaixado, saldo } = getProcessoTotals(p);
      acc.totalBaixado += totalBaixado;
      acc.totalAberto += saldo;
      return acc;
    }, { totalBaixado: 0, totalAberto: 0 });
  }, [filteredProcessos]);

  const handleOpenSettle = (p: Processo) => {
    const { saldo } = getProcessoTotals(p);
    setSelectedProcesso(p);
    setValorBaixa(saldo > 0 ? saldo.toString() : '');
    setBaixaType(TipoBaixa.CONTA_CORRENTE);
    setTributoCompensado('');
    setIsModalOpen(true);
  };

  const handleConfirmSettle = async () => {
    if (!selectedProcesso || !valorBaixa) return;
    if (baixaType === TipoBaixa.COMPENSACAO && !tributoCompensado) {
      alert("Por favor, selecione o tributo compensado.");
      return;
    }

    try {
      await api.createBaixa(selectedProcesso.id, {
        tipo: baixaType,
        valor: Number(valorBaixa),
        data_baixa: dataBaixa,
        tributo_compensado: baixaType === TipoBaixa.COMPENSACAO ? tributoCompensado : undefined
      });
      setIsModalOpen(false);
      refreshData();
    } catch (e) {
      alert("Erro ao realizar baixa");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-2xl font-bold text-[#E2E8F0] font-roboto-slab">Baixas</h1>
          <p className="text-sm text-[#94A3B8] mt-1 font-medium">Controle de recebimentos e compensações tributárias</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Status Segmented Control */}
          <div className="flex p-1 bg-[#0F172A] rounded-lg border border-[#2D3748] w-full md:w-auto">
            {(['ABERTO', 'BAIXADO', 'TODOS'] as StatusFilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setStatusFilter(type)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
                  statusFilter === type 
                    ? 'bg-[#1A3375] text-white shadow-lg' 
                    : 'text-[#94A3B8] hover:text-[#61CE70]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input 
                type="text" 
                placeholder="Buscar cliente ou processo..." 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-10 pr-4 py-2.5 neu-pressed text-sm w-full md:w-64 text-[#E2E8F0] bg-[#0F172A]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resumo dos Dados Filtrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="neu-flat p-4 bg-[#151E32] flex items-center justify-between border-l-4 border-[#61CE70]">
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Baixado (Filtro)</p>
            <h4 className="text-xl font-bold text-[#61CE70] font-roboto-slab mt-1">
              {formatCurrency(filteredSummary.totalBaixado)}
            </h4>
          </div>
          <div className="w-10 h-10 bg-[#064E3B] rounded flex items-center justify-center text-[#61CE70]">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="neu-flat p-4 bg-[#151E32] flex items-center justify-between border-l-4 border-[#FBBF24]">
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total em Aberto (Filtro)</p>
            <h4 className="text-xl font-bold text-[#FBBF24] font-roboto-slab mt-1">
              {formatCurrency(filteredSummary.totalAberto)}
            </h4>
          </div>
          <div className="w-10 h-10 bg-[#451A03] rounded flex items-center justify-center text-[#FBBF24]">
            <Wallet size={20} />
          </div>
        </div>
      </div>

      <div className="neu-flat overflow-hidden bg-[#151E32]">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-10 text-center text-[#94A3B8] font-medium animate-pulse">Consultando base de dados...</div>
          ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1E293B] border-b border-[#2D3748]">
              <tr>
                <th className="px-6 py-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider font-roboto">Cliente / Processo</th>
                <th className="px-6 py-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider font-roboto">Competência</th>
                <th className="px-6 py-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider text-right font-roboto">Valor Original</th>
                <th className="px-6 py-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider text-right font-roboto">Total Baixado</th>
                <th className="px-6 py-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider text-right font-roboto">Saldo</th>
                <th className="px-6 py-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider text-center font-roboto">Status</th>
                <th className="px-6 py-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider text-center font-roboto">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3748]">
              {filteredProcessos.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                           <ListFilter size={40} className="mb-3 opacity-20" />
                           <p className="font-medium">Nenhum processo {statusFilter !== 'TODOS' ? statusFilter.toLowerCase() : ''} encontrado.</p>
                           <p className="text-xs mt-1">Tente ajustar seus filtros ou termos de busca.</p>
                        </div>
                    </td>
                </tr>
              ) : (
                filteredProcessos.map((p) => {
                    const { totalBaixado, saldo, isCompleted } = getProcessoTotals(p);

                    return (
                    <tr key={p.id} className="hover:bg-[#1E293B] transition-colors group">
                    <td className="px-6 py-4">
                        <div className="font-bold text-[#E2E8F0] line-clamp-1 group-hover:text-[#61CE70] transition-colors">{p.cliente?.razao_social || 'Cliente Removido'}</div>
                        <div className="text-xs text-[#94A3B8] mt-0.5 font-medium">{p.tipo_processo}</div>
                    </td>
                    <td className="px-6 py-4 text-[#E2E8F0] font-medium">
                      {p.trimestre}/{p.ano}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#E2E8F0]">
                        {formatCurrency(p.valor)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#61CE70]">
                        {formatCurrency(totalBaixado)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#FBBF24]">
                        {formatCurrency(saldo)}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isCompleted ? 'bg-[#064E3B]/40 text-[#61CE70] border-[#065F46]' : 'bg-[#451A03]/40 text-[#FBBF24] border-[#78350F]'}`}>
                            {isCompleted ? 'Baixado' : 'Aberto'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {!isCompleted ? (
                            <button 
                                onClick={() => handleOpenSettle(p)}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-[#61CE70] hover:bg-[#61CE70] hover:text-white transition-all mx-auto border border-[#065F46] group-hover:scale-110" 
                                title="Realizar Baixa"
                            >
                                <CheckCircle size={18} />
                            </button>
                        ) : (
                            <div className="flex justify-center">
                                <CheckCircle size={18} className="text-[#334155]" />
                             </div>
                        )}
                    </td>
                    </tr>
                )})
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Settle Modal */}
      {isModalOpen && selectedProcesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="neu-flat w-full max-w-lg p-8 animate-glass-pop relative bg-[#151E32]">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-[#E2E8F0] font-roboto-slab">Nova Baixa</h3>
                        <p className="text-sm text-[#94A3B8] mt-1">{selectedProcesso.cliente?.razao_social}</p>
                    </div>
                    <div className="w-12 h-12 bg-[#064E3B] rounded-md flex items-center justify-center text-[#61CE70]">
                        <Wallet size={24} />
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="bg-[#1E293B] p-5 rounded-md border border-[#2D3748] flex justify-between items-center">
                        <span className="text-sm font-bold text-[#94A3B8]">Saldo Atual</span>
                        <span className="text-xl font-bold text-[#E2E8F0]">{formatCurrency(getProcessoTotals(selectedProcesso).saldo)}</span>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Tipo da Baixa</label>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setBaixaType(TipoBaixa.CONTA_CORRENTE)}
                                className={`flex-1 py-3 rounded-md font-bold text-sm transition-all border ${baixaType === TipoBaixa.CONTA_CORRENTE ? 'bg-[#1A3375] border-[#1A3375] text-white' : 'bg-transparent border-[#2D3748] text-[#94A3B8] hover:bg-[#1E293B]'}`}
                            >
                                Conta Corrente
                            </button>
                            <button 
                                onClick={() => setBaixaType(TipoBaixa.COMPENSACAO)}
                                className={`flex-1 py-3 rounded-md font-bold text-sm transition-all border ${baixaType === TipoBaixa.COMPENSACAO ? 'bg-[#1A3375] border-[#1A3375] text-white' : 'bg-transparent border-[#2D3748] text-[#94A3B8] hover:bg-[#1E293B]'}`}
                            >
                                Compensação
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Valor da Baixa</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] font-bold">R$</span>
                            <input 
                                type="number" step="0.01"
                                value={valorBaixa}
                                onChange={(e) => setValorBaixa(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 neu-pressed text-[#E2E8F0] font-bold"
                            />
                        </div>
                    </div>
                    
                    {baixaType === TipoBaixa.COMPENSACAO && (
                      <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Tributo Compensado</label>
                        <select 
                            value={tributoCompensado}
                            onChange={(e) => setTributoCompensado(e.target.value)}
                            className="w-full px-4 py-3 neu-pressed text-[#E2E8F0] font-medium bg-[#0F172A]"
                        >
                          <option value="">Selecione o tributo...</option>
                          {tributosOpcoes.map(opcao => (
                            <option key={opcao} value={opcao}>{opcao}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Data</label>
                        <input 
                            type="date" 
                            value={dataBaixa}
                            onChange={(e) => setDataBaixa(e.target.value)}
                            className="w-full px-4 py-3 neu-pressed text-[#E2E8F0] font-medium invert-calendar"
                        />
                    </div>

                </div>
                
                <div className="flex justify-end gap-3 mt-8">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2.5 text-sm font-bold text-[#94A3B8] hover:bg-[#1E293B] rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirmSettle}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-[#61CE70] hover:bg-[#54B661] rounded-md shadow-sm transition-all"
                    >
                        Confirmar Baixa
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
