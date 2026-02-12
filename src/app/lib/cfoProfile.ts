import type { User } from '@supabase/supabase-js';
import type { RepresentativeVariant } from '../components/character/CharacterChoiceScreen';
import { supabase } from './supabase';

export interface CfoProfileRecord {
  fullName: string;
  companyName: string;
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
  };
}

export async function fetchCfoProfile(userId: string): Promise<CfoProfileRecord | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .schema('cfo')
    .from('cfo_profiles')
    .select('full_name, company_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    fullName: toText(data.full_name).trim(),
    companyName: toText(data.company_name).trim(),
  };
}

interface UpsertProfileInput {
  userId: string;
  email?: string | null;
  fullName?: string;
  companyName?: string;
}

export async function upsertCfoProfile({
  userId,
  email,
  fullName,
  companyName,
}: UpsertProfileInput): Promise<void> {
  if (!supabase) return;

  const payload = {
    user_id: userId,
    email: email ?? null,
    full_name: fullName?.trim() || null,
    company_name: companyName?.trim() || null,
  };

  const { error } = await supabase
    .schema('cfo')
    .from('cfo_profiles')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) throw error;
}
