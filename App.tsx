
import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, Responsible } from './types';
import KanbanBoard from './components/KanbanBoard';
import LeadModal from './components/LeadModal';
import { fetchLeads, updateLeadInStorage } from './services/sheetService';

const App: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Sincronização automática a cada 2 minutos
  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(true), 120000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (force: boolean = false) => {
    if (force) setIsSyncing(true);
    else setLoading(true);

    try {
      const data = await fetchLeads(force);
      setLeads(data);
      setLastSync(new Date());
    } catch (error) {
      console.error("Error loading leads:", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    try {
      // Update local state for immediate feedback
      setLeads(prev => prev.map(l => l.email === updatedLead.email ? updatedLead : l));
      await updateLeadInStorage(updatedLead);
      setSelectedLead(null);
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Erro ao atualizar lead. Verifique sua conexão.");
    }
  };

  const filteredLeads = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    const targetResponsible = filterResponsible.toLowerCase().trim();
    const targetPriority = filterPriority.toLowerCase().trim();

    return leads.filter(lead => {
      // 1. Search filter: RESTRICTED TO NAME (TITLE) AND EMAIL ONLY
      const leadName = (lead.title || '').toLowerCase();
      const leadEmail = (lead.email || '').toLowerCase();
      
      const matchesSearch = !lowerSearch || 
        leadName.includes(lowerSearch) || 
        leadEmail.includes(lowerSearch);

      // 2. Responsible filter
      const leadResponsible = (lead.responsavel || '').toString().toLowerCase().trim();
      const matchesResponsible = !targetResponsible || leadResponsible === targetResponsible;

      // 3. Priority filter
      const leadPriority = (lead.prioridade || '').toString().toLowerCase().trim();
      const matchesPriority = !targetPriority || leadPriority === targetPriority;

      return matchesSearch && matchesResponsible && matchesPriority;
    });
  }, [leads, searchTerm, filterResponsible, filterPriority]);

  return (
    <div className="min-h-screen flex flex-col bg-[#ecefea]">
      {/* Header - Changed background to #ecefea to blend with the app background */}
      <header className="bg-[#ecefea] border-b border-[#78958c]/20 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Bar - Maintained slightly different background to distinguish it */}
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

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white border border-[#d4d7d2] rounded-lg px-3 py-1.5 gap-2 hover:border-[#569481] transition-colors shadow-sm">
                <i className="fas fa-user-tie text-[10px] text-[#569481]"></i>
                <select 
                  className="bg-transparent border-none focus:ring-0 text-xs font-bold text-[#243c38] p-0 cursor-pointer"
                  value={filterResponsible}
                  onChange={(e) => setFilterResponsible(e.target.value)}
                >
                  <option value="">Responsável: Todos</option>
                  <option value={Responsible.GABRIEL}>Gabriel</option>
                  <option value={Responsible.LUCAS}>Lucas</option>
                </select>
              </div>

              <div className="flex items-center bg-white border border-[#d4d7d2] rounded-lg px-3 py-1.5 gap-2 hover:border-[#569481] transition-colors shadow-sm">
                <i className="fas fa-layer-group text-[10px] text-[#569481]"></i>
                <select 
                  className="bg-transparent border-none focus:ring-0 text-xs font-bold text-[#243c38] p-0 cursor-pointer"
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
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-[#78958c] uppercase leading-none mb-1">STATUS BASE DE DADOS</p>
              <p className="text-xs font-medium text-[#243c38] flex items-center justify-end gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-orange-400 animate-pulse' : 'bg-green-500'}`}></span>
                {lastSync ? `Sincronizado: ${lastSync.toLocaleTimeString()}` : 'Desconectado'}
              </p>
            </div>
            <button 
              onClick={() => loadData(true)}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#243c38] bg-white border border-[#d4d7d2] rounded-lg hover:bg-white/80 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <i className={`fas fa-sync-alt ${isSyncing ? 'animate-spin' : ''} text-[#569481]`}></i>
              {isSyncing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar p-6">
        {loading && leads.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#78958c] gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#d4d7d2] border-t-[#569481]"></div>
              <i className="fas fa-database absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#569481]"></i>
            </div>
            <p className="text-lg font-medium animate-pulse">Lendo planilha Google Sheets...</p>
          </div>
        ) : (
          <KanbanBoard 
            leads={filteredLeads} 
            onLeadClick={(lead) => setSelectedLead(lead)}
            onStatusChange={(lead, newStatus) => handleUpdateLead({ ...lead, status: newStatus })}
          />
        )}
      </main>

      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onSave={handleUpdateLead} 
        />
      )}
    </div>
  );
};

export default App;
