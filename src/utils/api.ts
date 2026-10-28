import { UserAccount, PlayerStats, DailyGameState } from '../types';

const TOKEN_STORAGE_KEY = 'kalabaz_session_token';

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {}
}

export interface AuthResponse {
  account: UserAccount;
  token: string;
}

export async function apiSignup(
  username: string,
  password: string,
  initialStats?: PlayerStats,
  initialGameStates?: { [len: number]: DailyGameState }
): Promise<AuthResponse> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      stats: initialStats,
      gameStates: initialGameStates,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'خطا در ثبت‌نام حساب کاربری.');
  }
  if (data.token) {
    setSessionToken(data.token);
  }
  return data;
}

export async function apiLogin(
  username: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'خطا در ورود به حساب کاربری.');
  }
  if (data.token) {
    setSessionToken(data.token);
  }
  return data;
}

export async function apiFetchCurrentUser(): Promise<UserAccount | null> {
  const token = getSessionToken();
  if (!token) return null;

  const res = await fetch('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      setSessionToken(null);
    }
    return null;
  }

  const data = await res.json();
  return data?.account || null;
}

export async function apiSyncUserData(
  stats: PlayerStats,
  gameStates: { [len: number]: DailyGameState }
): Promise<UserAccount | null> {
  const token = getSessionToken();
  if (!token) return null;

  const res = await fetch('/api/user/sync', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ stats, gameStates }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data?.account || null;
}
