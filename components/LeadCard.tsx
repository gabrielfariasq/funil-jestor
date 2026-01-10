import React from 'react';
import { Lead } from '../types';
import { PRIORITY_COLORS } from '../constants';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick }) => {
  const isHighPriority = lead.prioridade === 'Alta';
  // Fallback visual apenas para o título do card
  const displayTitle = lead.empresa || lead.title || lead.email.split('@')[0];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('lead', JSON.stringify(lead));
    e.dataTransfer.effectAllowed = 'move';
    // Adiciona uma classe visual temporária ou opacidade
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  // Helper logic to decide if the segment field should be displayed
  const hasValidSegment = lead.segmento && lead.segmento.trim() !== '' && lead.segmento.toLowerCase() !== 'não inf.';
  const hasResponsible = !!lead.responsavel;

  return (
    <div 
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group relative bg-[#d4d7d2] p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-lg active:scale-[0.98]
        ${isHighPriority ? 'border-[#243c38]/30 shadow-sm shadow-[#243c38]/10' : 'border-transparent hover:border-[#78958c]/30 shadow-sm'}
      `}
    >
      {isHighPriority && (
        <div className="absolute top-0 right-0 p-2">
          <div className="flex items-center justify-center w-5 h-5 bg-[#243c38] text-white rounded-full text-[10px]">
            <i className="fas fa-bolt"></i>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Title / Company */}
        <div>
          <h4 className="font-bold text-[#243c38] leading-tight group-hover:text-[#569481] transition-colors">
            {displayTitle}
          </h4>
          <p className="text-[11px] text-[#243c38]/60 mt-0.5 truncate">{lead.email}</p>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-2 mt-1">
          {lead.prioridade && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${PRIORITY_COLORS[lead.prioridade] || 'bg-[#78958c]/20 text-[#243c38]'}`}>
              {lead.prioridade}
            </span>
          )}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#569481]/10 text-[#569481] uppercase border border-[#569481]/20">
            {lead.qualidade_email}
          </span>
        </div>

        {/* Info Row - Only render if there's at least one valid info piece */}
        {(hasValidSegment || hasResponsible) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#243c38]/10 mt-1">
            {hasValidSegment ? (
              <div className="flex items-center gap-1 text-[#78958c]">
                <i className="fas fa-industry text-[10px]"></i>
                <span className="text-[10px] font-medium truncate max-w-[100px] text-[#243c38]/70">{lead.segmento}</span>
              </div>
            ) : <div />}
            
            {hasResponsible && (
              <div className="flex items-center gap-1 text-[#78958c]">
                <i className="fas fa-user-tie text-[10px]"></i>
                <span className="text-[10px] font-bold text-[#243c38] truncate max-w-[100px]">{lead.responsavel}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadCard;