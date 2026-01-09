
import { Lead, LeadStatus, Responsible, Plan } from '../types';

/**
 * CONFIGURAÇÃO DIRETA
 * Valores fixos restaurados para funcionamento imediato sem configuração de ambiente.
 */
const SHEET_ID = '1NMWnFu5MUxM1xFoFMkhg27RLF8_WIfgaGPOBAWAMyoE';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxqD-mVkL7-QmbgMnGF8oIjD_pW7PWQSWB6mfp8oHsGbe0JtUBO6RnbyPpEffPU8CYZQA/exec'; 

const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const STORAGE_KEY = 'jestor_leads_cache_v3';

/**
 * Busca os leads diretamente da planilha via CSV (Leitura rápida)
 */
export async function fetchLeads(forceRefresh = false): Promise<Lead[]> {
  try {
    const response = await fetch(`${SHEET_CSV_URL}&t=${Date.now()}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error('Não foi possível carregar os dados da planilha.');
    
    const csvText = await response.text();
    const leads = parseCsvToLeads(csvText);
    
    // Cache local para persistência offline básica e performance
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    return leads;
  } catch (error) {
    console.error("Erro ao ler planilha:", error);
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) return JSON.parse(cached);
    throw error;
  }
}

/**
 * Envia as atualizações para o Google Apps Script (Escrita)
 */
export async function updateLeadInStorage(updatedLead: Lead): Promise<void> {
  // 1. Atualiza o cache local imediatamente (Optimistic UI)
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    const leads: Lead[] = JSON.parse(cached);
    const index = leads.findIndex(l => l.email === updatedLead.email);
    if (index !== -1) {
      leads[index] = updatedLead;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    }
  }

  // 2. Envia para a planilha via Apps Script
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain', 
      },
      body: JSON.stringify(updatedLead)
    });
    console.log("Atualização enviada para a planilha:", updatedLead.email);
  } catch (e) {
    console.error("Falha ao sincronizar com a planilha:", e);
    throw new Error("Erro de sincronização. A planilha não pôde ser atualizada.");
  }
}

/**
 * Utilitário para converter o texto CSV da planilha em objetos Lead
 */
function parseCsvToLeads(csv: string): Lead[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [];
        currentField = '';
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentField += char;
      }
    }
  }
  if (currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  
  const getVal = (row: string[], name: string) => {
    // Busca normalizada para evitar erros com acentos ou variações de caixa
    const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const idx = headers.findIndex(h => {
        const normalizedHeader = h.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalizedHeader === normalizedName;
    });
    
    return idx !== -1 ? row[idx]?.replace(/^"|"$/g, '').trim() : '';
  };

  return rows.slice(1).map(row => {
    const statusVal = getVal(row, 'Status');
    // Mapeamento flexível de status para o enum
    let status = LeadStatus.PENDING;
    if (statusVal) {
        const lowerStatus = statusVal.toLowerCase();
        if (lowerStatus.includes('pendente')) status = LeadStatus.PENDING;
        else if (lowerStatus.includes('tentativa')) status = LeadStatus.CONTACT_ATTEMPT;
        else if (lowerStatus.includes('reuniao')) status = LeadStatus.MEETING_SCHEDULED;
        else if (lowerStatus.includes('proposta')) status = LeadStatus.PROPOSAL;
        else if (lowerStatus.includes('ganho')) status = LeadStatus.WON;
        else if (lowerStatus.includes('perdido')) status = LeadStatus.LOST;
        else if (lowerStatus.includes('resposta')) status = LeadStatus.NO_RESPONSE;
    }

    return {
        email: getVal(row, 'Email'),
        creation_datetime: getVal(row, 'Creation Datetime'),
        trial_end: getVal(row, 'Trial End'),
        dias_de_teste: parseInt(getVal(row, 'Dias de teste')) || 0,
        qualidade_email: getVal(row, 'Qualidade do email'),
        prioridade: getVal(row, 'Prioridade'),
        analise_preliminar: getVal(row, 'Análise preliminar'),
        status: status,
        motivo_perda: getVal(row, 'Motivo de perda'),
        segmento: getVal(row, 'Segmento'),
        responsavel: getVal(row, 'Responsável'),
        necessidade: getVal(row, 'Necessidade'),
        plano: (getVal(row, 'Plano') as Plan) || '',
        numero_usuarios: parseInt(getVal(row, 'Número de usuários')) || 0,
        observacoes: getVal(row, 'Observações'),
        empresa: getVal(row, 'Empresa'),
        apto_consultoria: getVal(row, 'Apto para consultoria') === 'Sim' || getVal(row, 'Apto para consultoria') === 'TRUE' || getVal(row, 'Apto para consultoria') === 'S',
        title: getVal(row, 'Title'),
        id_conta: getVal(row, 'ID conta'),
        telefone: getVal(row, 'Telefone'),
    };
  });
}
