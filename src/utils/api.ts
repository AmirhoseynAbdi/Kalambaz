import { UserAccount, PlayerStats, DailyGameState } from '../types';

const TOKEN_STORAGE_KEY = 'kalabaz_session_token';
const ACCOUNTS_STORAGE_KEY = 'kalabaz_accounts';

function createEmptyStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: '',
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  };
}

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

function getLocalAccounts(): { [username: string]: UserAccount } {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAccounts(accounts: { [username: string]: UserAccount }): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
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
  try {
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

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'خطا در ثبت‌نام حساب کاربری.');
      }
      if (data.token) {
        setSessionToken(data.token);
      }
      return data;
    }
  } catch (err: any) {
    // Re-throw explicit API validation errors (which have Persian messages)
    if (err instanceof Error && /[\u0600-\u06FF]/.test(err.message)) {
      throw err;
    }
  }

  // Fallback for static-only cPanel hosting when Node backend is not active
  const accounts = getLocalAccounts();
  if (accounts[username]) {
    throw new Error('این نام کاربری قبلاً ثبت شده است. لطفاً وارد شوید.');
  }
  const newAccount: UserAccount = {
    username,
    password,
    createdAt: new Date().toISOString(),
    stats: initialStats || createEmptyStats(),
    gameStates: initialGameStates || {},
  };
  accounts[username] = newAccount;
  saveLocalAccounts(accounts);
  const localToken = `local:${username}`;
  setSessionToken(localToken);
  return { account: newAccount, token: localToken };
}

export async function apiLogin(
  username: string,
  password: string
): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'خطا در ورود به حساب کاربری.');
      }
      if (data.token) {
        setSessionToken(data.token);
      }
      return data;
    }
  } catch (err: any) {
    if (err instanceof Error && /[\u0600-\u06FF]/.test(err.message)) {
      throw err;
    }
  }

  // Fallback for static-only cPanel hosting when Node backend is not active
  const accounts = getLocalAccounts();
  const existing = accounts[username];
  if (!existing) {
    throw new Error('حسابی با این نام کاربری یافت نشد. ابتدا ثبت‌نام کنید.');
  }
  if (existing.password && existing.password !== password) {
    throw new Error('رمز عبور وارد شده نادرست است.');
  }
  const localToken = `local:${username}`;
  setSessionToken(localToken);
  return { account: existing, token: localToken };
}

export async function apiFetchCurrentUser(): Promise<UserAccount | null> {
  const token = getSessionToken();
  if (!token) return null;

  if (token.startsWith('local:')) {
    const username = token.slice('local:'.length);
    const accounts = getLocalAccounts();
    return accounts[username] || null;
  }

  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }

    if (!res.ok) {
      if (res.status === 401) {
        setSessionToken(null);
      }
      return null;
    }

    const data = await res.json();
    return data?.account || null;
  } catch {
    return null;
  }
}

export async function apiSyncUserData(
  stats: PlayerStats,
  gameStates: { [len: number]: DailyGameState }
): Promise<UserAccount | null> {
  const token = getSessionToken();
  if (!token) return null;

  if (token.startsWith('local:')) {
    const username = token.slice('local:'.length);
    const accounts = getLocalAccounts();
    if (accounts[username]) {
      accounts[username] = {
        ...accounts[username],
        stats,
        gameStates,
      };
      saveLocalAccounts(accounts);
      return accounts[username];
    }
    return null;
  }

  try {
    const res = await fetch('/api/user/sync', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stats, gameStates }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json') || !res.ok) {
      return null;
    }
    const data = await res.json();
    return data?.account || null;
  } catch {
    return null;
  }
}
