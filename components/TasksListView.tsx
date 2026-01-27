
import React, { useMemo } from 'react';
import { Task, Lead } from '../types';

interface TasksListViewProps {
  tasks: Task[];
  leads: Lead[];
  searchTerm: string;
  filterResponsible: string;
  onTaskClick: (lead: Lead) => void;
}

const TasksListView: React.FC<TasksListViewProps> = ({ tasks, leads, searchTerm, filterResponsible, onTaskClick }) => {
  const filteredTasks = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    
    return tasks.filter(task => {
      const relatedLead = leads.find(l => 
        (l.id_conta && task.id_conta && l.id_conta === task.id_conta) || 
        (l.title || l.empresa || l.email) === task.lead
      );

      const matchesSearch = !lowerSearch || 
        (task.lead || '').toLowerCase().includes(lowerSearch) || 
        (task.tarefa || '').toLowerCase().includes(lowerSearch) ||
        (relatedLead?.empresa || '').toLowerCase().includes(lowerSearch);

      const matchesResponsible = !filterResponsible || (relatedLead?.responsavel === filterResponsible);

      return matchesSearch && matchesResponsible;
    }).reverse(); // Most recent first
  }, [tasks, leads, searchTerm, filterResponsible]);

  const getChannelColor = (channel: string) => {
    const c = (channel || '').toLowerCase();
    if (c.includes('whatsapp')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (c.includes('mail')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (c.includes('ligação') || c.includes('call')) return 'bg-orange-50 text-orange-600 border-orange-100';
    return 'bg-purple-50 text-purple-600 border-purple-100';
  };

  const getPriorityInfo = (priority: string) => {
    switch(priority) {
      case 'Alta': return { label: 'HIGH', color: 'text-rose-600 bg-rose-50 border-rose-100' };
      case 'Média': return { label: 'MEDIUM', color: 'text-amber-600 bg-amber-50 border-amber-100' };
      default: return { label: 'LOW', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between sticky top-0 bg-[#ecefea] py-4 z-10">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Tarefas de prospecção</h2>
          <p className="text-sm text-gray-500 mt-1">Registre suas tentativas de contato</p>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-bold text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
             {filteredTasks.length} Atividades
           </span>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task, index) => {
            const relatedLead = leads.find(l => 
              (l.id_conta && task.id_conta && l.id_conta === task.id_conta) || 
              (l.title || l.empresa || l.email) === task.lead
            );
            
            const priorityInfo = getPriorityInfo(relatedLead?.prioridade || 'Baixa');
            const channelClass = getChannelColor(task.canal);

            return (
              <div 
                key={task.id || index}
                onClick={() => relatedLead && onTaskClick(relatedLead)}
                className="group bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className="shrink-0">
                    <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-colors ${task.retorno === 'Sim' ? 'bg-accent border-accent' : 'border-gray-200 group-hover:border-gray-300'}`}>
                      {task.retorno === 'Sim' && <i className="fas fa-check text-[8px] text-white"></i>}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-primary text-[14px] truncate">
                      {task.tarefa} com {relatedLead?.empresa || task.lead}
                    </h4>
                    <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                        <i className="far fa-calendar-alt"></i>
                        <span>{task.data}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                        <span className="font-medium">Related to:</span>
                        <span className="text-accent font-bold hover:underline">{relatedLead?.empresa || task.lead}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className={`text-[9px] font-bold px-3 py-1 rounded border flex items-center gap-1.5 ${priorityInfo.color}`}>
                    <i className="fas fa-flag text-[8px]"></i>
                    {priorityInfo.label}
                  </span>
                  <span className={`text-[9px] font-bold px-4 py-1 rounded-full border uppercase ${channelClass}`}>
                    {task.canal.split(' ')[0].toLowerCase()}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400 bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
            <i className="fas fa-clipboard-check text-5xl mb-4 opacity-20"></i>
            <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma tarefa para listar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksListView;
