// NOTE: localStorage is used here for simplicity. It's readable by any JS on
// the page, which is an XSS-exposure tradeoff against httpOnly cookies. If
// this app will ever load third-party scripts, revisit this — move the
// refresh token to an httpOnly cookie set by the backend and keep only the
// short-lived access token in memory.

const ACCESS_TOKEN_KEY = 'ict_inventory_access_token';
const REFRESH_TOKEN_KEY = 'ict_inventory_refresh_token';

export function getTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
