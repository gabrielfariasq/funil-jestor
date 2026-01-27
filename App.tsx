
import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, Responsible, Task } from './types';
import KanbanBoard from './components/KanbanBoard';
import LeadModal from './components/LeadModal';
import { fetchLeads, fetchTasks, updateLeadInStorage } from './services/sheetService';

const App: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
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

  const filteredLeads = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    return leads.filter(lead => {
      const matchesSearch = !lowerSearch || 
        (lead.title || '').toLowerCase().includes(lowerSearch) || 
        (lead.email || '').toLowerCase().includes(lowerSearch);
      
      const matchesResponsible = !filterResponsible || lead.responsavel === filterResponsible;
      const matchesPriority = !filterPriority || lead.prioridade === filterPriority;

      return matchesSearch && matchesResponsible && matchesPriority;
    });
  }, [leads, searchTerm, filterResponsible, filterPriority]);

  return (
    <div className="h-screen flex flex-col bg-[#ecefea] overflow-hidden">
      <header className="bg-[#ecefea] border-b border-[#78958c]/20 shrink-0 z-10 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[300px] flex items-center bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 border border-[#d4d7d2] hover:border-[#569481] transition-colors">
              <i className="fas fa-search text-[#78958c] mr-3"></i>
              <input
                type="text"
                placeholder="Pesquisar por nome ou email..."
                className="bg-transparent border-none focus:ring-0 w-full text-sm text-[#243c38] placeholder-[#78958c]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select 
                className="bg-white border border-[#d4d7d2] rounded-lg px-3 py-1.5 text-xs font-bold text-[#243c38] hover:border-[#569481] transition-colors shadow-sm"
                value={filterResponsible}
                onChange={(e) => setFilterResponsible(e.target.value)}
              >
                <option value="">Responsável: Todos</option>
                <option value={Responsible.GABRIEL}>Gabriel</option>
                <option value={Responsible.LUCAS}>Lucas</option>
              </select>
              <select 
                className="bg-white border border-[#d4d7d2] rounded-lg px-3 py-1.5 text-xs font-bold text-[#243c38] hover:border-[#569481] transition-colors shadow-sm"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="">Prioridade: Todas</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-[#243c38] flex items-center justify-end gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-orange-400 animate-pulse' : 'bg-green-500'}`}></span>
                {lastSync ? `Sincronizado: ${lastSync.toLocaleTimeString()}` : 'Desconectado'}
              </p>
            </div>
            <button onClick={() => loadData(true)} disabled={isSyncing} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white border border-[#d4d7d2] rounded-lg shadow-sm">
              <i className={`fas fa-sync-alt ${isSyncing ? 'animate-spin' : ''} text-[#569481]`}></i>
              {isSyncing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden p-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#569481]"></div>
          </div>
        ) : (
          <KanbanBoard leads={filteredLeads} onLeadClick={setSelectedLead} onStatusChange={(l, s) => handleUpdateLead({ ...l, status: s })} />
        )}
      </main>
      {selectedLead && (
        <LeadModal 
          lead={selectedLead} 
          tasks={tasks.filter(t => {
            const leadId = (selectedLead.id_conta || '').trim().toLowerCase();
            const taskLeadId = (t.id_conta || '').trim().toLowerCase();
            
            // Filtro por ID de Conta (Prioritário)
            if (leadId && taskLeadId && leadId === taskLeadId) {
              return true;
            }
            
            // Fallback por Nome (Normalizado)
            const leadLabel = (selectedLead.title || selectedLead.empresa || '').toLowerCase().trim();
            const taskLeadLabel = (t.lead || '').toLowerCase().trim();
            return leadLabel !== '' && leadLabel === taskLeadLabel;
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
