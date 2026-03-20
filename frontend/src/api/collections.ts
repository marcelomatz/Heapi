// ─── API: Collections ─────────────────────────────────────────────────────────
// Typed wrappers over Wails auto-generated bindings.

import {
  GetCollections,
  CreateCollection,
  DeleteCollection,
  RenameCollection,
  CreateRequest,
  DeleteRequest,
  RenameRequest,
  UpdateRequest,
  CreateUntitledRequest,
  UpdateCollection,
  UpdateCollectionsOrder,
} from '../../wailsjs/go/main/App';
import type { Collection, Request } from '../types';

export async function getCollections(): Promise<Collection[]> {
  try {
    const data = await GetCollections();
    return (data as unknown as Collection[]) ?? [];
  } catch (err) {
    console.error('[api/collections] getCollections failed:', err);
    return [];
  }
}

export async function createCollection(name: string): Promise<Collection | null> {
  try {
    return (await CreateCollection(name)) as unknown as Collection;
  } catch (err) {
    console.error('[api/collections] createCollection failed:', err);
    return null;
  }
}

export async function deleteCollection(id: string): Promise<boolean> {
  try {
    await DeleteCollection(id);
    return true;
  } catch (err) {
    console.error('[api/collections] deleteCollection failed:', err);
    return false;
  }
}

export async function renameCollection(id: string, name: string): Promise<boolean> {
  try {
    await RenameCollection(id, name);
    return true;
  } catch (err) {
    console.error('[api/collections] renameCollection failed:', err);
    return false;
  }
}

export async function createRequest(
  colId: string,
  name: string,
  method: string,
  url: string,
): Promise<Request | null> {
  try {
    return (await CreateRequest(colId, name, method, url)) as unknown as Request;
  } catch (err) {
    console.error('[api/collections] createRequest failed:', err);
    return null;
  }
}

export async function createUntitledRequest(): Promise<Request | null> {
  try {
    return (await CreateUntitledRequest()) as unknown as Request;
  } catch (err) {
    console.error('[api/collections] createUntitledRequest failed:', err);
    return null;
  }
}

export async function deleteRequest(id: string): Promise<boolean> {
  try {
    await DeleteRequest(id);
    return true;
  } catch (err) {
    console.error('[api/collections] deleteRequest failed:', err);
    return false;
  }
}

export async function renameRequest(id: string, name: string): Promise<boolean> {
  try {
    await RenameRequest(id, name);
    return true;
  } catch (err) {
    console.error('[api/collections] renameRequest failed:', err);
    return false;
  }
}

export async function updateRequest(
  id: string,
  name: string,
  method: string,
  url: string,
  headers: string,
  body: string,
  auth: string,
  lastRes: string,
  lastStatus: number,
  lastDur: number,
  lastHeaders: string,
): Promise<boolean> {
  try {
    await UpdateRequest(id, name, method, url, headers, body, auth, lastRes, lastStatus, lastDur, lastHeaders);
    return true;
  } catch (err) {
    console.error('[api/collections] updateRequest failed:', err);
    return false;
  }
}
export async function updateCollection(
  id: string,
  name: string,
  color: string,
  order: number,
  isCollapsed: boolean,
): Promise<boolean> {
  try {
    await UpdateCollection(id, name, color, order, isCollapsed);
    return true;
  } catch (err) {
    console.error('[api/collections] updateCollection failed:', err);
    return false;
  }
}

export async function updateCollectionsOrder(ids: string[]): Promise<boolean> {
  try {
    await UpdateCollectionsOrder(ids);
    return true;
  } catch (err) {
    console.error('[api/collections] updateCollectionsOrder failed:', err);
    return false;
  }
}
