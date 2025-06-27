import axios from 'axios';
import { Session, Hypothesis, Model, ApiResponse } from '../types/hypothesis';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://dev-5.bv-brc.org/api';

console.log('API_BASE_URL configured as:', API_BASE_URL);

// ----------------- Auth / localStorage helpers -----------------
interface AuthData {
  user: { id: string; username: string };
  token: string;
  expiresAt: number;
}
const AUTH_KEY = 'wisteria_auth';
const SESSION_MS = 24 * 60 * 60 * 1000; // 24 h

const saveAuth = (user: any, token: string) => {
  const data: AuthData = { user, token, expiresAt: Date.now() + SESSION_MS };
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
};

const readAuth = (): AuthData | null => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data: AuthData = JSON.parse(raw);
    if (Date.now() > data.expiresAt) {
      clearAuth();
      return null;
    }
    return data;
  } catch {
    clearAuth();
    return null;
  }
};

const clearAuth = () => localStorage.removeItem(AUTH_KEY);
// ---------------------------------------------------------------

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const a = readAuth();
  if (a?.token) cfg.headers.Authorization = `Bearer ${a.token}`;
  return cfg;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      clearAuth();
      window.dispatchEvent(new CustomEvent('authExpired'));
    }
    return Promise.reject(err);
  }
);

export const apiService = {
  // ----- auth helpers -----
  saveAuth,
  getStoredAuth: readAuth,
  clearAuth,
  isAuthValid: () => Boolean(readAuth()),

  // ----- backend endpoints -----
  login: async (username: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> => {
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.user && res.data.token) saveAuth(res.data.user, res.data.token);
      return { data: { user: res.data.user, token: res.data.token }, message: res.data.message };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Login failed' };
    }
  },

  createUser: async (username: string, password: string): Promise<ApiResponse<{ user: any }>> => {
    try {
      const res = await api.post('/auth/create-user', { username, password });
      return { data: { user: res.data.user }, message: res.data.message };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'User creation failed' };
    }
  },

  healthCheck: async (): Promise<ApiResponse<{ status: string; message: string }>> => {
    try {
      const res = await api.get('/health');
      return { data: res.data };
    } catch {
      return { error: 'API not available' };
    }
  },

  getModels: async (): Promise<ApiResponse<Model[]>> => {
    try {
      const res = await api.get('/models');
      return { data: res.data.models };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Failed to fetch models' };
    }
  },

  getSessions: async (): Promise<ApiResponse<Session[]>> => {
    try {
      const res = await api.get('/sessions');
      return { data: res.data.sessions };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Failed to fetch sessions' };
    }
  },

  createSession: async (goal: string, modelShort: string, apiKey?: string): Promise<ApiResponse<Session>> => {
    try {
      const payload: any = { research_goal: goal, model_shortname: modelShort };
      if (apiKey?.trim()) payload.api_key = apiKey.trim();
      const res = await api.post('/sessions', payload);
      return { data: res.data.session, message: res.data.message };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Failed to create session' };
    }
  },

  getSession: async (id: string): Promise<ApiResponse<Session>> => {
    try {
      const res = await api.get(`/sessions/${id}`);
      return { data: res.data.session };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Failed to fetch session' };
    }
  },

  generateHypothesis: async (sessionId: string, comments?: string, image?: File): Promise<ApiResponse<Hypothesis>> => {
    try {
      let res;
      if (image) {
        const fd = new FormData();
        fd.append('image', image);
        if (comments) fd.append('comments', comments);
        res = await api.post(`/sessions/${sessionId}/hypotheses`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post(`/sessions/${sessionId}/hypotheses`, comments ? { comments } : {});
      }
      return { data: res.data.hypothesis, message: res.data.message };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Failed to generate hypothesis' };
    }
  },

  improveHypothesis: async (sessionId: string, hypId: string, feedback: string, image?: File): Promise<ApiResponse<Hypothesis>> => {
    try {
      let res;
      if (image) {
        const fd = new FormData();
        fd.append('image', image);
        fd.append('feedback', feedback);
        res = await api.post(`/sessions/${sessionId}/hypotheses/${hypId}/improve`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post(`/sessions/${sessionId}/hypotheses/${hypId}/improve`, { feedback });
      }
      return { data: res.data.hypothesis, message: res.data.message };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Failed to improve hypothesis' };
    }
  },

  generateNewHypothesis: async (sessionId: string, comments?: string, image?: File): Promise<ApiResponse<Hypothesis>> => {
    try {
      let res;
      if (image || comments) {
        const fd = new FormData();
        if (image) fd.append('image', image);
        if (comments) fd.append('comments', comments);
        res = await api.post(`/sessions/${sessionId}/hypotheses/new`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post(`/sessions/${sessionId}/hypotheses/new`);
      }
      return { data: res.data.hypothesis, message: res.data.message };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Failed to generate new hypothesis' };
    }
  },

  getSessionHypotheses: async (sessionId: string): Promise<ApiResponse<Hypothesis[]>> => {
    try {
      const res = await api.get(`/sessions/${sessionId}/hypotheses`);
      return { data: res.data.hypotheses };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Failed to fetch hypotheses' };
    }
  },

  deleteSession: async (sessionId: string): Promise<ApiResponse<void>> => {
    try {
      const res = await api.delete(`/sessions/${sessionId}`);
      return { message: res.data.message };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Failed to delete session' };
    }
  },

  downloadHypothesisPdf: async (sessionId: string, hypId: string): Promise<ApiResponse<void>> => {
    try {
      const res = await api.get(`/sessions/${sessionId}/hypotheses/${hypId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const cd = res.headers['content-disposition'];
      link.download = cd?.match(/filename="(.+)"/)?.[1] || 'hypothesis.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { message: 'PDF downloaded' };
    } catch (e: any) {
      return { error: e.response?.data?.error || 'Failed to download PDF' };
    }
  },
}; 