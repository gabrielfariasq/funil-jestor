
export enum LeadStatus {
  PENDING = 'Pendente',
  CONTACT_ATTEMPT = 'Tentativa de contato',
  EM_CONTATO = 'Em contato',
  MEETING_SCHEDULED = 'Reunião agendada',
  PROPOSAL = 'Proposta',
  WON = 'Ganho',
  LOST = 'Perdido',
  NO_RESPONSE = 'Descartado'
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
  id?: string; // ID único da tarefa (Coluna A)
  lead: string; // Nome do lead (Coluna B)
  id_conta?: string; // ID da conta do lead (Coluna C)
  tarefa: TaskType | string; // (Coluna D)
  canal: TaskChannel | string; // (Coluna E)
  data: string; // (Coluna F)
  retorno: string; // (Coluna G)
  responsavel?: string; // Responsável pela tarefa (Coluna H)
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
  LeadStatus.EM_CONTATO,
  LeadStatus.MEETING_SCHEDULED,
  LeadStatus.PROPOSAL,
  LeadStatus.WON, 
  LeadStatus.LOST,
  LeadStatus.NO_RESPONSE
];
