import { isCloudApiMode } from './cloudApi';

export type CloudBackend = 'api' | 'local';

export function getCloudBackend(): CloudBackend {
  return isCloudApiMode ? 'api' : 'local';
}

export const isCloudMode = getCloudBackend() !== 'local';
