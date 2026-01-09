
import React, { useState } from 'react';
import { FileUp, Trash2, Building2, TrendingUp, CheckSquare } from 'lucide-react';
import { api } from '../services/api';
import { RegimeTributario, TipoBaixa } from '../types';

export const ImportPage: React.FC = () => {
  const [loadingType, setLoadingType] = useState<'empresas' | 'pedidos' | 'ressarcimentos' | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const cleanCNPJ = (val: string) => val.replace(/\D/g, '');

  const cleanNumeric = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const raw = String(val).trim();
    // Se contém vírgula ou ponto como separador decimal explícito (ex: 1.234,56 ou 1234.56)
    if (raw.includes(',') || (raw.includes('.') && raw.split('.').pop()?.length === 2)) {
      return parseFloat(raw.replace(/\./g, '').replace(',', '.'));
    }
    // Se for apenas uma string de números (ex: 19974938), assume os últimos 2 como centavos
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) return 0;
    return parseFloat(digitsOnly) / 100;
  };

  const extractHonorarios = (val: string): number => {
    const match = val.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      // Se o número for algo como 01, retorna 1. Se for 004, retorna 4.
      return num > 0 ? num : 10;
    }
    return 10;
  };

  const parseCSV = (text: string) => {
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];
    
    const separator = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, '').toUpperCase());

    return lines.slice(1).map(line => {
      const values = line.split(separator);
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = values[i]?.trim().replace(/^"|"$/g, '') || '';
      });
      return obj;
    });
  };

  const handleImportEmpresas = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingType('empresas');
    addLog(`Iniciando importação de Empresas...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = parseCSV(event.target?.result as string);
      try {
        let count = 0;
        for (const row of data) {
          const razao = row['EMPRESA'];
          const cnpjRaw = row['CNPJ'];
          if (!razao || !cnpjRaw) continue;
          
          const cnpj = cleanCNPJ(cnpjRaw);
          const perc = extractHonorarios(row['% HONORARIOS'] || row['% HONORÁRIOS'] || '10');
          
          await api.createCliente({
            razao_social: razao,
            cnpj: cnpj,
            contrato_inicio: row['INÍCIO'] || new Date().toISOString().split('T')[0],
            percentual_honorarios: perc
          });
          count++;
        }
        addLog(`Sucesso: ${count} empresas cadastradas.`);
      } catch (err: any) {
        addLog(`Erro: ${err.message}`);
      } finally {
        setLoadingType(null);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleImportPedidos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingType('pedidos');
    addLog(`Mapeando períodos de créditos (Pedidos)...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = parseCSV(event.target?.result as string);
      if (data.length === 0) return;
      const headers = Object.keys(data[0]);
      
      try {
        const clientes = await api.getClientes();
        let total = 0;
        for (const row of data) {
          const cnpj = cleanCNPJ(row['CNPJ']);
          const cliente = clientes.find(c => cleanCNPJ(c.cnpj) === cnpj);
          if (!cliente) continue;

          for (const key of headers) {
            if (key.includes('TRIM-')) {
              const valor = cleanNumeric(row[key]);
              if (valor > 0) {
                const parts = key.split('-');
                const tri = parts[0].trim();
                const ano = parseInt(parts[1].trim());
                await api.createProcesso({
                  cliente_id: cliente.id,
                  ano: ano,
                  trimestre: tri,
                  regime_tributario: RegimeTributario.LUCRO_REAL,
                  valor: valor,
                  percentual_honorarios: cliente.percentual_honorarios,
                  tipo_processo: 'Ressarcimento PIS/COFINS',
                  data_lancamento_rfb: new Date().toISOString().split('T')[0]
                });
                total++;
              }
            }
          }
        }
        addLog(`Sucesso: ${total} períodos de crédito lançados.`);
      } catch (err: any) {
        addLog(`Erro: ${err.message}`);
      } finally {
        setLoadingType(null);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleImportRessarcimentos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingType('ressarcimentos');
    addLog(`Processando baixas de recebimento...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = parseCSV(event.target?.result as string);
      if (data.length === 0) return;
      const headers = Object.keys(data[0]);
      
      try {
        const processos = await api.getProcessos();
        let baixasCount = 0;
        for (const row of data) {
          const cnpj = cleanCNPJ(row['CNPJ']);
          const procCliente = processos.filter(p => p.cliente && cleanCNPJ(p.cliente.cnpj) === cnpj);

          for (const key of headers) {
            if (key.includes('TRIM-')) {
              const valorRec = cleanNumeric(row[key]);
              if (valorRec > 0) {
                const parts = key.split('-');
                const tri = parts[0].trim();
                const ano = parseInt(parts[1].trim());
                const match = procCliente.find(p => p.trimestre === tri && p.ano === ano);
                if (match) {
                  await api.createBaixa(match.id, {
                    tipo: TipoBaixa.CONTA_CORRENTE,
                    valor: valorRec,
                    data_baixa: new Date().toISOString().split('T')[0]
                  });
                  baixasCount++;
                }
              }
            }
          }
        }
        addLog(`Sucesso: ${baixasCount} recebimentos vinculados.`);
      } catch (err: any) {
        addLog(`Erro: ${err.message}`);
      } finally {
        setLoadingType(null);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-3xl font-bold text-[#E2E8F0] font-roboto-slab">Importação de Dados Reais</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Sincronização com planilhas de ressarcimento</p>
        </div>
        <button onClick={() => { if(confirm("Limpar tudo?")) api.resetDatabase().then(() => window.location.reload()) }} className="flex items-center gap-2 px-6 py-3 bg-[#EF4444] text-white font-bold rounded-lg text-xs">
          <Trash2 size={16} /> LIMPAR TUDO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="neu-flat p-6 bg-[#151E32] flex flex-col items-center text-center border-t-4 border-[#1A3375]">
            <Building2 size={32} className="text-[#1A3375] mb-4" />
            <h3 className="text-lg font-bold text-[#E2E8F0] mb-2 font-roboto-slab">1. Empresas</h3>
            <p className="text-xs text-[#94A3B8] mb-4">Cadastra clientes e honorários</p>
            <label className="w-full neu-btn py-3 cursor-pointer">
              <input type="file" accept=".csv" className="hidden" onChange={handleImportEmpresas} disabled={!!loadingType} />
              <FileUp size={18} className="mr-2" /> SUBIR CSV
            </label>
          </div>

          <div className="neu-flat p-6 bg-[#151E32] flex flex-col items-center text-center border-t-4 border-[#FBBF24]">
            <TrendingUp size={32} className="text-[#FBBF24] mb-4" />
            <h3 className="text-lg font-bold text-[#E2E8F0] mb-2 font-roboto-slab">2. Pedidos</h3>
            <p className="text-xs text-[#94A3B8] mb-4">Saldos a receber da RFB</p>
            <label className="w-full neu-btn py-3 cursor-pointer">
              <input type="file" accept=".csv" className="hidden" onChange={handleImportPedidos} disabled={!!loadingType} />
              <FileUp size={18} className="mr-2" /> SUBIR CSV
            </label>
          </div>

          <div className="neu-flat p-6 bg-[#151E32] flex flex-col items-center text-center border-t-4 border-[#61CE70]">
            <CheckSquare size={32} className="text-[#61CE70] mb-4" />
            <h3 className="text-lg font-bold text-[#E2E8F0] mb-2 font-roboto-slab">3. Recebidos</h3>
            <p className="text-xs text-[#94A3B8] mb-4">Valores creditados na conta</p>
            <label className="w-full neu-btn py-3 cursor-pointer">
              <input type="file" accept=".csv" className="hidden" onChange={handleImportRessarcimentos} disabled={!!loadingType} />
              <FileUp size={18} className="mr-2" /> SUBIR CSV
            </label>
          </div>
        </div>

        <div className="neu-flat p-6 bg-[#151E32] h-[500px] flex flex-col">
          <h4 className="text-[#E2E8F0] font-bold mb-4 uppercase text-[10px] border-b border-[#2D3748] pb-2">Log de Processamento</h4>
          <div className="flex-1 bg-[#0B1120] rounded p-3 font-mono text-[10px] space-y-1 overflow-y-auto border border-white/5">
            {logs.length === 0 ? <div className="h-full flex items-center justify-center opacity-20 italic">Aguardando arquivos...</div> : logs.map((log, i) => <div key={i} className="text-[#61CE70]">{log}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};
