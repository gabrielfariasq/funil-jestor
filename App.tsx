
// Adicionando importação do React para resolver o erro 'Cannot find namespace React'
import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, Responsible, Task } from './types';
import KanbanBoard from './components/KanbanBoard';
import LeadModal from './components/LeadModal';
import TasksListView from './components/TasksListView';
import DashboardView from './components/DashboardView';
import { fetchLeads, fetchTasks, updateLeadInStorage } from './services/sheetService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'pipeline' | 'tasks' | 'dashboard'>('pipeline');
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
      console.log("Iniciando carregamento de dados da planilha...");
      const [leadsData, tasksData] = await Promise.all([
        fetchLeads(force),
        fetchTasks()
      ]);
      
      console.log(`Dados carregados: ${leadsData.length} leads, ${tasksData.length} tarefas.`);
      
      setLeads(leadsData);
      setTasks(tasksData);
      setLastSync(new Date());
    } catch (error) {
      console.error("Erro fatal ao carregar dados:", error);
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
        (lead.empresa || '').toLowerCase().includes(lowerSearch) ||
        (lead.telefone || '').toLowerCase().includes(lowerSearch) ||
        (lead.id_conta || '').toLowerCase().includes(lowerSearch);
      
      const matchesResponsible = !filterResponsible || lead.responsavel === filterResponsible;
      const matchesPriority = !filterPriority || lead.prioridade === filterPriority;

      return matchesSearch && matchesResponsible && matchesPriority;
    });
  }, [leads, searchTerm, filterResponsible, filterPriority]);

  return (
    <div className="h-screen flex flex-col bg-[#ecefea] overflow-hidden">
      <header className="bg-[#ecefea] shrink-0 z-20 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center gap-6">
          <nav className="flex items-center bg-white/40 p-1 rounded-xl border border-gray-200/50 shadow-sm">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeView === 'dashboard' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
            >
              <i className="fas fa-chart-line text-[10px]"></i> Dashboard
            </button>
            <button 
              onClick={() => setActiveView('pipeline')}
              className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeView === 'pipeline' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
            >
              <i className="fas fa-columns text-[10px]"></i> Pipeline
            </button>
            <button 
              onClick={() => setActiveView('tasks')}
              className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeView === 'tasks' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
            >
              <i className="fas fa-tasks text-[10px]"></i> Tarefas
            </button>
          </nav>

          <div className="flex-1 max-w-xl flex items-center bg-white/50 rounded-full px-4 py-2 border border-gray-200/50 focus-within:bg-white focus-within:border-accent transition-all shadow-sm">
            <i className="fas fa-search text-gray-400 mr-3 text-sm"></i>
            <input
              type="text"
              placeholder="Pesquisar por nome, email, empresa, telefone ou ID..."
              className="bg-transparent border-none focus:ring-0 w-full text-xs text-primary placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            {activeView !== 'dashboard' && (
              <>
                <select 
                  className="bg-white border border-gray-200/50 rounded-full px-4 py-2 text-[10px] font-bold text-primary hover:border-accent transition-colors shadow-sm outline-none appearance-none min-w-[150px]"
                  value={filterResponsible}
                  onChange={(e) => setFilterResponsible(e.target.value)}
                >
                  <option value="">Responsável: Todos</option>
                  <option value={Responsible.GABRIEL}>Gabriel</option>
                  <option value={Responsible.LUCAS}>Lucas</option>
                </select>
                <select 
                  className="bg-white border border-gray-200/50 rounded-full px-4 py-2 text-[10px] font-bold text-primary hover:border-accent transition-colors shadow-sm outline-none appearance-none min-w-[150px]"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="">Prioridade: Todas</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </>
            )}
            
            <button 
              onClick={() => loadData(true)} 
              disabled={isSyncing} 
              className="p-2 text-gray-400 hover:text-accent transition-colors flex items-center gap-2"
              title="Sincronizar com a planilha"
            >
              <i className={`fas fa-sync-alt ${isSyncing ? 'animate-spin' : ''}`}></i>
              {isSyncing && <span className="text-[9px] font-bold uppercase">Sincronizando...</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent"></div>
            <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recuperando dados da planilha...</p>
            <p className="mt-2 text-[9px] text-gray-400 italic">Isso pode levar alguns segundos após a limpeza do cache</p>
          </div>
        ) : (
          activeView === 'pipeline' ? (
            <KanbanBoard 
              leads={filteredLeads} 
              onLeadClick={(lead) => handleOpenLead(lead, 'overview')} 
              onStatusChange={(l, s) => handleUpdateLead({ ...l, status: s })} 
            />
          ) : activeView === 'tasks' ? (
            <TasksListView 
              tasks={tasks} 
              leads={leads} 
              searchTerm={searchTerm}
              filterResponsible={filterResponsible}
              onTaskClick={(lead) => handleOpenLead(lead, 'tasks')}
            />
          ) : (
            <DashboardView 
              leads={leads}
              tasks={tasks}
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
