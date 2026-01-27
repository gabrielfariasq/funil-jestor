
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, Responsible, Plan, STATUS_COLUMNS, Task, TaskType, TaskChannel } from '../types';
import { saveTaskToStorage, updateTaskReturnInStorage, deleteTaskFromStorage } from '../services/sheetService';

interface LeadModalProps {
  lead: Lead;
  tasks: Task[];
  initialTab?: 'overview' | 'tasks';
  onClose: () => void;
  onSave: (lead: Lead) => void;
  onRefreshTasks: () => void;
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, tasks, initialTab = 'overview', onClose, onSave, onRefreshTasks }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>(initialTab);
  const [formData, setFormData] = useState<Lead>({ ...lead });
  
  useEffect(() => {
    setActiveTab(initialTab);
    setFormData({ ...lead });
  }, [lead, initialTab]);

  const [newTask, setNewTask] = useState({
    tarefa: TaskType.ABORDAGEM,
    canal: TaskChannel.WHATSAPP,
    retorno: 'Pendente'
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'number') finalValue = parseInt(value, 10) || 0;
    if (type === 'checkbox') finalValue = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleAddTask = async () => {
    if (isAddingTask) return;
    setIsAddingTask(true);
    
    const leadName = formData.title || formData.empresa || formData.email;
    const task: Task = {
      lead: leadName,
      id_conta: formData.id_conta || '',
      tarefa: newTask.tarefa,
      canal: newTask.canal,
      data: new Date().toLocaleString('pt-BR'),
      retorno: 'Pendente'
    };

    try {
      await saveTaskToStorage(task);
      onRefreshTasks();
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleUpdateTaskReturn = async (task: Task, newReturn: string) => {
    const updatedTask = { ...task, retorno: newReturn };
    await updateTaskReturnInStorage(updatedTask);
    onRefreshTasks();
  };

  const handleDeleteTask = async (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskId = task.id || `${task.data}-${task.tarefa}`;
    if (window.confirm(`Deseja realmente excluir a tarefa "${task.tarefa}"?`)) {
      setIsDeleting(taskId);
      try {
        await deleteTaskFromStorage(task);
        onRefreshTasks();
      } catch (err) {
        alert("Erro ao excluir tarefa.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const currentStatusIndex = STATUS_COLUMNS.indexOf(formData.status);
  const headerTitle = formData.title || formData.empresa || formData.email.split('@')[0];

  const getChannelInfo = (channelStr: string) => {
    const c = (channelStr || '').toLowerCase();
    if (c.includes('whatsapp')) return { icon: 'fab fa-whatsapp', color: 'bg-green-100 text-green-600' };
    if (c.includes('mail')) return { icon: 'fas fa-envelope', color: 'bg-blue-100 text-blue-600' };
    return { icon: 'fas fa-phone', color: 'bg-orange-100 text-orange-600' };
  };

  // Classes para os seletores estilo Jestor/Dark (imagem solicitada)
  const selectClasses = "w-full bg-[#333333] border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#569481] outline-none appearance-none cursor-pointer font-medium";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#243c38]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1000px] max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ecefea] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-[#243c38]">
              <i className="fas fa-building text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#243c38]">{headerTitle}</h2>
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#78958c]">{formData.email}</p>
                {formData.id_conta && <span className="text-[10px] bg-[#ecefea] px-2 py-0.5 rounded text-[#78958c] font-mono">ID: {formData.id_conta}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#78958c] hover:text-[#243c38] p-2 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex px-8 bg-white gap-8 border-b border-[#ecefea]">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'overview' ? 'text-[#569481] border-[#569481]' : 'text-[#78958c] border-transparent hover:text-[#243c38]'}`}
          >
            OVERVIEW
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 flex items-center gap-2 ${activeTab === 'tasks' ? 'text-[#569481] border-[#569481]' : 'text-[#78958c] border-transparent hover:text-[#243c38]'}`}
          >
            ATIVIDADES
            {tasks.length > 0 && <span className="bg-[#243c38] text-white text-[9px] px-1.5 py-0.5 rounded-full">{tasks.length}</span>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {activeTab === 'overview' ? (
            <div className="p-8 space-y-10 animate-in slide-in-from-left-2">
              <div className="relative pt-2 pb-12">
                <div className="absolute top-6 left-0 w-full h-1 bg-[#d4d7d2] z-0"></div>
                <div className="absolute top-6 left-0 h-1 bg-[#569481] z-0 transition-all duration-500" style={{ width: `${(currentStatusIndex / (STATUS_COLUMNS.length - 1)) * 100}%` }}></div>
                <div className="relative z-10 flex justify-between px-2">
                  {STATUS_COLUMNS.map((status, index) => (
                    <div key={status} className="flex flex-col items-center">
                      <button 
                        onClick={() => handleStatusChange(status)}
                        className={`w-7 h-7 rounded-full border-4 transition-all ${index < currentStatusIndex ? 'bg-[#569481] border-[#569481]' : index === currentStatusIndex ? 'bg-white border-[#569481] scale-125' : 'bg-white border-[#d4d7d2]'}`}
                      >
                        {index < currentStatusIndex && <i className="fas fa-check text-[10px] text-white"></i>}
                        {index === currentStatusIndex && <div className="w-2 h-2 bg-[#569481] rounded-full mx-auto"></div>}
                      </button>
                      <span className={`absolute mt-10 text-[9px] font-bold uppercase whitespace-nowrap tracking-tighter text-center ${index === currentStatusIndex ? 'text-[#243c38]' : 'text-[#78958c]'}`}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[#569481]">
                    <i className="fas fa-id-card text-xs"></i>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest">Informações do Lead</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#ecefea]/40 p-4 rounded-xl border border-[#d4d7d2]/40">
                      <label className="text-[9px] font-bold text-[#78958c] uppercase block mb-1">NOME</label>
                      <p className="text-sm font-bold text-[#243c38] truncate">{formData.title || '-'}</p>
                    </div>
                    <div className="bg-[#ecefea]/40 p-4 rounded-xl border border-[#d4d7d2]/40">
                      <label className="text-[9px] font-bold text-[#78958c] uppercase block mb-1">TELEFONE</label>
                      <p className="text-sm font-bold text-[#243c38] truncate">{formData.telefone || '-'}</p>
                    </div>
                  </div>
                  <div className="bg-[#ecefea]/40 p-4 rounded-xl border border-[#d4d7d2]/40">
                    <label className="text-[9px] font-bold text-[#78958c] uppercase block mb-1">EMAIL</label>
                    <p className="text-sm font-bold text-[#243c38]">{formData.email}</p>
                  </div>
                  <div className="bg-[#ecefea]/40 p-4 rounded-xl border border-[#d4d7d2]/40">
                    <label className="text-[9px] font-bold text-[#78958c] uppercase block mb-1">DATA DE CRIAÇÃO</label>
                    <p className="text-sm font-bold text-[#243c38]">{formData.creation_datetime || '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#ecefea]/40 p-4 rounded-xl border border-[#d4d7d2]/40">
                      <label className="text-[9px] font-bold text-[#78958c] uppercase block mb-1">FIM DO TESTE</label>
                      <p className="text-sm font-bold text-[#243c38]">{formData.trial_end}</p>
                    </div>
                    <div className="bg-[#ecefea]/40 p-4 rounded-xl border border-[#d4d7d2]/40">
                      <label className="text-[9px] font-bold text-[#78958c] uppercase block mb-1">DIAS DE TESTE</label>
                      <p className={`text-sm font-bold ${formData.dias_de_teste < 0 ? 'text-red-500' : 'text-[#243c38]'}`}>
                        {formData.dias_de_teste} dias
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#ecefea]/40 p-4 rounded-xl border border-[#d4d7d2]/40">
                      <label className="text-[9px] font-bold text-[#78958c] uppercase block mb-1">EMAIL QUALIDADE</label>
                      <p className="text-sm font-bold text-[#243c38]">{formData.qualidade_email}</p>
                    </div>
                    <div className="bg-[#ecefea]/40 p-4 rounded-xl border border-[#d4d7d2]/40">
                      <label className="text-[9px] font-bold text-[#78958c] uppercase block mb-1">PRIORIDADE</label>
                      <div className="mt-1">
                        <span className="text-[10px] font-bold px-3 py-1 rounded bg-[#243c38] text-white uppercase">
                          {formData.prioridade || 'ALTA'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[#569481]">
                    <i className="fas fa-edit text-xs"></i>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest">Gestão Comercial</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#243c38] block">Empresa</label>
                      <input name="empresa" value={formData.empresa} onChange={handleChange} placeholder="Nome da empresa" className="w-full border border-[#d4d7d2] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#569481] outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#243c38] block">Responsável</label>
                        <div className="relative group/select">
                          <select name="responsavel" value={formData.responsavel} onChange={handleChange} className={selectClasses}>
                            <option value="">Selecione...</option>
                            <option value={Responsible.GABRIEL}>{Responsible.GABRIEL}</option>
                            <option value={Responsible.LUCAS}>{Responsible.LUCAS}</option>
                            {/* Garante que o valor vindo da planilha apareça mesmo se não for um dos pré-definidos */}
                            {formData.responsavel && 
                             formData.responsavel !== Responsible.GABRIEL && 
                             formData.responsavel !== Responsible.LUCAS && (
                              <option value={formData.responsavel}>{formData.responsavel}</option>
                            )}
                          </select>
                          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#243c38] block">Segmento</label>
                        <input name="segmento" value={formData.segmento} onChange={handleChange} placeholder="Ex: Imobiliária" className="w-full border border-[#d4d7d2] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#569481] outline-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#243c38] block">Necessidade</label>
                      <input name="necessidade" value={formData.necessidade} onChange={handleChange} placeholder="O que o lead busca?" className="w-full border border-[#d4d7d2] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#569481] outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#243c38] block">Plano</label>
                        <div className="relative">
                          <select name="plano" value={formData.plano} onChange={handleChange} className={selectClasses}>
                            <option value="">Selecione...</option>
                            <option value={Plan.HERO}>{Plan.HERO}</option>
                            <option value={Plan.PLUS}>{Plan.PLUS}</option>
                            <option value={Plan.JESTOR}>{Plan.JESTOR}</option>
                            <option value={Plan.PRO}>{Plan.PRO}</option>
                          </select>
                          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#243c38] block">Nº de Usuários</label>
                        <input type="number" name="numero_usuarios" value={formData.numero_usuarios} onChange={handleChange} className="w-full border border-[#d4d7d2] rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#569481] outline-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#243c38] block">Observações</label>
                      <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} placeholder="Anotações sobre o lead..." className="w-full border border-[#d4d7d2] rounded-xl px-4 py-3 text-sm h-32 focus:ring-2 focus:ring-[#569481] outline-none resize-none"></textarea>
                    </div>
                    <div className="flex items-center gap-3 p-4 border border-[#d4d7d2] rounded-xl hover:bg-[#ecefea]/20 transition-all cursor-pointer" onClick={() => setFormData(p => ({...p, apto_consultoria: !p.apto_consultoria}))}>
                      <input type="checkbox" checked={!!formData.apto_consultoria} readOnly className="w-5 h-5 rounded border-[#d4d7d2] text-[#569481] focus:ring-[#569481]" />
                      <label className="text-[12px] font-bold text-[#243c38] cursor-pointer">Apto para Consultoria?</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 flex flex-col gap-6 animate-in slide-in-from-right-2 h-full">
              <div className="bg-white border border-[#d4d7d2] p-6 rounded-2xl flex flex-wrap gap-4 items-end shadow-sm">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-bold text-[#78958c] uppercase block mb-2">TIPO DE ATIVIDADE</label>
                  <div className="relative">
                    <select 
                      value={newTask.tarefa} 
                      onChange={e => setNewTask(prev => ({...prev, tarefa: e.target.value as TaskType}))}
                      className={selectClasses}
                    >
                      <option value={TaskType.ABORDAGEM}>Abordagem</option>
                      <option value={TaskType.FOLLOW_UP}>Follow-up</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                  </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-bold text-[#78958c] uppercase block mb-2">CANAL DE CONTATO</label>
                  <div className="relative">
                    <select 
                      value={newTask.canal} 
                      onChange={e => setNewTask(prev => ({...prev, canal: e.target.value as TaskChannel}))}
                      className={selectClasses}
                    >
                      <option value={TaskChannel.WHATSAPP}>WhatsApp</option>
                      <option value={TaskChannel.EMAIL}>E-mail</option>
                      <option value={TaskChannel.LIGACAO}>Ligação</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                  </div>
                </div>
                <button 
                  onClick={handleAddTask}
                  disabled={isAddingTask}
                  className="bg-[#243c38] text-white px-10 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-[#569481] transition-all disabled:opacity-50 flex items-center gap-2 h-[46px]"
                >
                   <i className={`fas ${isAddingTask ? 'fa-spinner fa-spin' : 'fa-plus'}`}></i>
                  {isAddingTask ? 'Registrando...' : 'Registrar'}
                </button>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between border-b border-[#ecefea] pb-3">
                  <h3 className="text-xs font-bold text-[#78958c] uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-stream text-[#569481]"></i> LINHA DO TEMPO
                  </h3>
                  <span className="text-[10px] bg-[#ecefea] text-[#243c38] font-bold px-3 py-1 rounded-full">{tasks.length} registros</span>
                </div>
                
                {tasks.length > 0 ? (
                  <div className="space-y-4 pb-10">
                    {tasks.slice().reverse().map((task, i) => {
                      const channelInfo = getChannelInfo(task.canal);
                      const displayKey = task.id || `${task.data}-${i}`;
                      return (
                        <div key={displayKey} className="bg-white border border-[#ecefea] p-5 rounded-2xl flex items-center justify-between hover:shadow-xl transition-all border-l-4 border-l-[#569481] group relative">
                          <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${channelInfo.color}`}>
                              <i className={`${channelInfo.icon} text-xl`}></i>
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <p className="text-base font-bold text-[#243c38]">{task.tarefa}</p>
                                <button 
                                  onClick={(e) => handleDeleteTask(e, task)}
                                  className={`text-red-400 hover:text-red-600 p-2 transition-all text-sm rounded-full hover:bg-red-50 flex items-center justify-center ${isDeleting === displayKey ? 'animate-pulse' : 'opacity-40 group-hover:opacity-100'}`}
                                  title="Remover tarefa"
                                  disabled={!!isDeleting}
                                >
                                  <i className={`fas ${isDeleting === displayKey ? 'fa-spinner fa-spin' : 'fa-trash-alt'}`}></i>
                                </button>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-[#78958c] mt-1">
                                <span className="flex items-center gap-1"><i className="far fa-calendar-alt"></i> {task.data}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-[9px] font-bold text-[#78958c] uppercase mr-1">RETORNO DO LEAD</span>
                            <select 
                              value={task.retorno}
                              onChange={(e) => handleUpdateTaskReturn(task, e.target.value)}
                              className={`text-xs font-bold px-4 py-2 rounded-xl border-none focus:ring-4 focus:ring-[#569481]/10 outline-none cursor-pointer shadow-sm ${task.retorno === 'Sim' ? 'bg-[#569481] text-white' : task.retorno === 'Não' ? 'bg-red-500 text-white' : 'bg-[#ecefea] text-[#243c38]'}`}
                            >
                              <option value="Pendente">Aguardando...</option>
                              <option value="Sim">Sim (Respondeu)</option>
                              <option value="Não">Não (Sem retorno)</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-[#d4d7d2]">
                    <i className="fas fa-comment-slash text-3xl mb-4"></i>
                    <p className="text-sm">Nenhuma atividade registrada.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-[#ecefea] flex items-center justify-end gap-5 bg-[#fbfbfb]">
          <button onClick={onClose} className="px-8 py-2.5 text-sm font-bold text-[#78958c] hover:text-[#243c38]">CANCELAR</button>
          <button onClick={() => onSave(formData)} className="px-12 py-2.5 bg-[#569481] text-white text-sm font-bold rounded-xl shadow-lg hover:bg-[#243c38] transition-all flex items-center gap-2">
            <i className="fas fa-save"></i> SALVAR ALTERAÇÕES
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;
