// ─── API: Request Execution ───────────────────────────────────────────────────

import { Execute } from '../../wailsjs/go/main/App';
import type { ResponseResult } from '../types';

export async function executeRequest(
  requestId: string,
  method: string,
  url: string,
  headers: string,
  body: string,
  auth: string,
  envId: string | null,
): Promise<ResponseResult> {
  const res = await Execute(requestId, method, url, headers, body, auth, envId);
  return res as ResponseResult;
}
