
import React, { useState } from 'react';
import { Lead, LeadStatus, Responsible, Plan, STATUS_COLUMNS } from '../types';

interface LeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, onClose, onSave }) => {
  const [formData, setFormData] = useState<Lead>({ ...lead });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'number') {
      finalValue = parseInt(value, 10);
    } else if (name === 'apto_consultoria') {
      finalValue = value === 'true';
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Helper to determine status position for the timeline
  const currentStatusIndex = STATUS_COLUMNS.indexOf(formData.status);
  
  // Header display logic
  const headerTitle = formData.empresa || formData.title || formData.email.split('@')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#243c38]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ecefea] flex items-center justify-between bg-[#ecefea]">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${formData.prioridade === 'Alta' ? 'bg-[#243c38]' : 'bg-[#569481]'}`}>
              <i className="fas fa-building text-2xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#243c38]">{headerTitle}</h2>
              <p className="text-sm text-[#78958c]">{formData.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-[#78958c] hover:text-[#243c38] hover:bg-[#d4d7d2]/50 rounded-full transition-all"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col">
          
          {/* Status Timeline Section */}
          <div className="px-10 py-10 bg-white">
            <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto">
              {/* Connector Line */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#d4d7d2] -translate-y-1/2 z-0"></div>
              <div 
                className="absolute top-1/2 left-0 h-0.5 bg-[#569481] -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${(currentStatusIndex / (STATUS_COLUMNS.length - 1)) * 100}%` }}
              ></div>

              {/* Status Points */}
              {STATUS_COLUMNS.map((status, index) => {
                const isActive = index === currentStatusIndex;
                const isCompleted = index < currentStatusIndex;
                
                return (
                  <div key={status} className="relative z-10 flex flex-col items-center group">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                        ${isActive ? 'bg-[#569481] ring-4 ring-[#569481]/20 scale-125' : 
                          isCompleted ? 'bg-[#569481] cursor-pointer' : 'bg-white border-2 border-[#d4d7d2] cursor-pointer hover:border-[#569481]'}
                      `}
                    >
                      {isCompleted ? (
                        <i className="fas fa-check text-[10px] text-white"></i>
                      ) : isActive ? (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      ) : null}
                    </button>
                    <span 
                      onClick={() => handleStatusChange(status)}
                      className={`
                        absolute -bottom-8 whitespace-nowrap text-[10px] font-bold uppercase tracking-tighter cursor-pointer transition-colors
                        ${isActive ? 'text-[#243c38]' : isCompleted ? 'text-[#569481]' : 'text-[#78958c] group-hover:text-[#569481]'}
                      `}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Section 1: Lead Details */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-[#78958c] uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-address-card text-[#569481]"></i> INFORMAÇÕES DO LEAD
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#ecefea] p-3 rounded-lg border border-[#d4d7d2]">
                    <label className="text-[10px] font-bold text-[#78958c] uppercase">Nome</label>
                    <p className="text-sm font-medium text-[#243c38] truncate">{formData.title || '-'}</p>
                  </div>
                  <div className="bg-[#ecefea] p-3 rounded-lg border border-[#d4d7d2]">
                    <label className="text-[10px] font-bold text-[#78958c] uppercase">Telefone</label>
                    <p className="text-sm font-medium text-[#243c38]">{formData.telefone || '-'}</p>
                  </div>
                  <div className="col-span-2 bg-[#ecefea] p-3 rounded-lg border border-[#d4d7d2]">
                    <label className="text-[10px] font-bold text-[#78958c] uppercase">Email</label>
                    <p className="text-sm font-medium text-[#243c38]">{formData.email}</p>
                  </div>
                </div>

                <div className="bg-[#ecefea] p-3 rounded-lg border border-[#d4d7d2]">
                    <label className="text-[10px] font-bold text-[#78958c] uppercase">Data de criação</label>
                    <p className="text-sm font-medium text-[#243c38]">{formData.creation_datetime || '-'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#ecefea] p-3 rounded-lg border border-[#d4d7d2]">
                    <label className="text-[10px] font-bold text-[#78958c] uppercase">Fim do teste</label>
                    <p className="text-sm font-medium text-[#243c38]">{formData.trial_end || '-'}</p>
                  </div>
                  <div className="bg-[#ecefea] p-3 rounded-lg border border-[#d4d7d2]">
                    <label className="text-[10px] font-bold text-[#78958c] uppercase">Dias de Teste</label>
                    <p className={`text-sm font-bold ${formData.dias_de_teste < 0 ? 'text-red-600' : 'text-[#569481]'}`}>
                      {formData.dias_de_teste} dias
                    </p>
                  </div>
                  <div className="bg-[#ecefea] p-3 rounded-lg border border-[#d4d7d2]">
                    <label className="text-[10px] font-bold text-[#78958c] uppercase">Email Qualidade</label>
                    <p className="text-sm font-medium text-[#243c38]">{formData.qualidade_email}</p>
                  </div>
                  <div className="bg-[#ecefea] p-3 rounded-lg border border-[#d4d7d2]">
                    <label className="text-[10px] font-bold text-[#78958c] uppercase">Prioridade</label>
                    <span className={`block mt-1 text-[10px] font-bold px-2 py-0.5 rounded w-fit uppercase ${formData.prioridade === 'Alta' ? 'bg-[#243c38] text-white' : 'bg-[#d4d7d2] text-[#243c38]'}`}>
                      {formData.prioridade}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#569481]/5 p-4 rounded-xl border border-[#569481]/20 mt-4">
                <label className="text-xs font-bold text-[#569481] uppercase flex items-center gap-2 mb-2">
                  <i className="fas fa-brain"></i> Análise Preliminar
                </label>
                <p className="text-sm text-[#243c38] leading-relaxed italic">
                  "{formData.analise_preliminar || 'Nenhuma análise disponível.'}"
                </p>
              </div>
            </div>

            {/* Section 2: Editable Fields */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-[#78958c] uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-edit text-[#569481]"></i> GESTÃO COMERCIAL
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#243c38]">Empresa</label>
                  <input 
                    type="text"
                    name="empresa"
                    value={formData.empresa || ''}
                    onChange={handleChange}
                    placeholder="Nome da empresa"
                    className="w-full bg-white border border-[#d4d7d2] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#569481] outline-none transition-all"
                  />
                </div>

                {formData.status === LeadStatus.LOST && (
                   <div className="space-y-1 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-red-700">Motivo de Perda</label>
                    <select 
                      name="motivo_perda"
                      value={formData.motivo_perda}
                      onChange={handleChange}
                      className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    >
                      <option value="">Selecione um motivo...</option>
                      <option value="Preço">Preço</option>
                      <option value="Falta de Recurso">Falta de Recurso</option>
                      <option value="Concorrente">Concorrente</option>
                      <option value="Sem Resposta">Sem Resposta</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#243c38]">Responsável</label>
                    <select 
                      name="responsavel"
                      value={formData.responsavel}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#d4d7d2] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#569481] outline-none transition-all"
                    >
                      <option value="">Selecione...</option>
                      <option value={Responsible.GABRIEL}>{Responsible.GABRIEL}</option>
                      <option value={Responsible.LUCAS}>{Responsible.LUCAS}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#243c38]">Segmento</label>
                    <input 
                      type="text"
                      name="segmento"
                      value={formData.segmento || ''}
                      onChange={handleChange}
                      placeholder="Ex: Imobiliária"
                      className="w-full bg-white border border-[#d4d7d2] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#569481] outline-none transition-all"
                    />
                  </div>
                </div>

                

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#243c38]">Necessidade</label>
                  <input 
                    type="text"
                    name="necessidade"
                    value={formData.necessidade || ''}
                    onChange={handleChange}
                    placeholder="O que o lead busca?"
                    className="w-full bg-white border border-[#d4d7d2] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#569481] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#243c38]">Plano</label>
                    <select 
                      name="plano"
                      value={formData.plano}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#d4d7d2] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#569481] outline-none transition-all"
                    >
                      <option value="">Selecione...</option>
                      {Object.values(Plan).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#243c38]">Nº de Usuários</label>
                    <input 
                      type="number"
                      name="numero_usuarios"
                      value={formData.numero_usuarios}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#d4d7d2] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#569481] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#243c38]">Observações</label>
                  <textarea 
                    name="observacoes"
                    value={formData.observacoes || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-white border border-[#d4d7d2] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#569481] outline-none transition-all resize-none"
                    placeholder="Anotações sobre o lead..."
                  ></textarea>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#d4d7d2]">
                  <input 
                    type="checkbox"
                    id="apto_consultoria"
                    name="apto_consultoria"
                    checked={!!formData.apto_consultoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, apto_consultoria: e.target.checked }))}
                    className="w-5 h-5 rounded text-[#569481] focus:ring-[#569481] border-[#d4d7d2]"
                  />
                  <label htmlFor="apto_consultoria" className="text-sm font-bold text-[#243c38] cursor-pointer">
                    Apto para Consultoria?
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#ecefea] flex items-center justify-end gap-3 bg-[#ecefea]">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-[#78958c] hover:text-[#243c38] transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="px-8 py-2 bg-[#569481] text-white text-sm font-bold rounded-xl hover:bg-[#243c38] shadow-md shadow-[#243c38]/10 transition-all flex items-center gap-2"
          >
            <i className="fas fa-save"></i>
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;
