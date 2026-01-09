
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import LeadCard from './LeadCard';

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (lead: Lead, newStatus: LeadStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, leads, onLeadClick, onStatusChange }) => {
  const [isOver, setIsOver] = useState(false);

  // Sort leads by priority within the column (Alta first)
  const sortedLeads = [...leads].sort((a, b) => {
    if (a.prioridade === 'Alta' && b.prioridade !== 'Alta') return -1;
    if (a.prioridade !== 'Alta' && b.prioridade === 'Alta') return 1;
    return 0;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const leadData = e.dataTransfer.getData('lead');
    if (leadData) {
      try {
        const lead: Lead = JSON.parse(leadData);
        if (lead.status !== status) {
          onStatusChange(lead, status);
        }
      } catch (err) {
        console.error("Erro ao processar drop:", err);
      }
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col w-80 shrink-0 bg-[#d4d7d2]/20 rounded-xl border overflow-hidden transition-colors duration-200
        ${isOver ? 'border-[#569481] bg-[#569481]/5' : 'border-[#78958c]/20'}
      `}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b transition-colors ${isOver ? 'bg-[#569481]/10 border-[#569481]/30' : 'bg-white/50 border-[#78958c]/20'}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isOver ? 'bg-orange-400 animate-pulse' : 'bg-[#569481]'}`}></span>
          <h3 className="font-bold text-xs text-[#243c38] uppercase tracking-widest">{status}</h3>
          <span className="ml-1 bg-[#243c38] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
        {sortedLeads.length > 0 ? (
          sortedLeads.map(lead => (
            <LeadCard 
              key={lead.email} 
              lead={lead} 
              onClick={() => onLeadClick(lead)} 
            />
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#78958c] py-10 opacity-40">
            <i className="fas fa-inbox text-2xl mb-2"></i>
            <span className="text-[10px] font-bold uppercase tracking-widest">Vazio</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
