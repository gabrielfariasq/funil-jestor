
import React from 'react';
import { Lead, LeadStatus, STATUS_COLUMNS } from '../types';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (lead: Lead, newStatus: LeadStatus) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, onLeadClick, onStatusChange }) => {
  // Utilizamos a constante centralizada em vez de repetir a lista
  const columns = STATUS_COLUMNS;

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
      {columns.map(status => (
        <KanbanColumn 
          key={status}
          status={status}
          leads={leads.filter(lead => lead.status === status)}
          onLeadClick={onLeadClick}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
};

export default KanbanBoard;
