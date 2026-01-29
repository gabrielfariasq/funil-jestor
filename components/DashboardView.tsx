
import React, { useMemo } from 'react';
import { Lead, LeadStatus, Task, TaskType } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  tasks: Task[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ leads, tasks }) => {
  const metrics = useMemo(() => {
    // 1. Prospecções
    const pendingProspections = leads.filter(l => l.status === LeadStatus.PENDING).length;
    const ongoingProspections = leads.filter(l => 
      l.status !== LeadStatus.PENDING && 
      l.status !== LeadStatus.WON && 
      l.status !== LeadStatus.LOST && 
      l.status !== LeadStatus.NO_RESPONSE
    ).length;

    // 2. Responsáveis Únicos
    const responsiblesSet = new Set<string>();
    tasks.forEach(t => t.responsavel && responsiblesSet.add(t.responsavel));
    leads.forEach(l => l.responsavel && responsiblesSet.add(l.responsavel));
    const responsibles = Array.from(responsiblesSet).filter(Boolean);
    
    // 3. Estatísticas da Equipe
    const teamStats = responsibles.map(name => {
      const personTasks = tasks.filter(t => t.responsavel === name);
      const abordagens = personTasks.filter(t => t.tarefa === TaskType.ABORDAGEM).length;
      const followUps = personTasks.filter(t => t.tarefa === TaskType.FOLLOW_UP).length;
      return {
        name,
        total: personTasks.length,
        abordagens,
        followUps
      };
    }).sort((a, b) => b.total - a.total);

    // 4. Atividade Diária Empilhada (Últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      // Formato DD/MM/YYYY para bater com o que vem da planilha
      return d.toLocaleDateString('pt-BR');
    }).reverse();

    const dailyActivity = last7Days.map(date => {
      // Filtra tarefas que contenham a data (ignora hora se houver)
      const dayTasks = tasks.filter(t => t.data && t.data.includes(date));
      
      const breakdown = responsibles.map(name => ({
        name,
        count: dayTasks.filter(t => t.responsavel === name).length
      }));

      return { 
        date, 
        total: dayTasks.length, 
        breakdown 
      };
    });

    return {
      pendingProspections,
      ongoingProspections,
      teamStats,
      dailyActivity,
      totalTasks: tasks.length,
      responsibles
    };
  }, [leads, tasks]);

  // Cores fixas para os consultores no gráfico empilhado
  const personColors = ['bg-accent', 'bg-primary/60', 'bg-secondary', 'bg-amber-500', 'bg-blue-500'];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-primary tracking-tight">Performance Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Acompanhamento em tempo real das atividades comerciais</p>
        </header>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pendente Início</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-primary">{metrics.pendingProspections}</span>
              <span className="text-[10px] font-bold text-gray-500 mb-2">leads</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-500 font-bold px-2 py-1 bg-amber-50 rounded-lg w-fit">
              <i className="fas fa-clock"></i> AGUARDANDO
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Em Andamento</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-accent">{metrics.ongoingProspections}</span>
              <span className="text-[10px] font-bold text-gray-500 mb-2">leads</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-accent font-bold px-2 py-1 bg-accent/5 rounded-lg w-fit">
              <i className="fas fa-play"></i> ATIVOS NO FUNIL
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Atividades</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-primary">{metrics.totalTasks}</span>
              <span className="text-[10px] font-bold text-gray-500 mb-2">registros</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-blue-500 font-bold px-2 py-1 bg-blue-50 rounded-lg w-fit">
              <i className="fas fa-history"></i> HISTÓRICO TOTAL
            </div>
          </div>

          <div className="bg-[#243c38] p-6 rounded-2xl shadow-lg border border-primary flex flex-col">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Taxa Conversão (Trial)</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white">
                {leads.length > 0 ? Math.round((leads.filter(l => l.status === LeadStatus.WON).length / leads.length) * 100) : 0}%
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-accent font-bold px-2 py-1 bg-white/10 rounded-lg w-fit">
              <i className="fas fa-trophy"></i> PERFORMANCE GERAL
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Stats Table/Chart */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-users text-accent"></i> Atividade por Consultor
              </h3>
            </div>
            <div className="space-y-6">
              {metrics.teamStats.map(person => (
                <div key={person.name} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700">{person.name}</span>
                    <span className="text-xs font-black text-primary">{person.total} tarefas</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className="h-full bg-accent transition-all duration-1000 ease-out" 
                      style={{ width: `${(person.abordagens / (person.total || 1)) * 100}%` }}
                      title={`Abordagens: ${person.abordagens}`}
                    />
                    <div 
                      className="h-full bg-primary/40 transition-all duration-1000 ease-out" 
                      style={{ width: `${(person.followUps / (person.total || 1)) * 100}%` }}
                      title={`Follow-ups: ${person.followUps}`}
                    />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Abordagens: {person.abordagens}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Follow-up: {person.followUps}</span>
                    </div>
                  </div>
                </div>
              ))}
              {metrics.teamStats.length === 0 && (
                <div className="py-10 text-center text-gray-300">
                  <i className="fas fa-chart-bar text-3xl mb-2 opacity-20"></i>
                  <p className="text-[10px] font-bold uppercase">Sem dados da equipe</p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Activity Chart (STACKED & STANDARDIZED ROUNDING) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-calendar-day text-accent"></i> Atividade Diária Empilhada
                </h3>
              </div>
              {/* Legenda do Gráfico */}
              <div className="flex flex-wrap gap-3">
                {metrics.responsibles.map((name, i) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${personColors[i % personColors.length]}`}></div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-between h-56 gap-3 pt-4 border-b border-gray-100 relative">
              {metrics.dailyActivity.map((day, i) => {
                const maxTotal = Math.max(...metrics.dailyActivity.map(d => d.total), 1);
                const barHeightPct = (day.total / maxTotal) * 100;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute -top-12 bg-primary text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg pointer-events-none">
                      <div className="font-black mb-1 border-b border-white/20 pb-0.5">{day.date}</div>
                      {day.breakdown.map((b, idx) => b.count > 0 && (
                        <div key={idx} className="flex justify-between gap-4">
                          <span>{b.name}:</span>
                          <span>{b.count}</span>
                        </div>
                      ))}
                      <div className="mt-1 pt-0.5 border-t border-white/20 flex justify-between gap-4 font-black">
                        <span>Total:</span>
                        <span>{day.total}</span>
                      </div>
                    </div>

                    {/* Stacked Bars Container */}
                    <div 
                      className="w-full max-w-[32px] flex flex-col-reverse rounded-t-lg overflow-hidden transition-all duration-500 ease-out group-hover:scale-x-110 shadow-sm"
                      style={{ height: day.total > 0 ? `${barHeightPct}%` : '2px' }}
                    >
                      {day.total > 0 ? (
                        day.breakdown.map((b, idx) => {
                          // A altura do segmento é proporcional ao total do dia
                          const segmentHeightPct = (b.count / day.total) * 100;
                          if (b.count === 0) return null;
                          return (
                            <div 
                              key={idx}
                              className={`w-full ${personColors[idx % personColors.length]} hover:brightness-110 transition-all`}
                              style={{ height: `${segmentHeightPct}%` }}
                            />
                          );
                        })
                      ) : (
                        <div className="w-full h-full bg-gray-100/50" />
                      )}
                    </div>

                    {/* Data label */}
                    <span className="absolute -bottom-10 text-[9px] font-bold text-gray-400 rotate-45 origin-left whitespace-nowrap">
                      {day.date.split('/')[0]}/{day.date.split('/')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Espaçamento extra para o label rotacionado */}
            <div className="h-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
