// ─── API: Environments ────────────────────────────────────────────────────────

import {
  GetEnvironments,
  CreateEnvironment,
  UpdateEnvironment,
  DeleteEnvironment,
} from '../../wailsjs/go/main/App';
import type { Environment } from '../types';

export async function getEnvironments(): Promise<Environment[]> {
  try {
    const data = await GetEnvironments();
    return (data as Environment[]) ?? [];
  } catch (err) {
    console.error('[api/environments] getEnvironments failed:', err);
    return [];
  }
}

export async function createEnvironment(name: string): Promise<Environment | null> {
  try {
    return (await CreateEnvironment(name)) as Environment;
  } catch (err) {
    console.error('[api/environments] createEnvironment failed:', err);
    return null;
  }
}

export async function updateEnvironment(
  id: string,
  name: string,
  variables: string,
): Promise<boolean> {
  try {
    await UpdateEnvironment(id, name, variables);
    return true;
  } catch (err) {
    console.error('[api/environments] updateEnvironment failed:', err);
    return false;
  }
}

export async function deleteEnvironment(id: string): Promise<boolean> {
  try {
    await DeleteEnvironment(id);
    return true;
  } catch (err) {
    console.error('[api/environments] deleteEnvironment failed:', err);
    return false;
  }
}
