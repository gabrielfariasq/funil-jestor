
import { Lead, LeadStatus, Responsible, Plan, Task } from '../types';

const SHEET_ID = '1NMWnFu5MUxM1xFoFMkhg27RLF8_WIfgaGPOBAWAMyoE';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_0pZfhFZ3UNVRxggtvhOJ7IJ5ass58zfGJYTM4MrCk1z7f_JPHvU5nFOIPRhNgyc-4w/exec'; 

// GIDs das abas atualizados conforme informação do usuário
const LEADS_GID = '0';
const TASKS_GID = '706654094'; 

const STORAGE_KEY_LEADS = 'jestor_leads_cache_v3';
const STORAGE_KEY_TASKS = 'jestor_tasks_cache_v3';

const generateId = () => Math.random().toString(36).substr(2, 9).toUpperCase();

function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s/g, '');
}

/**
 * Detecta o separador mais provável (vírgula ou ponto e vírgula) e divide a linha.
 */
function splitCsv(line: string, separator?: string): string[] {
  if (!line) return [];
  // Se o separador não for fornecido, tenta detectar pela linha
  const sep = separator || (line.split(';').length > line.split(',').length ? ';' : ',');
  
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === sep && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(v => v.replace(/^"|"$/g, '').trim());
}

export async function fetchLeads(forceRefresh = false): Promise<Lead[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${LEADS_GID}&t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) throw new Error(`Erro Leads: HTTP ${response.status}`);
    
    const csvText = await response.text();
    
    if (csvText.trim().startsWith('<!DOCTYPE')) {
      console.warn("Recebido HTML em Leads. Verifique se a planilha está pública para 'Qualquer pessoa com o link'.");
      throw new Error("Acesso negado.");
    }

    const leads = parseCsvToLeads(csvText);
    if (leads.length > 0) {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    }
    return leads;
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    const cached = localStorage.getItem(STORAGE_KEY_LEADS);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function fetchTasks(): Promise<Task[]> {
  try {
    // Usando o GID fornecido pelo usuário para a aba de tarefas
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${TASKS_GID}&t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) throw new Error(`Erro Tarefas: HTTP ${response.status}`);
    
    const csvText = await response.text();
    
    if (csvText.trim().startsWith('<!DOCTYPE')) {
      console.warn("Recebido HTML em Tarefas. Verifique se a aba de tarefas está com o GID correto e pública.");
      throw new Error("Acesso negado.");
    }

    const tasks = parseCsvToTasks(csvText);
    console.log(`Tarefas carregadas com sucesso: ${tasks.length}`);
    
    if (tasks.length > 0) {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    }
    return tasks;
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
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
  const lines = csv.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];
  
  const separator = lines[0].split(';').length > lines[0].split(',').length ? ';' : ',';
  const headers = splitCsv(lines[0], separator).map(h => normalizeString(h));
  
  return lines.slice(1).map((line): Lead | null => {
    const cells = splitCsv(line, separator);
    const get = (name: string, indexFallback: number) => {
      const search = normalizeString(name);
      const idx = headers.findIndex(h => h === search || h.includes(search));
      const value = idx !== -1 ? cells[idx] : cells[indexFallback];
      return value || '';
    };
    
    return {
      email: get('email', 0),
      creation_datetime: get('creation', 1),
      trial_end: get('trial', 2),
      dias_de_teste: parseInt(get('dias', 3)) || 0,
      qualidade_email: get('qualidade', 4),
      prioridade: get('prioridade', 5),
      analise_preliminar: get('analise', 6),
      status: mapStatus(get('status', 7)),
      empresa: get('empresa', 8),
      segmento: get('segmento', 10),
      responsavel: get('responsavel', 11),
      necessidade: get('necessidade', 12),
      plano: get('plano', 13),
      numero_usuarios: parseInt(get('usuarios', 14)) || 0,
      observacoes: get('observacoes', 15),
      apto_consultoria: get('apto', 16) === 'Sim',
      title: get('title', 17),
      telefone: get('telefone', 18),
      id_conta: get('idconta', 19)
    };
  }).filter((l): l is Lead => l !== null && !!l.email);
}

function parseCsvToTasks(csv: string): Task[] {
  const lines = csv.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const separator = lines[0].split(';').length > lines[0].split(',').length ? ';' : ',';
  const headers = splitCsv(lines[0], separator).map(h => normalizeString(h));
  
  return lines.slice(1).map((line): Task | null => {
    const cells = splitCsv(line, separator);
    if (cells.length < 2) return null;

    const get = (name: string, index: number) => {
      const search = normalizeString(name);
      const idx = headers.findIndex(h => h === search || h.includes(search));
      return idx !== -1 ? cells[idx] : cells[index];
    };
    
    return {
      id: get('id', 0),
      lead: get('lead', 1),
      id_conta: get('idconta', 2),
      tarefa: get('tarefa', 3),
      canal: get('canal', 4),
      data: get('data', 5),
      retorno: get('retorno', 6),
      responsavel: get('responsavel', 7)
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
