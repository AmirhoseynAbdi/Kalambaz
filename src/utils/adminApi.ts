import { PlayerStats, DailyGameState } from '../types';

export interface SiteAnnouncement {
  enabled: boolean;
  message: string;
  linkUrl: string;
  tone: 'emerald' | 'purple' | 'amber' | 'sky';
  updatedAt?: string;
}

export interface PublicGameConfig {
  dateKey: string;
  wordOverrides: { [len: number]: string };
  announcement: SiteAnnouncement;
}

export interface AdminAuthStatus {
  configured: boolean;
  hasEnvPassword: boolean;
  canClaimSetup: boolean;
  authenticated: boolean;
}

export interface SocialChannelReadiness {
  telegram1: boolean;
  telegram2: boolean;
  x: boolean;
  postUrl: string;
  telegramChat1Label?: string;
  telegramChat2Label?: string;
}

export interface AdminOverviewData {
  todayTehran: string;
  kpis: {
    totalUsers: number;
    activeToday: number;
    totalGamesPlayed: number;
    totalGamesWon: number;
    winRate: number;
    totalSeeds: number;
    totalReferrals: number;
    pushSubscribers: number;
    socialPostsSent: number;
    scheduledPostsCount: number;
  };
  activitySeries: Array<{
    date: string;
    signups: number;
    activePlayers: number;
  }>;
  todayWords: Array<{
    length: 4 | 5 | 6;
    word: string;
    defaultWord: string;
    isOverridden: boolean;
    note?: string;
  }>;
  channels: SocialChannelReadiness;
  announcement: SiteAnnouncement;
}

export interface AdminUserRecord {
  username: string;
  stats: PlayerStats;
  gameStates: { [len: number]: DailyGameState };
  createdAt: string;
  updatedAt: string;
  pushSubscriptionsCount: number;
}

export interface SocialPostTargets {
  telegram1: boolean;
  telegram2: boolean;
  x: boolean;
}

export interface SocialPostDeliveryItem {
  channel: 'telegram-1' | 'telegram-2' | 'x';
  status: 'sent' | 'failed';
  error?: string;
  at: string;
}

