import { auth } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Retrieve current Firebase user ID token to authenticate API requests
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    if (typeof window !== 'undefined' && auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {
    // If not authenticated or in static render, proceed without header
  }
  return headers;
}

export interface PracticeItem {
  id: string;
  pillarType: 'asana' | 'mudra' | 'mantra';
  title: string;
  sanskritTitle?: string;
  subtitle?: string;
  description: string;
  difficulty: 'foundations' | 'intermediate' | 'deepening';
  imageUrl?: string;
  imageFileName?: string;
  imageResolution?: string;
  imageAlt?: string;
  audioUrl?: string;
  audioFileName?: string;
  audioDuration?: string;
  audioDetails?: string;
  alignmentCues?: string[];
  breathPacing?: string;
  pranicCurrent?: string;
  targetChakra?: string;
  durationMinutes?: number;
  holdBreaths?: string;
  isPublishedToHomeHub: boolean;
  featureInTodayClass: boolean;
  classSessionName?: string;
  createdAt: string;
  updatedAt: string;
  curatedBy?: string;
}

export interface StudioMetrics {
  activeAsanas: number;
  totalMudras: number;
  totalMantras: number;
  newAsanasThisTerm: number;
  pranaVayusCovered: string;
  averageListenRate: string;
  studentCompletionCountToday: number;
  foundationsCount: number;
  intermediateCount: number;
  advancedCount: number;
}

export interface TodayClassReview {
  id: string;
  title: string;
  intent: string;
  focusSummary: string;
  sessionTime: string;
  studioRoom: string;
  curatedBy: string;
  curatorNote: string;
  estimatedDurationMinutes: number;
  completedClassmatesCount: number;
  userStreakDays: number;
  assignedItems: PracticeItem[];
}

export const api = {
  async getMetrics(): Promise<StudioMetrics> {
    const res = await fetch(`${API_BASE_URL}/curriculum/metrics`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch studio metrics');
    return res.json();
  },

  async getCurriculum(params?: {
    pillar?: string;
    difficulty?: string;
    search?: string;
    sort?: string;
  }): Promise<PracticeItem[]> {
    const query = new URLSearchParams();
    if (params?.pillar) query.append('pillar', params.pillar);
    if (params?.difficulty) query.append('difficulty', params.difficulty);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);

    const res = await fetch(`${API_BASE_URL}/curriculum?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch curriculum items');
    return res.json();
  },

  async getCurriculumItem(id: string): Promise<PracticeItem> {
    const res = await fetch(`${API_BASE_URL}/curriculum/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch practice item ${id}`);
    return res.json();
  },

  async createCurriculumItem(item: Partial<PracticeItem>): Promise<PracticeItem> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/curriculum`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create practice item');
    }
    return res.json();
  },

  async updateCurriculumItem(id: string, item: Partial<PracticeItem>): Promise<PracticeItem> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/curriculum/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update practice item');
    }
    return res.json();
  },

  async deleteCurriculumItem(id: string): Promise<{ success: boolean }> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/curriculum/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete practice item');
    }
    return res.json();
  },

  async getTodayClassSequence(userId?: string): Promise<TodayClassReview> {
    const url = userId
      ? `${API_BASE_URL}/classes/today?userId=${encodeURIComponent(userId)}`
      : `${API_BASE_URL}/classes/today`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch today's class sequence");
    return res.json();
  },

  async completeTodaySession(userId?: string): Promise<{ success: boolean; newStreak: number }> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/classes/today/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to log completed session');
    return res.json();
  },

  async uploadMedia(file: File): Promise<{
    url: string;
    fileName: string;
    size: number;
    mimetype: string;
    isAudio: boolean;
  }> {
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of 5MB.`);
    }

    const authHeaders = await getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload media file (maximum 5MB allowed)');
    }
    const data = await res.json();

    // If url is relative like /uploads/..., prefix with API_BASE_URL
    if (data.url && data.url.startsWith('/uploads/')) {
      data.url = `http://localhost:3001${data.url}`;
    }
    return data;
  },


  async createTeacher(email: string, displayName?: string): Promise<{
    uid: string;
    email: string;
    displayName: string;
    role: 'teacher';
    createdAt: string;
  }> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/auth/teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ email, displayName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create teacher account');
    }
    return res.json();
  },

  async createStudent(email: string, displayName?: string): Promise<{
    uid: string;
    email: string;
    displayName: string;
    role: 'student';
    streakDays: number;
    createdAt: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/auth/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create student account');
    }
    return res.json();
  },

  async getMe(token?: string, userId?: string): Promise<{
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: 'teacher' | 'student';
    streakDays?: number;
    createdAt: string;
  }> {
    const authHeaders = await getAuthHeaders();
    const headers: Record<string, string> = { ...authHeaders };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await fetch(`${API_BASE_URL}/auth/me${query}`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async updateMe(token: string | undefined, updates: { displayName?: string; photoURL?: string; role?: 'teacher' | 'student' }): Promise<any> {
    const authHeaders = await getAuthHeaders();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update user profile');
    return res.json();
  },

  async getUsers(role?: 'teacher' | 'student'): Promise<any[]> {
    const authHeaders = await getAuthHeaders();
    const query = role ? `?role=${role}` : '';
    const res = await fetch(`${API_BASE_URL}/auth/users${query}`, {
      headers: { ...authHeaders },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
};

