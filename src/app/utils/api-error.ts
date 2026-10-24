/**
 * 後端錯誤訊息的統一解析。
 *
 * 後端有兩種錯誤格式：
 * 1. 新版 envelope（AppException）：`{ success: false, error: { code, message, details } }`
 *    → 訊息在 `HttpErrorResponse.error.error.message`
 * 2. 舊式 FastAPI：`{ detail: "訊息" }` 或 `{ detail: { message: "訊息" } }`
 *    → 訊息在 `HttpErrorResponse.error.detail`
 *
 * 直接寫 `err.error?.detail` 會把整個物件塞進畫面（變成 [object Object]），
 * 沒對到就會掉回 HttpClient 的英文訊息（Http failure response ...）。
 */
type ErrorEnvelope = {
  error?: { code?: string; message?: string; details?: unknown[] } | string;
  detail?: string | { message?: string };
  message?: string;
};

export function apiErrorMessage(e: unknown, fallback: string): string {
  const body = (e as { error?: ErrorEnvelope | string } | null | undefined)?.error;
  if (!body) return fallback;
  if (typeof body === 'string') return body.trim() || fallback;

  const candidates: unknown[] = [
    body.error && typeof body.error === 'object' ? body.error.message : undefined,
    typeof body.detail === 'string' ? body.detail : undefined,
    body.detail && typeof body.detail === 'object' ? body.detail.message : undefined,
    body.message,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
  }
  return fallback;
}

/** HTTP 狀態碼（沒有就回 0） */
export function apiErrorStatus(e: unknown): number {
  const status = (e as { status?: number } | null | undefined)?.status;
  return typeof status === 'number' ? status : 0;
}
