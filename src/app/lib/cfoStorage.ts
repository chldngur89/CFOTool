import {
  COST_PER_EMPLOYEE,
  computeMonthlyBurn,
  computePersonnelCost,
  computeRunway,
} from './finance';
import { supabase } from './supabase';

export interface CfoWorkspaceRecord {
  id: string;
  ownerUserId: string;
  title: string;
  companyName: string | null;
  status: 'active' | 'archived';
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CfoMetricSnapshotRecord {
  id: string;
  workspaceId: string;
  snapshotMonth: string;
  cash: number;
  monthlyRevenue: number;
  employees: number;
  personnelCost: number;
  marketingCost: number;
  officeCost: number;
  monthlyBurn: number;
  runwayMonths: number;
  activeCustomers: number | null;
  newCustomers: number | null;
  churnedCustomers: number | null;
  qualifiedLeads: number | null;
  grossMarginPercent: number | null;
  operatorNote: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface EnsureWorkspaceInput {
  userId: string;
  companyName?: string;
  lastWorkspaceId?: string | null;
}

export interface UpsertMetricSnapshotInput {
  workspaceId: string;
  userId: string;
  snapshotMonth: string;
  cash: number;
  monthlyRevenue: number;
  employees: number;
  marketingCost: number;
  officeCost: number;
  activeCustomers?: number | null;
  newCustomers?: number | null;
  churnedCustomers?: number | null;
  qualifiedLeads?: number | null;
  grossMarginPercent?: number | null;
  operatorNote?: string | null;
}

export interface InsertSimulationRunInput {
  workspaceId: string;
  userId: string;
  snapshotId?: string | null;
  scenarioId: 'defense' | 'maintain' | 'attack';
  strategySource: 'manual' | 'ollama' | 'fallback' | 'command';
  strategyTitle?: string | null;
  revenueGrowth: number;
  headcountChange: number;
  marketingIncrease: number;
  priceIncrease: number;
  projectedRevenue: number;
  projectedBurn: number;
  projectedProfit: number;
  projectedRunwayMonths: number;
  finalCash: number;
  isSuccess: boolean;
  timelineJson: unknown;
}

export interface InsertAiBriefInput {
  workspaceId: string;
  userId: string;
  briefType: 'health_check' | 'strategy_options' | 'monthly_report' | 'command_preview';
  source: 'ollama' | 'fallback';
  inputPayload: unknown;
  outputPayload: unknown;
  summaryText?: string | null;
  snapshotId?: string | null;
  simulationRunId?: string | null;
  modelName?: string | null;
  promptVersion?: string;
}

export interface InsertAiActionLogInput {
  workspaceId: string;
  userId: string;
  actionType:
    | 'apply_strategy'
    | 'dismiss_strategy'
    | 'edit_strategy'
    | 'accept_command'
    | 'reject_command'
    | 'generate_report';
  actionPayload: unknown;
  aiBriefId?: string | null;
  simulationRunId?: string | null;
}

const SNAPSHOT_FIELDS = [
  'id',
  'workspace_id',
  'snapshot_month',
  'cash',
  'monthly_revenue',
  'employees',
  'personnel_cost',
  'marketing_cost',
  'office_cost',
  'monthly_burn',
  'runway_months',
  'active_customers',
  'new_customers',
  'churned_customers',
  'qualified_leads',
  'gross_margin_percent',
  'operator_note',
  'created_by',
  'created_at',
  'updated_at',
].join(', ');

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase가 설정되지 않았습니다.');
  }
  return supabase;
}

