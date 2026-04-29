import {
  ApiCall,
  AuditReport,
  CreditBalance,
  ImprovementResult,
  Lead,
} from './types';
import { createClient } from '@supabase/supabase-js';

const FOUR_HOURS = 4 * 60 * 60 * 1000;
const ZAR_PER_USD = 18.5;

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn('Supabase not configured, using in-memory store');
  }
}

// Fallback in-memory stores if Supabase is not configured
const auditStore = new Map<string, AuditReport>();
const improvementStore = new Map<string, ImprovementResult>();
const leadStore = new Map<string, Lead>();
const apiUsageStore: ApiCall[] = [];

let creditBalance: CreditBalance = {
  initialCreditsUSD: 0,
  initialCreditsZAR: 0,
  spentUSD: 0,
  spentZAR: 0,
  remainingUSD: 0,
  remainingZAR: 0,
  lastUpdated: new Date().toISOString(),
};

function purgeExpired<T extends { expiresAt: string }>(map: Map<string, T>) {
  const now = Date.now();
  for (const [k, v] of map.entries()) {
    if (new Date(v.expiresAt).getTime() < now) map.delete(k);
  }
}

// ==== Audits ====
export async function saveAudit(audit: AuditReport): Promise<void> {
  if (supabase) {
    const expiresAt = new Date(Date.now() + FOUR_HOURS).toISOString();
    const { error } = await (supabase.from('audits') as any)
      .upsert({ id: audit.id, data: audit, domain: audit.domain, expires_at: expiresAt });
    if (error) {
      console.error('Failed to save audit to Supabase, falling back to in-memory:', error);
      purgeExpired(auditStore);
      auditStore.set(audit.id, audit);
    }
  } else {
    purgeExpired(auditStore);
    auditStore.set(audit.id, audit);
  }
}

export async function getAudit(id: string): Promise<AuditReport | undefined> {
  if (supabase) {
    const { data, error } = await (supabase.from('audits') as any)
      .select('data')
      .eq('id', id)
      .single();
    if (!error && data) {
      return data?.data as AuditReport | undefined;
    }
    if (error) {
      console.error('Failed to get audit from Supabase, checking in-memory:', error);
    }
  }
  purgeExpired(auditStore);
  return auditStore.get(id);
}

export async function listAudits(): Promise<AuditReport[]> {
  if (supabase) {
    const { data, error } = await (supabase.from('audits') as any)
      .select('data')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return (data || []).map((row: any) => row.data as AuditReport);
    }
    if (error) {
      console.error('Failed to list audits from Supabase, checking in-memory:', error);
    }
  }
  purgeExpired(auditStore);
  return Array.from(auditStore.values()).sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
}

// ==== Improvements ====
export async function saveImprovement(r: ImprovementResult): Promise<void> {
  if (supabase) {
    const expiresAt = new Date(Date.now() + FOUR_HOURS).toISOString();
    const { error } = await (supabase.from('improvements') as any)
      .upsert({ id: r.id, data: r, expires_at: expiresAt });
    if (error) {
      console.error('Failed to save improvement to Supabase, falling back to in-memory:', error);
      purgeExpired(improvementStore);
      improvementStore.set(r.id, r);
    }
  } else {
    purgeExpired(improvementStore);
    improvementStore.set(r.id, r);
  }
}

export async function getImprovement(id: string): Promise<ImprovementResult | undefined> {
  if (supabase) {
    const { data, error } = await (supabase.from('improvements') as any)
      .select('data')
      .eq('id', id)
      .single();
    if (!error && data) {
      return data?.data as ImprovementResult | undefined;
    }
    if (error) {
      console.error('Failed to get improvement from Supabase, checking in-memory:', error);
    }
  }
  purgeExpired(improvementStore);
  return improvementStore.get(id);
}

export async function listImprovements(): Promise<{ id: string; businessName: string; date: string }[]> {
  if (supabase) {
    const { data, error } = await (supabase.from('improvements') as any)
      .select('data')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return (data || []).map((row: any) => {
        const r = row.data as ImprovementResult;
        return { id: r.id, businessName: r.profile.businessName, date: r.generatedAt };
      });
    }
    if (error) {
      console.error('Failed to list improvements from Supabase, checking in-memory:', error);
    }
  }
  purgeExpired(improvementStore);
  return Array.from(improvementStore.values())
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .map((r) => ({ id: r.id, businessName: r.profile.businessName, date: r.generatedAt }));
}

