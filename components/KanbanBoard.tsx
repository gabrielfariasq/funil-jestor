
import React from 'react';
import { Lead, LeadStatus } from '../types';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (lead: Lead, newStatus: LeadStatus) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, onLeadClick, onStatusChange }) => {
  const columns = [
    LeadStatus.PENDING,
    LeadStatus.CONTACT_ATTEMPT,
    LeadStatus.MEETING_SCHEDULED,
    LeadStatus.PROPOSAL,
    LeadStatus.WON,
    LeadStatus.LOST,
    LeadStatus.NO_RESPONSE
  ];

  return (
    <div className="flex gap-6 h-full pb-4">
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
