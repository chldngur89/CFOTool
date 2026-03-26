import type { User } from '@supabase/supabase-js';
import type { RepresentativeVariant } from '../components/character/CharacterChoiceScreen';
import { getSupabaseClient } from './supabase';

export interface CfoProfileRecord {
  fullName: string;
  companyName: string;
  lastWorkspaceId: string | null;
  representativeVariant: RepresentativeVariant;
}

const toText = (value: unknown) => (typeof value === 'string' ? value : '');

export function getPreferredVariant(user: User): RepresentativeVariant {
  const fromMeta = user.user_metadata?.representative_variant;
  return fromMeta === 'general' ? 'general' : 'strategist';
}

export function getProfileFromMetadata(user: User): CfoProfileRecord {
  return {
    fullName: toText(user.user_metadata?.full_name || user.user_metadata?.name).trim(),
    companyName: toText(user.user_metadata?.company_name).trim(),
    lastWorkspaceId: null,
    representativeVariant: getPreferredVariant(user),
  };
}

export async function fetchCfoProfile(userId: string): Promise<CfoProfileRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  let data: any = null;
  let error: any = null;

  ({ data, error } = await supabase
    .schema('cfo')
    .from('cfo_profiles')
    .select('full_name, company_name, last_workspace_id, representative_variant')
    .eq('user_id', userId)
    .maybeSingle());

  if (error && /last_workspace_id|representative_variant/i.test(error.message ?? '')) {
    ({ data, error } = await supabase
      .schema('cfo')
      .from('cfo_profiles')
      .select('full_name, company_name')
      .eq('user_id', userId)
      .maybeSingle());
  }

  if (error) throw error;
  if (!data) return null;

  return {
    fullName: toText(data.full_name).trim(),
    companyName: toText(data.company_name).trim(),
    lastWorkspaceId:
      typeof data.last_workspace_id === 'string' ? data.last_workspace_id : null,
    representativeVariant:
      data.representative_variant === 'general' ? 'general' : 'strategist',
  };
}

interface UpsertProfileInput {
  userId: string;
  email?: string | null;
  fullName?: string;
  companyName?: string;
  lastWorkspaceId?: string | null;
  representativeVariant?: RepresentativeVariant;
}

export async function upsertCfoProfile({
  userId,
  email,
  fullName,
  companyName,
  lastWorkspaceId,
  representativeVariant,
}: UpsertProfileInput): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const payload = {
    user_id: userId,
    email: email ?? null,
    full_name: fullName?.trim() || null,
    company_name: companyName?.trim() || null,
    last_workspace_id: lastWorkspaceId ?? null,
    representative_variant: representativeVariant ?? 'strategist',
  };

  let { error } = await supabase
    .schema('cfo')
    .from('cfo_profiles')
    .upsert(payload, { onConflict: 'user_id' });

  if (error && /last_workspace_id|representative_variant/i.test(error.message ?? '')) {
    ({ error } = await supabase
      .schema('cfo')
      .from('cfo_profiles')
      .upsert(
        {
          user_id: userId,
          email: email ?? null,
          full_name: fullName?.trim() || null,
          company_name: companyName?.trim() || null,
        },
        { onConflict: 'user_id' }
      ));
  }

  if (error) throw error;
}

export async function updateLastWorkspaceId(
  userId: string,
  workspaceId: string | null
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .schema('cfo')
    .from('cfo_profiles')
    .update({ last_workspace_id: workspaceId })
    .eq('user_id', userId);

  if (error && /last_workspace_id/i.test(error.message ?? '')) {
    return;
  }
  if (error) throw error;
}
