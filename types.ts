
export enum LeadStatus {
  PENDING = 'Pendente',
  CONTACT_ATTEMPT = 'Tentativa de contato',
  MEETING_SCHEDULED = 'Reunião agendada',
  PROPOSAL = 'Proposta',
  WON = 'Ganho',
  LOST = 'Perdido',
  NO_RESPONSE = 'Sem resposta'
}

export enum Responsible {
  GABRIEL = 'Gabriel',
  LUCAS = 'Lucas'
}

export enum Plan {
  HERO = 'Hero',
  PLUS = 'Plus',
  JESTOR = 'Jestor',
  PRO = 'Pro'
}

export enum TaskType {
  ABORDAGEM = 'Abordagem',
  FOLLOW_UP = 'Follow-up'
}

export enum TaskChannel {
  WHATSAPP = 'WhatsApp',
  EMAIL = 'E-mail',
  LIGACAO = 'Ligação'
}

export interface Task {
  id?: string; // Novo ID único da tarefa (Coluna A)
  lead: string; // Nome do lead (Coluna B)
  id_conta?: string; // ID da conta do lead (Coluna C)
  tarefa: TaskType | string;
  canal: TaskChannel | string;
  data: string;
  retorno: string; // "Sim", "Não", "Pendente"
}

export interface Lead {
  email: string;
  creation_datetime?: string;
  trial_end: string;
  dias_de_teste: number;
  qualidade_email: string;
  prioridade: 'Alta' | 'Média' | 'Baixa' | string;
  analise_preliminar: string;
  status: LeadStatus;
  empresa: string;
  motivo_perda?: string;
  segmento: string;
  responsavel: Responsible | string;
  necessidade: string;
  plano: Plan | string;
  numero_usuarios: number;
  observacoes: string;
  apto_consultoria: boolean | string;
  title?: string;
  id_conta?: string;
  telefone?: string;
}

export const STATUS_COLUMNS = [
  LeadStatus.PENDING,
  LeadStatus.CONTACT_ATTEMPT,
  LeadStatus.MEETING_SCHEDULED,
  LeadStatus.PROPOSAL,
  LeadStatus.WON, 
  LeadStatus.LOST,
  LeadStatus.NO_RESPONSE
];