export function defaultExpiry(): string {
  return new Date(Date.now() + FOUR_HOURS).toISOString();
}

// ==== Leads ====
export async function addLead(lead: Lead): Promise<void> {
  if (supabase) {
    const { error } = await (supabase.from('leads') as any)
      .insert({ id: lead.id, data: lead });
    if (error) {
      console.error('Failed to add lead to Supabase, falling back to in-memory:', error);
      leadStore.set(lead.id, lead);
    }
  } else {
    leadStore.set(lead.id, lead);
  }
}

export async function getLead(id: string): Promise<Lead | undefined> {
  if (supabase) {
    const { data, error } = await (supabase.from('leads') as any)
      .select('data')
      .eq('id', id)
      .single();
    if (!error && data) {
      return data?.data as Lead | undefined;
    }
    if (error) {
      console.error('Failed to get lead from Supabase, checking in-memory:', error);
    }
  }
  return leadStore.get(id);
}

export async function getLeads(): Promise<Lead[]> {
  if (supabase) {
    const { data, error } = await (supabase.from('leads') as any)
      .select('data')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return (data || []).map((row: any) => row.data as Lead);
    }
    if (error) {
      console.error('Failed to list leads from Supabase, checking in-memory:', error);
    }
  }
  return Array.from(leadStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateLeadStatus(id: string, status: Lead['status']): Promise<void> {
  if (supabase) {
    const { data } = await (supabase.from('leads') as any)
      .select('data')
      .eq('id', id)
      .single();
    if (data) {
      const lead = data.data as Lead;
      const { error } = await (supabase.from('leads') as any)
        .update({ data: { ...lead, status } })
        .eq('id', id);
      if (error) {
        console.error('Failed to update lead status in Supabase, falling back to in-memory:', error);
        const storedLead = leadStore.get(id);
        if (storedLead) leadStore.set(id, { ...storedLead, status });
      }
    }
  } else {
    const lead = leadStore.get(id);
    if (lead) leadStore.set(id, { ...lead, status });
  }
}

export async function updateLeadNotes(id: string, notes: string): Promise<void> {
  if (supabase) {
    const { data } = await (supabase.from('leads') as any)
      .select('data')
      .eq('id', id)
      .single();
    if (data) {
      const lead = data.data as Lead;
      const { error } = await (supabase.from('leads') as any)
        .update({ data: { ...lead, notes } })
        .eq('id', id);
      if (error) {
        console.error('Failed to update lead notes in Supabase, falling back to in-memory:', error);
        const storedLead = leadStore.get(id);
        if (storedLead) leadStore.set(id, { ...storedLead, notes });
      }
    }
  } else {
    const lead = leadStore.get(id);
    if (lead) leadStore.set(id, { ...lead, notes });
  }
}

export async function markLeadRead(id: string): Promise<void> {
  if (supabase) {
    const { data } = await (supabase.from('leads') as any)
      .select('data')
      .eq('id', id)
      .single();
    if (data) {
      const lead = data.data as Lead;
      const { error } = await (supabase.from('leads') as any)
        .update({ data: { ...lead, read: true } })
        .eq('id', id);
      if (error) {
        console.error('Failed to mark lead as read in Supabase, falling back to in-memory:', error);
        const storedLead = leadStore.get(id);
        if (storedLead) leadStore.set(id, { ...storedLead, read: true });
      }
    }
  } else {
    const lead = leadStore.get(id);
    if (lead) leadStore.set(id, { ...lead, read: true });
  }
}

export async function unreadHotLeads(): Promise<number> {
  const leads = await getLeads();
  return leads.filter((l) => !l.read && l.temperature === 'hot').length;
}

export async function exportLeadsCSV(): Promise<string> {
  const leads = await getLeads();
  const headers = ['Email', 'Domain', 'Score', 'Status', 'Temp', 'Created', 'Notes'];
  const rows = leads.map((l) => [
    l.email,
    l.domain,
    l.geoScore.toString(),
    l.status,
    l.temperature,
    new Date(l.createdAt).toLocaleDateString(),
    l.notes || '',
  ]);
  const csv = [headers, ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
  return csv;
}

// ==== API Usage ====
export async function logApiCall(call: ApiCall): Promise<void> {
  if (supabase) {
    const { error } = await (supabase.from('api_usage') as any)
      .insert({
        id: call.id,
        task: call.task,
        model: call.model,
        tokens_in: call.tokensIn,
        tokens_out: call.tokensOut,
        cost_usd: call.costUSD,
        cost_zar: call.costZAR,
        created_at: call.timestamp,
      });
    if (error) console.error('Failed to log API call:', error);
  } else {
    apiUsageStore.push(call);
    while (apiUsageStore.length > 500) apiUsageStore.shift();
  }
}

export async function getApiCalls(limit: number): Promise<ApiCall[]> {
  if (supabase) {
    const { data, error } = await (supabase.from('api_usage') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error && data) {
      return (data || []).map((row: any) => ({
        id: row.id,
        timestamp: row.created_at,
        task: row.task,
        model: row.model,
        tokensIn: row.tokens_in,
        tokensOut: row.tokens_out,
        costUSD: row.cost_usd,
        costZAR: row.cost_zar,
      }));
    }
    if (error) {
      console.error('Failed to get API calls from Supabase, checking in-memory:', error);
    }
  }
  return apiUsageStore.slice(-limit).reverse();
}

export async function allApiCalls(): Promise<ApiCall[]> {
  if (supabase) {
    const { data, error } = await (supabase.from('api_usage') as any).select('*');
    if (!error && data) {
      return (data || []).map((row: any) => ({
        id: row.id,
        timestamp: row.created_at,
        task: row.task,
        model: row.model,
        tokensIn: row.tokens_in,
        tokensOut: row.tokens_out,
        costUSD: row.cost_usd,
        costZAR: row.cost_zar,
      }));
    }
    if (error) {
      console.error('Failed to get all API calls from Supabase, checking in-memory:', error);
    }
  }
  return apiUsageStore;
}

// ==== Cost Calculation ====
export function calcCost(model: string, inTokens: number, outTokens: number): { usd: number; zar: number } {
  let costPerMIn = 0.00003;
  let costPerMOut = 0.00012;

  if (model.includes('haiku')) {
    costPerMIn = 0.00008;
    costPerMOut = 0.00024;
  } else if (model.includes('sonnet')) {
    costPerMIn = 0.003;
    costPerMOut = 0.015;
  }

  const usd = (inTokens * costPerMIn + outTokens * costPerMOut) / 1_000_000;
  const zar = usd * ZAR_PER_USD;
  return { usd, zar };
}

// ==== Credit Balance ====
export async function getCreditBalance(): Promise<CreditBalance> {
  if (supabase) {
    const { data, error } = await (supabase.from('credit_balance') as any)
      .select('*')
      .eq('id', 1)
      .single();
    if (!error && data) {
      return {
        initialCreditsUSD: data.initial_credits_usd,
        initialCreditsZAR: data.initial_credits_zar,
        spentUSD: data.spent_usd,
        spentZAR: data.spent_zar,
        remainingUSD: data.remaining_usd,
        remainingZAR: data.remaining_zar,
        lastUpdated: data.last_updated,
      };
    }
    if (error) {
      console.error('Failed to get credit balance from Supabase, using in-memory:', error);
    }
  }
  return creditBalance;
}

export async function updateCreditBalance(usd: number): Promise<void> {
  creditBalance = {
    ...creditBalance,
    spentUSD: creditBalance.spentUSD + usd,
    spentZAR: creditBalance.spentZAR + usd * ZAR_PER_USD,
    remainingUSD: Math.max(0, creditBalance.initialCreditsUSD - (creditBalance.spentUSD + usd)),
    remainingZAR: Math.max(0, usd * ZAR_PER_USD - creditBalance.spentZAR),
    lastUpdated: new Date().toISOString(),
  };

  if (supabase) {
    const { error } = await (supabase.from('credit_balance') as any)
      .update({
        initial_credits_usd: creditBalance.initialCreditsUSD,
        initial_credits_zar: creditBalance.initialCreditsZAR,
        spent_usd: creditBalance.spentUSD,
        spent_zar: creditBalance.spentZAR,
        remaining_usd: creditBalance.remainingUSD,
        remaining_zar: creditBalance.remainingZAR,
        last_updated: creditBalance.lastUpdated,
      })
      .eq('id', 1);
    if (error) console.error('Failed to update credit balance in Supabase (in-memory update persisted):', error);
  }
}
