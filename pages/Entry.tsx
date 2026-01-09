import React, { useState, useEffect } from 'react';
import { Save, Plus, Building2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RegimeTributario, Cliente } from '../types';
import { REGIME_LABELS } from '../constants';
import { api } from '../services/api';

export const Entry: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Cliente[]>([]);
  
  // State aligns with ProcessoCreate schema
  const [formData, setFormData] = useState({
    cliente_id: '',
    responsabilidade_patrimonium: true,
    percentual_honorarios: 10,
    trimestre: '1º TRIM',
    ano: new Date().getFullYear(),
    regime_tributario: RegimeTributario.LUCRO_REAL,
    tipo_processo: '1º RESSARCIMENTO PIS E COFINS',
    valor: '',
    data_lancamento_rfb: new Date().toISOString().split('T')[0]
  });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ razao_social: '', cnpj: '', contrato_inicio: '', percentual_honorarios: 10 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await api.getClientes();
        setClients(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadClients();
  }, []);

  const handleSaveClient = async () => {
    if(!newClient.razao_social || !newClient.cnpj) return;
    try {
      const created = await api.createCliente({
        ...newClient,
        contrato_inicio: newClient.contrato_inicio || new Date().toISOString().split('T')[0]
      });
      setClients([...clients, created]);
      setFormData({...formData, cliente_id: created.id.toString()});
      setIsClientModalOpen(false);
      setNewClient({ razao_social: '', cnpj: '', contrato_inicio: '', percentual_honorarios: 10 });
    } catch (e) {
      alert("Erro ao criar cliente");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_id) {
      alert("Selecione um cliente");
      return;
    }
    setLoading(true);
    
    try {
      await api.createProcesso({
        cliente_id: Number(formData.cliente_id),
        trimestre: formData.trimestre,
        ano: Number(formData.ano),
        regime_tributario: formData.regime_tributario,
        tipo_processo: formData.tipo_processo,
        valor: Number(formData.valor),
        percentual_honorarios: Number(formData.percentual_honorarios),
        responsabilidade_patrimonium: formData.responsabilidade_patrimonium,
        data_lancamento_rfb: formData.data_lancamento_rfb,
      });
      navigate('/settlement');
    } catch (error) {
      console.error(error);
      alert("Erro ao lançar processo");
    } finally {
      setLoading(false);
    }
  };

  const estimatedRevenue = (Number(formData.valor || 0) * Number(formData.percentual_honorarios || 0)) / 100;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
            <h1 className="text-2xl font-bold text-[#E2E8F0] font-roboto-slab">Lançamento</h1>
            <p className="text-sm text-[#94A3B8] mt-1 font-medium">Novo processo de ressarcimento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="neu-flat p-8 md:p-10 relative bg-[#151E32]">
        <div className="space-y-10">
          
          {/* Section 1 */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-[#61CE70] font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-1 bg-[#61CE70] rounded-sm inline-block"></span>
                Dados do Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative">
                <label className="block text-sm font-bold text-[#94A3B8] mb-3 ml-1">Empresa / Cliente</label>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <select 
                        value={formData.cliente_id}
                        onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                        className="w-full neu-pressed p-4 outline-none text-[#E2E8F0] font-medium"
                        required
                    >
                        <option value="">Selecione...</option>
                        {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.razao_social} ({c.cnpj})</option>
                        ))}
                    </select>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsClientModalOpen(true)}
                    className="neu-btn w-14 h-14 text-[#61CE70]"
                    title="Novo Cliente"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center h-full pt-8">
                <label className="flex items-center cursor-pointer group select-none">
                    <div className={`w-6 h-6 rounded-md mr-3 flex items-center justify-center transition-all border ${formData.responsabilidade_patrimonium ? 'bg-[#1A3375] border-[#1A3375] text-white' : 'bg-[#1E293B] border-[#2D3748]'}`}>
                        {formData.responsabilidade_patrimonium && <CheckCircle size={16} />}
                         <input 
                            type="checkbox" 
                            checked={formData.responsabilidade_patrimonium}
                            onChange={(e) => setFormData({...formData, responsabilidade_patrimonium: e.target.checked})}
                            className="hidden"
                        />
                    </div>
                  <span className="text-sm font-bold text-[#E2E8F0] group-hover:text-[#61CE70] transition-colors">Responsabilidade Patrimonium?</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div>
             <h3 className="text-xs uppercase tracking-widest text-[#61CE70] font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-1 bg-[#61CE70] rounded-sm inline-block"></span>
                Competência
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-bold text-[#94A3B8] mb-3 ml-1">Ano</label>
                <input 
                  type="number" 
                  value={formData.ano}
                  onChange={(e) => setFormData({...formData, ano: Number(e.target.value)})}
                  className="w-full neu-pressed p-4 outline-none text-[#E2E8F0] font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#94A3B8] mb-3 ml-1">Trimestre</label>
                <select 
                  value={formData.trimestre}
                  onChange={(e) => setFormData({...formData, trimestre: e.target.value})}
                  className="w-full neu-pressed p-4 outline-none text-[#E2E8F0] font-medium"
                >
                  <option value="1º TRIM">1º TRIM</option>
                  <option value="2º TRIM">2º TRIM</option>
                  <option value="3º TRIM">3º TRIM</option>
                  <option value="4º TRIM">4º TRIM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#94A3B8] mb-3 ml-1">Regime Tributário</label>
                <select 
                  value={formData.regime_tributario}
                  onChange={(e) => setFormData({...formData, regime_tributario: e.target.value as RegimeTributario})}
                  className="w-full neu-pressed p-4 outline-none text-[#E2E8F0] font-medium"
                >
                  {Object.values(RegimeTributario).map((label) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-[#61CE70] font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-1 bg-[#61CE70] rounded-sm inline-block"></span>
                Detalhes do Processo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                 <label className="block text-sm font-bold text-[#94A3B8] mb-3 ml-1">Tipo de Processo</label>
                 <input 
                  type="text" 
                  value={formData.tipo_processo}
                  onChange={(e) => setFormData({...formData, tipo_processo: e.target.value})}
                  className="w-full neu-pressed p-4 outline-none text-[#E2E8F0] font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#94A3B8] mb-3 ml-1">Data Lançamento RFB</label>
                <input 
                  type="date" 
                  required
                  value={formData.data_lancamento_rfb}
                  onChange={(e) => setFormData({...formData, data_lancamento_rfb: e.target.value})}
                  className="w-full neu-pressed p-4 text-[#E2E8F0] font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                 <label className="block text-sm font-bold text-[#94A3B8] mb-3 ml-1">Valor do Crédito</label>
                 <div className="relative">
                    <span className="absolute left-4 top-4 text-[#94A3B8] font-bold">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      min="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({...formData, valor: e.target.value})}
                      className="w-full neu-pressed p-4 pl-12 text-[#E2E8F0] font-black outline-none"
                      placeholder="0,00"
                    />
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-bold text-[#94A3B8] mb-3 ml-1">% Honorários</label>
                 <div className="relative">
                    <input 
                      type="number" 
                      step="0.1"
                      required
                      min="0"
                      max="100"
                      value={formData.percentual_honorarios}
                      onChange={(e) => setFormData({...formData, percentual_honorarios: Number(e.target.value)})}
                      className="w-full neu-pressed p-4 pr-10 text-[#E2E8F0] font-black outline-none"
                    />
                    <span className="absolute right-4 top-4 text-[#94A3B8] font-bold">%</span>
                 </div>
              </div>
            </div>

            {/* Revenue Preview */}
            <div className="bg-[#1E293B] p-6 flex items-center justify-between rounded-md border border-[#2D3748]">
              <div>
                <span className="text-sm text-[#94A3B8] font-bold uppercase tracking-wide">Faturamento Estimado</span>
                <p className="text-xs text-[#94A3B8] mt-1 font-medium">Projeção Patrimonium</p>
              </div>
              <span className="text-3xl font-bold text-[#61CE70] tracking-tight font-roboto-slab">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedRevenue)}
              </span>
            </div>
            
          </div>

        </div>

        <div className="mt-10 pt-6 flex justify-end gap-6 border-t border-[#2D3748]">
          <button 
            type="button" 
            onClick={() => navigate('/')}
            className="neu-btn px-8 py-3 text-sm text-[#94A3B8] hover:bg-[#1E293B] bg-[#151E32] shadow-none border border-[#2D3748]"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="neu-btn px-8 py-3 text-sm text-white bg-[#1A3375] hover:bg-[#122452] shadow-md border-transparent"
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Salvando...' : 'LANÇAR PROCESSO'}
          </button>
        </div>
      </form>

      {/* New Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="neu-flat w-full max-w-md p-8 relative animate-glass-pop bg-[#151E32]">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 neu-icon-box text-[#61CE70] bg-[#064E3B] border-[#065F46]">
                 <Building2 size={24} />
               </div>
               <h3 className="text-xl font-bold text-[#E2E8F0] font-roboto-slab">Novo Cliente</h3>
             </div>
             
             <div className="space-y-6">
               <div>
                 <label className="block text-sm font-bold text-[#94A3B8] mb-2 ml-1">Razão Social</label>
                 <input 
                    type="text" 
                    className="w-full neu-pressed p-3 outline-none text-[#E2E8F0] font-bold"
                    value={newClient.razao_social}
                    onChange={(e) => setNewClient({...newClient, razao_social: e.target.value})}
                    placeholder="Nome da empresa"
                  />
               </div>
               <div>
                 <label className="block text-sm font-bold text-[#94A3B8] mb-2 ml-1">CNPJ</label>
                 <input 
                    type="text" 
                    className="w-full neu-pressed p-3 outline-none text-[#E2E8F0] font-bold"
                    value={newClient.cnpj}
                    onChange={(e) => setNewClient({...newClient, cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00"
                  />
               </div>
             </div>

             <div className="flex justify-end gap-4 mt-10">
               <button 
                onClick={() => setIsClientModalOpen(false)}
                className="neu-btn px-6 py-2 text-sm text-[#94A3B8] hover:bg-[#1E293B] shadow-none border border-[#2D3748]"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveClient}
                disabled={!newClient.razao_social || !newClient.cnpj}
                className="neu-btn px-6 py-2 text-sm text-white bg-[#1A3375] hover:bg-[#122452]"
              >
                Salvar
              </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};