
import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, CheckCircle, Wallet, Target, 
  ArrowUpRight, BarChart3, Filter, FileUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Processo, Cliente } from '../types';
import { formatCurrency } from '../constants';
import { StatCard } from '../components/StatCard';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pData, cData] = await Promise.all([api.getProcessos(), api.getClientes()]);
        setProcessos(pData);
        setClientes(cData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProcessos = useMemo(() => {
    if (selectedClienteId === 'all') return processos;
    return processos.filter(p => p.cliente_id === Number(selectedClienteId));
  }, [processos, selectedClienteId]);

  const stats = useMemo(() => {
    let totalMapeado = 0;
    let totalRecuperado = 0;
    let honTotais = 0;
    let honRecebidos = 0;

    filteredProcessos.forEach(p => {
      const perc = (p.percentual_honorarios || 10) / 100;
      totalMapeado += p.valor;
      honTotais += (p.valor * perc);
      
      const baixasVal = (p.baixas || []).reduce((acc, b) => acc + b.valor, 0);
      totalRecuperado += baixasVal;
      honRecebidos += (baixasVal * perc);
    });

    return {
      totalMapeado,
      totalRecuperado,
      honTotais,
      honRecebidos,
      honPendente: honTotais - honRecebidos,
      taxaSucesso: totalMapeado > 0 ? (totalRecuperado / totalMapeado) * 100 : 0
    };
  }, [filteredProcessos]);

  const chartFormatter = (val: number) => {
    if (val >= 1000000000) return `R$ ${(val/1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `R$ ${(val/1000000).toFixed(1)}M`;
    return `R$ ${(val/1000).toFixed(0)}k`;
  };

  const timelineData = useMemo(() => {
    const groups: Record<string, { label: string, mapeado: number, recuperado: number }> = {};
    filteredProcessos.forEach(p => {
      const key = selectedClienteId === 'all' ? `${p.ano}` : `${p.trimestre} ${p.ano}`;
      if (!groups[key]) groups[key] = { label: key, mapeado: 0, recuperado: 0 };
      groups[key].mapeado += p.valor;
      groups[key].recuperado += (p.baixas || []).reduce((acc, b) => acc + b.valor, 0);
    });
    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredProcessos, selectedClienteId]);

  if (loading) return <div className="p-10 text-center text-[#94A3B8] animate-pulse">Carregando indicadores...</div>;

  if (processos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FileUp size={48} className="text-[#1A3375] mb-6 opacity-40" />
        <h2 className="text-2xl font-bold text-[#E2E8F0]">Nenhum dado importado</h2>
        <button onClick={() => navigate('/import')} className="mt-6 px-8 py-3 bg-[#61CE70] text-white font-bold rounded-lg shadow-lg">Ir para Importação</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-glass-pop">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
        <div>
            <h1 className="text-3xl font-bold text-[#E2E8F0] font-roboto-slab">Performance Fiscal</h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              {selectedClienteId === 'all' ? 'Consolidado da Carteira' : `Detalhes: ${clientes.find(c => c.id === Number(selectedClienteId))?.razao_social}`}
            </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#61CE70]" />
            <select 
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              className="pl-10 pr-10 py-3 neu-pressed text-sm text-[#E2E8F0] bg-[#151E32] font-bold rounded-lg min-w-[250px]"
            >
              <option value="all">TODAS AS EMPRESAS</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
            </select>
          </div>
          <div className="bg-[#1A3375] px-4 py-3 rounded-lg text-white font-bold text-[11px] flex items-center gap-2">
            <Target size={14} /> {stats.taxaSucesso.toFixed(1)}% RECUPERADO
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Honorários Recebidos" value={formatCurrency(stats.honRecebidos)} icon={CheckCircle} colorClass="emerald" trend="Efetivado" />
        <StatCard title="Honorários Pendentes" value={formatCurrency(stats.honPendente)} icon={Wallet} colorClass="amber" trend="A Receber" />
        <StatCard title="Total em Honorários" value={formatCurrency(stats.honTotais)} icon={TrendingUp} colorClass="indigo" trend="Mapeado" />
        <StatCard title="Créditos p/ Cliente" value={formatCurrency(stats.totalRecuperado)} icon={ArrowUpRight} colorClass="slate" trend="Sucesso Cliente" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 neu-flat p-8 bg-[#151E32]">
          <h3 className="text-xl font-bold text-[#E2E8F0] mb-8 flex items-center gap-2">
            <BarChart3 className="text-[#61CE70]" /> Evolução de Créditos
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
                <XAxis dataKey="label" tick={{fill: '#94A3B8', fontSize: 10}} axisLine={false} />
                <YAxis tick={{fill: '#94A3B8', fontSize: 10}} axisLine={false} tickFormatter={chartFormatter} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #2D3748' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Area type="monotone" name="Mapeado" dataKey="mapeado" stroke="#1A3375" fill="#1A3375" fillOpacity={0.1} strokeWidth={3} />
                <Area type="monotone" name="Recuperado" dataKey="recuperado" stroke="#61CE70" fill="#61CE70" fillOpacity={0.1} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="neu-flat p-8 bg-[#151E32]">
            <h3 className="text-xl font-bold text-[#E2E8F0] mb-8">Status Honorários</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ name: 'Recebido', value: stats.honRecebidos }, { name: 'Pendente', value: stats.honPendente }]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
                        <XAxis dataKey="name" tick={{fill: '#94A3B8', fontSize: 12}} axisLine={false} />
                        <YAxis tick={{fill: '#94A3B8', fontSize: 10}} axisLine={false} tickFormatter={chartFormatter} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} formatter={(val: number) => formatCurrency(val)} />
                        <Bar dataKey="value" barSize={50} radius={[4, 4, 0, 0]}>
                          <Cell fill="#61CE70" /><Cell fill="#FBBF24" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#94A3B8]">REALIZAÇÃO PATRIMONIUM</span>
                <span className="text-[#61CE70]">{((stats.honRecebidos / (stats.honTotais || 1)) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#0B1120] h-2 rounded-full overflow-hidden">
                <div className="bg-[#61CE70] h-full" style={{ width: `${(stats.honRecebidos / (stats.honTotais || 1)) * 100}%` }}></div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};
