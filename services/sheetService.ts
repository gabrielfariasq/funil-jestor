
import { Lead, LeadStatus, Responsible, Plan, Task } from '../types';

const SHEET_ID = '1NMWnFu5MUxM1xFoFMkhg27RLF8_WIfgaGPOBAWAMyoE';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypz2uap6sGZzG3lznqHsGDNXJh_yzIUPekc4bbsQjRGO9J1fsWBtBXkRVq2g8521DiZw/exec'; 

const LEADS_GID = '0';
const TASKS_GID = '2119020961'; 

const STORAGE_KEY_LEADS = 'jestor_leads_cache_v3';
const STORAGE_KEY_TASKS = 'jestor_tasks_cache_v3';

const generateId = () => Math.random().toString(36).substr(2, 9).toUpperCase();

/**
 * Normaliza uma string removendo acentos, espaços e convertendo para minúsculas.
 * Essencial para mapear colunas como "Responsável" para "responsavel".
 */
function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s/g, '');
}

export async function fetchLeads(forceRefresh = false): Promise<Lead[]> {
  try {
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${LEADS_GID}&t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Falha leads');
    const csvText = await response.text();
    const leads = parseCsvToLeads(csvText);
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    return leads;
  } catch (error) {
    const cached = localStorage.getItem(STORAGE_KEY_LEADS);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function fetchTasks(): Promise<Task[]> {
  try {
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${TASKS_GID}&t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Falha tarefas');
    const csvText = await response.text();
    const tasks = parseCsvToTasks(csvText);
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    return tasks;
  } catch (error) {
    const cached = localStorage.getItem(STORAGE_KEY_TASKS);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function updateLeadInStorage(updatedLead: Lead): Promise<void> {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'update_lead', ...updatedLead })
    });
  } catch (e) {
    console.error(e);
  }
}

export async function saveTaskToStorage(task: Task): Promise<void> {
  const taskWithId = { ...task, id: task.id || generateId() };
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'add_task', ...taskWithId })
    });
    const cached = localStorage.getItem(STORAGE_KEY_TASKS);
    const tasks = cached ? JSON.parse(cached) : [];
    tasks.push(taskWithId);
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error(e);
  }
}

export async function updateTaskReturnInStorage(task: Task): Promise<void> {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'update_task_return', ...task })
    });
    const cached = localStorage.getItem(STORAGE_KEY_TASKS);
    if (cached) {
      const tasks: Task[] = JSON.parse(cached);
      const updatedTasks = tasks.map(t => t.id === task.id ? task : t);
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updatedTasks));
    }
  } catch (e) {
    console.error(e);
  }
}

export async function deleteTaskFromStorage(task: Task): Promise<void> {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'delete_task', ...task })
    });
    const cached = localStorage.getItem(STORAGE_KEY_TASKS);
    if (cached) {
      const tasks: Task[] = JSON.parse(cached);
      const updatedTasks = tasks.filter(t => t.id !== task.id);
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updatedTasks));
    }
  } catch (e) {
    console.error(e);
  }
}

function parseCsvToLeads(csv: string): Lead[] {
  const lines = csv.split(/\r?\n/);
  if (lines.length < 2) return [];
  
  const splitCsv = (line: string) => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
  
  const headers = splitCsv(lines[0]).map(h => normalizeString(h));
  
  return lines.slice(1).map((line): Lead | null => {
    if (!line.trim()) return null;
    const cells = splitCsv(line);
    
    const get = (name: string) => {
      const search = normalizeString(name);
      const idx = headers.findIndex(h => h === search || h.includes(search));
      return idx !== -1 ? cells[idx] : '';
    };
    
    return {
      email: get('email'),
      creation_datetime: get('creation'),
      trial_end: get('trial'),
      dias_de_teste: parseInt(get('dias')) || 0,
      qualidade_email: get('qualidade'),
      prioridade: get('prioridade'),
      analise_preliminar: get('analise'),
      status: mapStatus(get('status')),
      empresa: get('empresa'),
      segmento: get('segmento'),
      responsavel: get('responsavel'),
      necessidade: get('necessidade'),
      plano: get('plano'),
      numero_usuarios: parseInt(get('usuarios')) || 0,
      observacoes: get('observacoes'),
      apto_consultoria: get('apto') === 'Sim',
      title: get('title'),
      telefone: get('telefone'),
      id_conta: get('idconta')
    };
  }).filter((l): l is Lead => l !== null && !!l.email);
}

function parseCsvToTasks(csv: string): Task[] {
  const lines = csv.split(/\r?\n/);
  if (lines.length < 2) return [];

  const splitCsv = (line: string) => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
  
  const headers = splitCsv(lines[0]).map(h => normalizeString(h));
  
  return lines.slice(1).map((line): Task | null => {
    if (!line.trim()) return null;
    const cells = splitCsv(line);
    
    const get = (name: string) => {
      const search = normalizeString(name);
      const idx = headers.findIndex(h => h === search || h.includes(search));
      return idx !== -1 ? cells[idx] : '';
    };
    
    return {
      id: get('id'),
      lead: get('lead'),
      id_conta: get('idconta'),
      tarefa: get('tarefa'),
      canal: get('canal'),
      data: get('data'),
      retorno: get('retorno'),
      responsavel: get('responsavel') // Novo mapeamento da Coluna H
    };
  }).filter((t): t is Task => t !== null && (!!t.lead || !!t.id_conta || !!t.id));
}

function mapStatus(val: string): LeadStatus {
  const v = normalizeString(val);
  if (v.includes('pendente')) return LeadStatus.PENDING;
  if (v.includes('tentativa')) return LeadStatus.CONTACT_ATTEMPT;
  if (v.includes('emcontato')) return LeadStatus.EM_CONTATO;
  if (v.includes('reuniao')) return LeadStatus.MEETING_SCHEDULED;
  if (v.includes('proposta')) return LeadStatus.PROPOSAL;
  if (v.includes('ganho')) return LeadStatus.WON;
  if (v.includes('perdido')) return LeadStatus.LOST;
  if (v.includes('descartado') || v.includes('semresposta')) return LeadStatus.NO_RESPONSE;
  return LeadStatus.NO_RESPONSE;
}
