
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
    
    const activeLeadsList = leads.filter(l => 
      l.status !== LeadStatus.PENDING && 
      l.status !== LeadStatus.WON && 
      l.status !== LeadStatus.LOST && 
      l.status !== LeadStatus.NO_RESPONSE
    );
    const ongoingProspections = activeLeadsList.length;

    // 2. Responsáveis Únicos
    const responsiblesSet = new Set<string>();
    tasks.forEach(t => t.responsavel && responsiblesSet.add(t.responsavel));
    leads.forEach(l => l.responsavel && responsiblesSet.add(l.responsavel));
    const responsibles = Array.from(responsiblesSet).filter(Boolean);
    
    // 3. Estatísticas da Equipe (Atividades)
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

    // 4. Distribuição de Leads Ativos por Responsável
    const activeLeadsByResponsible = responsibles.map(name => {
      const count = activeLeadsList.filter(l => l.responsavel === name).length;
      return { name, count };
    }).sort((a, b) => b.count - a.count);

    // 5. Atividade Diária Empilhada (Últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('pt-BR');
    }).reverse();

    const dailyActivity = last7Days.map(date => {
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
      activeLeadsByResponsible,
      dailyActivity,
      totalTasks: tasks.length,
      responsibles
    };
  }, [leads, tasks]);

  const personColors = ['bg-accent', 'bg-primary/60', 'bg-secondary', 'bg-amber-500', 'bg-blue-500'];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-8 animate-in fade-in duration-500">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-primary tracking-tight">Performance Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Acompanhamento em tempo real das atividades comerciais</p>
        </header>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pendente Início</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-primary">{metrics.pendingProspections}</span>
              <span className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase">Leads</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[9px] text-amber-500 font-bold px-2 py-1 bg-amber-50 rounded-lg w-fit">
              <i className="fas fa-clock"></i> AGUARDANDO
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Em Andamento</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-accent">{metrics.ongoingProspections}</span>
              <span className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase">Leads</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[9px] text-accent font-bold px-2 py-1 bg-accent/5 rounded-lg w-fit">
              <i className="fas fa-play"></i> ATIVOS NO FUNIL
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Atividades</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-primary">{metrics.totalTasks}</span>
              <span className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase">Registros</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[9px] text-blue-500 font-bold px-2 py-1 bg-blue-50 rounded-lg w-fit">
              <i className="fas fa-history"></i> HISTÓRICO TOTAL
            </div>
          </div>

          <div className="bg-[#243c38] p-5 rounded-2xl shadow-lg border border-primary flex flex-col justify-between">
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-1">Taxa Conversão</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white">
                {leads.length > 0 ? Math.round((leads.filter(l => l.status === LeadStatus.WON).length / leads.length) * 100) : 0}%
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[9px] text-accent font-bold px-2 py-1 bg-white/10 rounded-lg w-fit">
              <i className="fas fa-trophy"></i> PERFORMANCE
            </div>
          </div>
        </div>

        {/* Main Grid: items-stretch to match heights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT COLUMN: Daily Activity */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
              <div className="flex flex-col gap-4 mb-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-calendar-day text-accent"></i> Atividade Diária (7 dias)
                  </h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {metrics.responsibles.map((name, i) => (
                    <div key={name} className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${personColors[i % personColors.length]}`}></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex items-end justify-between gap-4 pt-4 border-b border-gray-100 relative mb-12">
                {metrics.dailyActivity.map((day, i) => {
                  const maxTotal = Math.max(...metrics.dailyActivity.map(d => d.total), 1);
                  const barHeightPct = (day.total / maxTotal) * 100;
                  
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div className="absolute -top-14 bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl pointer-events-none">
                        <div className="font-black mb-1.5 border-b border-white/20 pb-1">{day.date}</div>
                        {day.breakdown.map((b, idx) => b.count > 0 && (
                          <div key={idx} className="flex justify-between gap-6 py-0.5">
                            <span className="opacity-80">{b.name}:</span>
                            <span className="font-black">{b.count}</span>
                          </div>
                        ))}
                        <div className="mt-1.5 pt-1.5 border-t border-white/20 flex justify-between gap-6 font-black text-accent">
                          <span>Total:</span>
                          <span>{day.total}</span>
                        </div>
                      </div>

                      <div 
                        className="w-full max-w-[42px] flex flex-col-reverse rounded-t-xl overflow-hidden transition-all duration-500 ease-out group-hover:scale-x-110 shadow-sm"
                        style={{ height: day.total > 0 ? `${barHeightPct}%` : '4px' }}
                      >
                        {day.total > 0 ? (
                          day.breakdown.map((b, idx) => {
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
                          <div className="w-full h-full bg-gray-100/30" />
                        )}
                      </div>

                      <span className="absolute -bottom-12 text-[10px] font-bold text-gray-400 rotate-45 origin-left whitespace-nowrap">
                        {day.date.split('/')[0]}/{day.date.split('/')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Team Metrics (Sidebar) */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            
            {/* Team Activity Widget - flex-1 to occupy half */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 mb-6 shrink-0">
                <i className="fas fa-users text-accent"></i> Ranking de Atividade
              </h3>
              <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
                {metrics.teamStats.map((person, idx) => (
                  <div key={person.name} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${personColors[idx % personColors.length]}`}></div>
                        <span className="text-xs font-bold text-gray-700">{person.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-gray-50 rounded-full">{person.total} tarefas</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                      <div 
                        className="h-full bg-accent" 
                        style={{ width: `${(person.abordagens / (person.total || 1)) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-primary/40" 
                        style={{ width: `${(person.followUps / (person.total || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Abordagens: {person.abordagens}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Follow-up: {person.followUps}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leads Distribution Widget - flex-1 to occupy other half */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-funnel-dollar text-accent"></i> Leads Ativos
                </h3>
                <span className="text-[10px] font-black text-accent">{metrics.ongoingProspections} Total</span>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar">
                {metrics.activeLeadsByResponsible.map((person, idx) => {
                  const pct = metrics.ongoingProspections > 0 ? (person.count / metrics.ongoingProspections) * 100 : 0;
                  return (
                    <div key={person.name} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600">{person.name}</span>
                        <span className="text-xs font-black text-primary">{person.count} <span className="text-[9px] opacity-40 uppercase">leads</span></span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${personColors[idx % personColors.length]}`} 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                        {Math.round(pct)}% da carga total
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
