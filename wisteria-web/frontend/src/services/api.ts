import axios from 'axios';
import { Session, Hypothesis, Model, ApiResponse } from '../types/hypothesis';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://dev-5.bv-brc.org/api';

console.log('API_BASE_URL configured as:', API_BASE_URL);

// Create a simple axios instance without auth interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const apiService = {
  // ----- backend endpoints (no auth required) -----
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