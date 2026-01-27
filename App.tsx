
import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, Responsible, Task } from './types';
import KanbanBoard from './components/KanbanBoard';
import LeadModal from './components/LeadModal';
import TasksListView from './components/TasksListView';
import { fetchLeads, fetchTasks, updateLeadInStorage } from './services/sheetService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'pipeline' | 'tasks'>('pipeline');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [initialModalTab, setInitialModalTab] = useState<'overview' | 'tasks'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    loadData(false);
  }, []);

  const loadData = async (force: boolean = false) => {
    if (force) setIsSyncing(true);
    else setLoading(true);

    try {
      const [leadsData, tasksData] = await Promise.all([
        fetchLeads(force),
        fetchTasks()
      ]);
      setLeads(leadsData);
      setTasks(tasksData);
      setLastSync(new Date());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.email === updatedLead.email ? updatedLead : l));
    await updateLeadInStorage(updatedLead);
    setSelectedLead(null);
  };

  const handleRefreshTasks = async () => {
    const tasksData = await fetchTasks();
    setTasks(tasksData);
  };

  const handleOpenLead = (lead: Lead, tab: 'overview' | 'tasks' = 'overview') => {
    setSelectedLead(lead);
    setInitialModalTab(tab);
  };

  const filteredLeads = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    return leads.filter(lead => {
      const matchesSearch = !lowerSearch || 
        (lead.title || '').toLowerCase().includes(lowerSearch) || 
        (lead.email || '').toLowerCase().includes(lowerSearch) ||
        (lead.empresa || '').toLowerCase().includes(lowerSearch);
      
      const matchesResponsible = !filterResponsible || lead.responsavel === filterResponsible;
      const matchesPriority = !filterPriority || lead.prioridade === filterPriority;

      return matchesSearch && matchesResponsible && matchesPriority;
    });
  }, [leads, searchTerm, filterResponsible, filterPriority]);

  return (
    <div className="h-screen flex flex-col bg-[#ecefea] overflow-hidden">
      <header className="bg-white border-b border-[#78958c]/20 shrink-0 z-20 px-6 py-3 shadow-sm">
        <div className="max-w-[1800px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <i className="fas fa-chart-line text-sm"></i>
              </div>
              <h1 className="font-bold text-primary tracking-tight hidden md:block">Tenx Sales</h1>
            </div>

            <nav className="flex items-center bg-[#ecefea]/50 p-1 rounded-xl border border-[#d4d7d2]/30">
              <button 
                onClick={() => setActiveView('pipeline')}
                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${activeView === 'pipeline' ? 'bg-white text-primary shadow-sm' : 'text-[#78958c] hover:text-primary'}`}
              >
                <i className="fas fa-columns mr-2"></i> Pipeline
              </button>
              <button 
                onClick={() => setActiveView('tasks')}
                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${activeView === 'tasks' ? 'bg-white text-primary shadow-sm' : 'text-[#78958c] hover:text-primary'}`}
              >
                <i className="fas fa-tasks mr-2"></i> Tarefas
              </button>
            </nav>
          </div>

          <div className="flex flex-1 items-center gap-3">
            <div className="flex-1 max-w-md flex items-center bg-[#ecefea]/50 rounded-full px-4 py-2 border border-[#d4d7d2] focus-within:border-accent transition-colors">
              <i className="fas fa-search text-[#78958c] mr-3 text-sm"></i>
              <input
                type="text"
                placeholder="Pesquisar..."
                className="bg-transparent border-none focus:ring-0 w-full text-xs text-primary placeholder-[#78958c]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-white border border-[#d4d7d2] rounded-lg px-3 py-1.5 text-[10px] font-bold text-primary hover:border-accent transition-colors shadow-sm outline-none"
              value={filterResponsible}
              onChange={(e) => setFilterResponsible(e.target.value)}
            >
              <option value="">Responsável: Todos</option>
              <option value={Responsible.GABRIEL}>Gabriel</option>
              <option value={Responsible.LUCAS}>Lucas</option>
            </select>
            <select 
              className="bg-white border border-[#d4d7d2] rounded-lg px-3 py-1.5 text-[10px] font-bold text-primary hover:border-accent transition-colors shadow-sm outline-none"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">Prioridade: Todas</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
            
            <button onClick={() => loadData(true)} disabled={isSyncing} className="p-2 text-[#78958c] hover:text-accent transition-colors">
              <i className={`fas fa-sync-alt ${isSyncing ? 'animate-spin' : ''}`}></i>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
            <p className="mt-4 text-xs font-bold text-[#78958c] uppercase tracking-widest">Carregando dados...</p>
          </div>
        ) : (
          activeView === 'pipeline' ? (
            <KanbanBoard 
              leads={filteredLeads} 
              onLeadClick={(lead) => handleOpenLead(lead, 'overview')} 
              onStatusChange={(l, s) => handleUpdateLead({ ...l, status: s })} 
            />
          ) : (
            <TasksListView 
              tasks={tasks} 
              leads={leads} 
              searchTerm={searchTerm}
              filterResponsible={filterResponsible}
              onTaskClick={(lead) => handleOpenLead(lead, 'tasks')}
            />
          )
        )}
      </main>

      {selectedLead && (
        <LeadModal 
          lead={selectedLead} 
          initialTab={initialModalTab}
          tasks={tasks.filter(t => {
            const leadId = (selectedLead.id_conta || '').trim().toLowerCase();
            const taskLeadId = (t.id_conta || '').trim().toLowerCase();
            if (leadId && taskLeadId) return leadId === taskLeadId;
            const leadLabel = (selectedLead.title || selectedLead.empresa || '').toLowerCase().trim();
            const taskLeadLabel = (t.lead || '').toLowerCase().trim();
            return leadLabel === taskLeadLabel;
          })}
          onClose={() => setSelectedLead(null)} 
          onSave={handleUpdateLead}
          onRefreshTasks={handleRefreshTasks}
        />
      )}
    </div>
  );
};

export default App;
