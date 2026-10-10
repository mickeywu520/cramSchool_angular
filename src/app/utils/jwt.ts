/**
 * 極簡 JWT 工具（只讀取 payload，不做簽章驗證）。
 * 用途：在前端判斷 access_token 是否已過期，以便開頁時先主動 refresh。
 */

export interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

export function decodeJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * token 是否已過期（或無法解析視為過期）。
 * @param skewSeconds 提前視為過期的緩衝秒數（例如 60 = 到期前 60 秒即視為需更新）。
 */
export function isTokenExpired(token: string | null | undefined, skewSeconds = 0): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp <= Date.now() / 1000 + skewSeconds;
}
