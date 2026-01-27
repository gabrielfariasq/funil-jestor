
import React from 'react';
import { LeadStatus } from './types';

export const STATUS_COLORS: Record<string, string> = {
  [LeadStatus.PENDING]: 'bg-gray-100 text-gray-700 border-gray-200',
  [LeadStatus.CONTACT_ATTEMPT]: 'bg-blue-50 text-blue-700 border-blue-200',
  [LeadStatus.EM_CONTATO]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [LeadStatus.MEETING_SCHEDULED]: 'bg-purple-50 text-purple-700 border-purple-200',
  [LeadStatus.PROPOSAL]: 'bg-orange-50 text-orange-700 border-orange-200',
  [LeadStatus.WON]: 'bg-green-100 text-green-800 border-green-200',
  [LeadStatus.LOST]: 'bg-red-50 text-red-700 border-red-200',
  [LeadStatus.NO_RESPONSE]: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const PRIORITY_COLORS: Record<string, string> = {
  'Alta': 'bg-red-100 text-red-800 border-red-200',
  'Média': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Baixa': 'bg-green-100 text-green-800 border-green-200',
};