export interface AdminSocialPost {
  id: number;
  title: string;
  bodyText: string;
  includeLink: boolean;
  mode: 'draft' | 'template' | 'scheduled' | 'published';
  targets: SocialPostTargets;
  scheduledFor: string | null;
  status: 'draft' | 'scheduled' | 'sent' | 'partial' | 'failed';
  deliveries: SocialPostDeliveryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyWordRow {
  dateKey: string;
  isToday: boolean;
  words: {
    [len: number]: {
      word: string;
      defaultWord: string;
      isOverridden: boolean;
      note: string;
    };
  };
}

export interface AdminPushStats {
  totalSubscriptions: number;
  linkedUsersCount: number;
  guestDevicesCount: number;
  pushedTodayCount: number;
  todayTehran: string;
  recentSubscriptions: Array<{
    id: string;
    host: string;
    username: string | null;
    lastPushedDate: string | null;
    createdAt: string;
  }>;
}

export interface AdminReferralsData {
  totalReferrals: number;
  totalRewardSeeds: number;
  leaderboard: Array<{
    username: string;
    referralsCount: number;
    totalRewardSeeds: number;
  }>;
  recent: Array<{
    inviteeUsername: string;
    referrerUsername: string;
    rewardPoints: number;
    createdAt: string;
  }>;
}

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function requestAdmin<T>(
  path: string,
  options: {
    method?: string;
    token?: string | null;
    body?: unknown;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new AdminApiError(
      res.ok ? 'Invalid JSON response from server.' : `Server error (${res.status})`,
      res.status
    );
  }

  if (!res.ok) {
    throw new AdminApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export async function fetchPublicGameConfig(dateKey?: string): Promise<PublicGameConfig | null> {
  try {
    const query = dateKey ? `?date=${encodeURIComponent(dateKey)}` : '';
    const res = await fetch(`/api/game/config${query}`);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return (await res.json()) as PublicGameConfig;
  } catch {
    return null;
  }
}

export const adminApi = {
  getStatus: (token?: string | null) =>
    requestAdmin<AdminAuthStatus>('/api/admin/status', { token }),

  setupPassword: (password: string) =>
    requestAdmin<{ ok: boolean; token: string }>('/api/admin/setup', {
      method: 'POST',
      body: { password },
    }),

  login: (password: string) =>
    requestAdmin<{ ok: boolean; token: string }>('/api/admin/login', {
      method: 'POST',
      body: { password },
    }),

  logout: (token: string) =>
    requestAdmin<{ ok: boolean }>('/api/admin/logout', {
      method: 'POST',
      token,
    }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    requestAdmin<{ ok: boolean; note?: string }>('/api/admin/password', {
      method: 'PUT',
      token,
      body: { currentPassword, newPassword },
    }),

  getOverview: (token: string) =>
    requestAdmin<AdminOverviewData>('/api/admin/overview', { token }),

  getUsers: (token: string) =>
    requestAdmin<{ users: AdminUserRecord[] }>('/api/admin/users', { token }),

  updateUser: (
    token: string,
    username: string,
    payload: {
      stats?: Partial<PlayerStats>;
      gameStates?: { [len: number]: DailyGameState };
      resetToday?: boolean;
      newPassword?: string;
    }
  ) =>
    requestAdmin<{ ok: boolean; user: AdminUserRecord }>(
      `/api/admin/users/${encodeURIComponent(username)}`,
      {
        method: 'PUT',
        token,
        body: payload,
      }
    ),

  deleteUser: (token: string, username: string) =>
    requestAdmin<{ ok: boolean }>(
      `/api/admin/users/${encodeURIComponent(username)}`,
      {
        method: 'DELETE',
        token,
      }
    ),

  getSocialPosts: (token: string) =>
    requestAdmin<{ posts: AdminSocialPost[]; channels: SocialChannelReadiness }>(
      '/api/admin/social/posts',
      { token }
    ),

  createSocialPost: (
    token: string,
    payload: {
      title?: string;
      bodyText: string;
      includeLink: boolean;
      mode: 'draft' | 'template' | 'scheduled' | 'published';
      targets: SocialPostTargets;
      scheduledFor?: string | null;
      publishNow?: boolean;
    }
  ) =>
    requestAdmin<{ ok: boolean; post: AdminSocialPost }>('/api/admin/social/posts', {
      method: 'POST',
      token,
      body: payload,
    }),

  updateSocialPost: (
    token: string,
    id: number,
    payload: {
      title?: string;
      bodyText?: string;
      includeLink?: boolean;
      mode?: 'draft' | 'template' | 'scheduled' | 'published';
      targets?: SocialPostTargets;
      scheduledFor?: string | null;
    }
  ) =>
    requestAdmin<{ ok: boolean; post: AdminSocialPost }>(`/api/admin/social/posts/${id}`, {
      method: 'PUT',
      token,
      body: payload,
    }),

  deleteSocialPost: (token: string, id: number) =>
    requestAdmin<{ ok: boolean }>(`/api/admin/social/posts/${id}`, {
      method: 'DELETE',
      token,
    }),

  publishSocialPost: (token: string, id: number, retryFailedOnly = false) =>
    requestAdmin<{ ok: boolean; post: AdminSocialPost }>(
      `/api/admin/social/posts/${id}/publish`,
      {
        method: 'POST',
        token,
        body: { retryFailedOnly },
      }
    ),

  getDailyWords: (token: string, days = 21) =>
    requestAdmin<{ todayTehran: string; rows: DailyWordRow[] }>(
      `/api/admin/daily-words?days=${days}`,
      { token }
    ),

  setDailyWordOverride: (
    token: string,
    payload: { dateKey: string; wordLength: 4 | 5 | 6; word: string; note?: string }
  ) =>
    requestAdmin<{ ok: boolean; word: string }>('/api/admin/daily-words', {
      method: 'PUT',
      token,
      body: payload,
    }),

  deleteDailyWordOverride: (token: string, dateKey: string, wordLength: 4 | 5 | 6) =>
    requestAdmin<{ ok: boolean }>(
      `/api/admin/daily-words/${encodeURIComponent(dateKey)}/${wordLength}`,
      {
        method: 'DELETE',
        token,
      }
    ),

  getPushStats: (token: string) =>
    requestAdmin<AdminPushStats>('/api/admin/push/stats', { token }),

  sendPushBroadcast: (token: string, force = true) =>
    requestAdmin<{
      ok: boolean;
      dateTehran: string;
      totalChecked: number;
      sent: number;
      pruned: number;
      failed: number;
    }>('/api/admin/push/broadcast', {
      method: 'POST',
      token,
      body: { force },
    }),

  getReferrals: (token: string) =>
    requestAdmin<AdminReferralsData>('/api/admin/referrals', { token }),

  getAnnouncement: (token: string) =>
    requestAdmin<{ announcement: SiteAnnouncement }>('/api/admin/announcement', { token }),

  updateAnnouncement: (token: string, announcement: SiteAnnouncement) =>
    requestAdmin<{ ok: boolean; announcement: SiteAnnouncement }>('/api/admin/announcement', {
      method: 'PUT',
      token,
      body: announcement,
    }),
};
