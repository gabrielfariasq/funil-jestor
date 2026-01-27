
import { Lead, LeadStatus, Responsible, Plan, Task } from '../types';

const SHEET_ID = '1NMWnFu5MUxM1xFoFMkhg27RLF8_WIfgaGPOBAWAMyoE';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_0pZfhFZ3UNVRxggtvhOJ7IJ5ass58zfGJYTM4MrCk1z7f_JPHvU5nFOIPRhNgyc-4w/exec'; 

const LEADS_GID = '0';
const TASKS_GID = '2119020961'; 

const STORAGE_KEY_LEADS = 'jestor_leads_cache_v4';
const STORAGE_KEY_TASKS = 'jestor_tasks_cache_v4';

const generateId = () => Math.random().toString(36).substr(2, 9).toUpperCase();

/**
 * Fetches leads from the Google Sheet using the Visualization API.
 */
export async function fetchLeads(forceRefresh = false): Promise<Lead[]> {
  try {
    // Using gviz/tq endpoint which is more reliable for CSV output
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${LEADS_GID}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Verifique se a planilha está configurada como "Qualquer pessoa com o link pode ler".`);
    }

    const csvText = await response.text();
    
    // Check if Google returned an HTML login/error page
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html') || csvText.includes('google-signin')) {
      throw new Error('PLANILHA PRIVADA: No Google Sheets, clique em "Compartilhar" e mude para "Qualquer pessoa com o link".');
    }

    const leads = parseCsvToLeads(csvText);
    if (leads.length > 0) {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
    }
    return leads;
  } catch (error: any) {
    console.error("FetchLeads Error:", error.message);
    const cached = localStorage.getItem(STORAGE_KEY_LEADS);
    return cached ? JSON.parse(cached) : [];
  }
}

/**
 * Fetches tasks from the Google Sheet using the Visualization API.
 * This fixes the 400 error by using a more robust endpoint.
 */
export async function fetchTasks(): Promise<Task[]> {
  try {
    // Using gviz/tq endpoint for tasks
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${TASKS_GID}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(`Erro 400: O GID (${TASKS_GID}) da aba de Tarefas não foi encontrado ou a planilha não está publicada.`);
      }
      throw new Error(`Erro ${response.status}: Falha ao buscar tarefas.`);
    }

    const csvText = await response.text();

    // Check for HTML response
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html') || csvText.includes('doc-content')) {
      throw new Error('Acesso negado às Tarefas: Certifique-se de que a aba de tarefas também está acessível.');
    }

    const tasks = parseCsvToTasks(csvText);
    if (tasks.length > 0 || csvText.split('\n').length > 1) {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    }
    return tasks;
  } catch (error: any) {
    console.error("FetchTasks Error:", error.message);
    const cached = localStorage.getItem(STORAGE_KEY_TASKS);
    if (cached) {
      console.warn("Retornando tarefas do cache devido a erro de rede.");
      return JSON.parse(cached);
    }
    return [];
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
    console.error("UpdateLead Error:", e);
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
  } catch (e) {
    console.error("SaveTask Error:", e);
    throw e;
  }
}

export async function updateTaskReturnInStorage(task: Task): Promise<void> {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'update_task_return', ...task })
    });
  } catch (e) {
    console.error("UpdateTaskReturn Error:", e);
    throw e;
  }
}

export async function deleteTaskFromStorage(task: Task): Promise<void> {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ action: 'delete_task', ...task })
    });
  } catch (e) {
    console.error("DeleteTask Error:", e);
    throw e;
  }
}

function parseCsvToLeads(csv: string): Lead[] {
  const lines = csv.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, '').replace(/\s/g, ''));
  
  return lines.slice(1).map(line => {
    // Improved regex for CSV with quotes and commas
    const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    const get = (name: string) => {
      const search = name.toLowerCase().replace(/\s/g, '');
      const idx = headers.findIndex(h => h.includes(search));
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
  }).filter(l => l.email);
}

function parseCsvToTasks(csv: string): Task[] {
  const lines = csv.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, '').replace(/\s/g, ''));
  
  return lines.slice(1).map(line => {
    const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    const get = (name: string) => {
      const search = name.toLowerCase().replace(/\s/g, '');
      const idx = headers.findIndex(h => h.includes(search));
      return idx !== -1 ? cells[idx] : '';
    };
    
    return {
      id: get('id'),
      lead: get('lead'),
      id_conta: get('idconta'),
      tarefa: get('tarefa'),
      canal: get('canal'),
      data: get('data'),
      retorno: get('retorno')
    };
  }).filter(t => t.lead || t.id_conta || t.id);
}

function mapStatus(val: string): LeadStatus {
  const v = val.toLowerCase();
  if (v.includes('pendente')) return LeadStatus.PENDING;
  if (v.includes('tentativa')) return LeadStatus.CONTACT_ATTEMPT;
  if (v.includes('reuniao')) return LeadStatus.MEETING_SCHEDULED;
  if (v.includes('proposta')) return LeadStatus.PROPOSAL;
  if (v.includes('ganho')) return LeadStatus.WON;
  if (v.includes('perdido')) return LeadStatus.LOST;
  return LeadStatus.NO_RESPONSE;
}