function mapWorkspaceRow(row: any): CfoWorkspaceRecord {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    title: String(row.title ?? ''),
    companyName: typeof row.company_name === 'string' ? row.company_name : null,
    status: row.status === 'archived' ? 'archived' : 'active',
    lastOpenedAt: typeof row.last_opened_at === 'string' ? row.last_opened_at : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSnapshotRow(row: any): CfoMetricSnapshotRecord {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    snapshotMonth: String(row.snapshot_month),
    cash: Number(row.cash ?? 0),
    monthlyRevenue: Number(row.monthly_revenue ?? 0),
    employees: Number(row.employees ?? 0),
    personnelCost: Number(row.personnel_cost ?? 0),
    marketingCost: Number(row.marketing_cost ?? 0),
    officeCost: Number(row.office_cost ?? 0),
    monthlyBurn: Number(row.monthly_burn ?? 0),
    runwayMonths: Number(row.runway_months ?? 0),
    activeCustomers: row.active_customers == null ? null : Number(row.active_customers),
    newCustomers: row.new_customers == null ? null : Number(row.new_customers),
    churnedCustomers: row.churned_customers == null ? null : Number(row.churned_customers),
    qualifiedLeads: row.qualified_leads == null ? null : Number(row.qualified_leads),
    grossMarginPercent:
      row.gross_margin_percent == null ? null : Number(row.gross_margin_percent),
    operatorNote: typeof row.operator_note === 'string' ? row.operator_note : null,
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function getDefaultWorkspaceTitle(companyName?: string) {
  const trimmed = companyName?.trim();
  return trimmed ? `${trimmed} 기본 전장` : '기본 전장';
}

export async function fetchWorkspaceById(
  workspaceId: string,
  userId: string
): Promise<CfoWorkspaceRecord | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .schema('cfo')
    .from('cfo_workspaces')
    .select('id, owner_user_id, title, company_name, status, last_opened_at, created_at, updated_at')
    .eq('id', workspaceId)
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapWorkspaceRow(data);
}

export async function createWorkspace(
  userId: string,
  companyName?: string
): Promise<CfoWorkspaceRecord> {
  const client = requireSupabase();
  const payload = {
    owner_user_id: userId,
    title: getDefaultWorkspaceTitle(companyName),
    company_name: companyName?.trim() || null,
    status: 'active',
    last_opened_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .schema('cfo')
    .from('cfo_workspaces')
    .insert(payload)
    .select('id, owner_user_id, title, company_name, status, last_opened_at, created_at, updated_at')
    .single();

  if (error) throw error;
  return mapWorkspaceRow(data);
}

export async function touchWorkspace(workspaceId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .schema('cfo')
    .from('cfo_workspaces')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', workspaceId);

  if (error) throw error;
}

export async function ensureWorkspace({
  userId,
  companyName,
  lastWorkspaceId,
}: EnsureWorkspaceInput): Promise<CfoWorkspaceRecord> {
  if (lastWorkspaceId) {
    const existing = await fetchWorkspaceById(lastWorkspaceId, userId);
    if (existing) {
      await touchWorkspace(existing.id);
      return {
        ...existing,
        lastOpenedAt: new Date().toISOString(),
      };
    }
  }

  return createWorkspace(userId, companyName);
}

export async function fetchLatestMetricSnapshot(
  workspaceId: string
): Promise<CfoMetricSnapshotRecord | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .schema('cfo')
    .from('cfo_metric_snapshots')
    .select(SNAPSHOT_FIELDS)
    .eq('workspace_id', workspaceId)
    .order('snapshot_month', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapSnapshotRow(data);
}

export async function listRecentMetricSnapshots(
  workspaceId: string,
  limit = 6
): Promise<CfoMetricSnapshotRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .schema('cfo')
    .from('cfo_metric_snapshots')
    .select(SNAPSHOT_FIELDS)
    .eq('workspace_id', workspaceId)
    .order('snapshot_month', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapSnapshotRow);
}

export async function upsertMetricSnapshot(
  input: UpsertMetricSnapshotInput
): Promise<CfoMetricSnapshotRecord> {
  const client = requireSupabase();
  const personnelCost = computePersonnelCost(input.employees, {
    unitCost: COST_PER_EMPLOYEE,
  });
  const monthlyBurn = computeMonthlyBurn(
    personnelCost,
    input.marketingCost,
    input.officeCost
  );
  const runwayMonths = computeRunway(input.cash, monthlyBurn);

  const payload = {
    workspace_id: input.workspaceId,
    snapshot_month: input.snapshotMonth,
    cash: Math.max(0, Math.round(input.cash)),
    monthly_revenue: Math.max(0, Math.round(input.monthlyRevenue)),
    employees: Math.max(0, Math.round(input.employees)),
    personnel_cost: personnelCost,
    marketing_cost: Math.max(0, Math.round(input.marketingCost)),
    office_cost: Math.max(0, Math.round(input.officeCost)),
    monthly_burn: monthlyBurn,
    runway_months: Number.isFinite(runwayMonths) ? Number(runwayMonths.toFixed(2)) : 9999,
    active_customers: input.activeCustomers ?? null,
    new_customers: input.newCustomers ?? null,
    churned_customers: input.churnedCustomers ?? null,
    qualified_leads: input.qualifiedLeads ?? null,
    gross_margin_percent: input.grossMarginPercent ?? null,
    operator_note: input.operatorNote?.trim() || null,
    created_by: input.userId,
  };

  const { data, error } = await client
    .schema('cfo')
    .from('cfo_metric_snapshots')
    .upsert(payload, { onConflict: 'workspace_id,snapshot_month' })
    .select(SNAPSHOT_FIELDS)
    .single();

  if (error) throw error;
  return mapSnapshotRow(data);
}

export async function insertSimulationRun(
  input: InsertSimulationRunInput
): Promise<string> {
  const client = requireSupabase();
  const payload = {
    workspace_id: input.workspaceId,
    snapshot_id: input.snapshotId ?? null,
    scenario_id: input.scenarioId,
    strategy_source: input.strategySource,
    strategy_title: input.strategyTitle?.trim() || null,
    revenue_growth: input.revenueGrowth,
    headcount_change: input.headcountChange,
    marketing_increase: input.marketingIncrease,
    price_increase: input.priceIncrease,
    projected_revenue: Math.round(input.projectedRevenue),
    projected_burn: Math.round(input.projectedBurn),
    projected_profit: Math.round(input.projectedProfit),
    projected_runway_months: Number.isFinite(input.projectedRunwayMonths)
      ? Number(input.projectedRunwayMonths.toFixed(2))
      : 9999,
    final_cash: Math.round(input.finalCash),
    is_success: input.isSuccess,
    timeline_json: input.timelineJson,
    created_by: input.userId,
  };

  const { data, error } = await client
    .schema('cfo')
    .from('cfo_simulation_runs')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return String(data.id);
}

export async function insertAiBrief(input: InsertAiBriefInput): Promise<string> {
  const client = requireSupabase();
  const payload = {
    workspace_id: input.workspaceId,
    snapshot_id: input.snapshotId ?? null,
    simulation_run_id: input.simulationRunId ?? null,
    brief_type: input.briefType,
    source: input.source,
    model_name: input.modelName ?? null,
    prompt_version: input.promptVersion ?? 'v1',
    input_payload: input.inputPayload,
    output_payload: input.outputPayload,
    summary_text: input.summaryText?.trim() || null,
    created_by: input.userId,
  };

  const { data, error } = await client
    .schema('cfo')
    .from('cfo_ai_briefs')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return String(data.id);
}

export async function insertAiActionLog(
  input: InsertAiActionLogInput
): Promise<void> {
  const client = requireSupabase();
  const payload = {
    workspace_id: input.workspaceId,
    ai_brief_id: input.aiBriefId ?? null,
    simulation_run_id: input.simulationRunId ?? null,
    action_type: input.actionType,
    action_payload: input.actionPayload,
    created_by: input.userId,
  };

  const { error } = await client
    .schema('cfo')
    .from('cfo_ai_action_logs')
    .insert(payload);

  if (error) throw error;
}
