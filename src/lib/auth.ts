// Hard-coded admin credentials for single-user utility
// In production, these would be environment variables
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'clms2024';

const AUTH_KEY = 'clms_auth_token';

export const authenticateAdmin = (username: string, password: string): boolean => {
  return username === ADMIN_USER && password === ADMIN_PASS;
};

export const setAuthToken = (): void => {
  const token = btoa(`${Date.now()}-authenticated`);
  sessionStorage.setItem(AUTH_KEY, token);
};

export const clearAuthToken = (): void => {
  sessionStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
  return sessionStorage.getItem(AUTH_KEY) !== null;
};
