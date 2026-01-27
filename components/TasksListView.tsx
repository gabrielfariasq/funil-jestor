
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
    if (c.includes('whatsapp')) return 'bg-green-100 text-green-700';
    if (c.includes('mail')) return 'bg-blue-100 text-blue-700';
    if (c.includes('ligação') || c.includes('call')) return 'bg-orange-100 text-orange-700';
    return 'bg-purple-100 text-purple-700';
  };

  const getPriorityInfo = (priority: string) => {
    switch(priority) {
      case 'Alta': return { label: 'high', color: 'text-red-500 bg-red-50 border-red-100' };
      case 'Média': return { label: 'medium', color: 'text-yellow-600 bg-yellow-50 border-yellow-100' };
      default: return { label: 'low', color: 'text-green-600 bg-green-50 border-green-100' };
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-10 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between sticky top-0 bg-[#ecefea] py-2 z-10">
        <div>
          <h2 className="text-2xl font-bold text-primary">Tasks & Activities</h2>
          <p className="text-sm text-[#78958c]">Gerencie sua lista de afazeres e acompanhamentos</p>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-xs font-bold text-primary bg-white px-3 py-1.5 rounded-lg shadow-sm border border-[#d4d7d2]">
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
                className="group bg-white border border-transparent hover:border-accent/30 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className="shrink-0">
                    <div className="w-5 h-5 border-2 border-[#d4d7d2] rounded group-hover:border-accent transition-colors flex items-center justify-center">
                      {task.retorno === 'Sim' && <i className="fas fa-check text-[10px] text-accent"></i>}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-primary text-base truncate group-hover:text-accent transition-colors">
                      {task.tarefa} com {relatedLead?.empresa || task.lead}
                    </h4>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-1.5">
                      <div className="flex items-center gap-2 text-[#78958c] text-xs">
                        <i className="far fa-calendar-alt"></i>
                        <span>{task.data}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#78958c] text-xs">
                        <span className="font-medium">Related to:</span>
                        <span className="text-accent font-bold hover:underline">{relatedLead?.empresa || task.lead}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 shrink-0 ml-4">
                  {relatedLead?.responsavel && (
                    <div className="flex items-center gap-3 bg-[#ecefea]/30 px-3 py-1.5 rounded-xl border border-[#d4d7d2]/30">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                        {relatedLead.responsavel.charAt(0)}
                      </div>
                      <span className="text-[11px] font-bold text-primary">{relatedLead.responsavel}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 min-w-[140px] justify-end">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase flex items-center gap-1.5 ${priorityInfo.color}`}>
                      <i className="fas fa-flag text-[8px]"></i>
                      {priorityInfo.label}
                    </span>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${channelClass}`}>
                      {task.canal.split(' ')[0].toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-[#78958c] bg-white/50 rounded-3xl border border-dashed border-[#d4d7d2]">
            <i className="fas fa-search-minus text-4xl mb-4 opacity-20"></i>
            <p className="text-sm font-bold uppercase tracking-widest opacity-50">Nenhuma tarefa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksListView;
