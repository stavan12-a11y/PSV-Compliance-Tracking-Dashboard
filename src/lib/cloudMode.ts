import { isCloudApiMode } from './cloudApi';
import { isSupabaseConfigured } from './supabase';

export type CloudBackend = 'api' | 'supabase' | 'local';

export function getCloudBackend(): CloudBackend {
  if (isCloudApiMode) return 'api';
  if (isSupabaseConfigured) return 'supabase';
  return 'local';
}

export const isCloudMode = getCloudBackend() !== 'local';
