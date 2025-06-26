import axios from 'axios';
import { Session, Hypothesis, Model, ApiResponse } from '../types/hypothesis';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://dev-5.bv-brc.org/api';

console.log('API_BASE_URL configured as:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Authentication
  login: async (username: string, password: string): Promise<ApiResponse<{ user: any }>> => {
    try {
      const response = await api.post('/auth/login', { username, password });
      return { data: { user: response.data.user }, message: response.data.message };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Login failed' };
    }
  },

  createUser: async (username: string, password: string): Promise<ApiResponse<{ user: any }>> => {
    try {
      const response = await api.post('/auth/create-user', { username, password });
      return { data: { user: response.data.user }, message: response.data.message };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'User creation failed' };
    }
  },

  // Health check
  healthCheck: async (): Promise<ApiResponse<{ status: string; message: string }>> => {
    try {
      const response = await api.get('/health');
      return { data: response.data };
    } catch (error) {
      return { error: 'API is not available' };
    }
  },

  // Get available models
  getModels: async (): Promise<ApiResponse<Model[]>> => {
    try {
      console.log('API: Making request to', `${API_BASE_URL}/models`);
      const response = await api.get('/models');
      console.log('API: getModels response:', response.data);
      return { data: response.data.models };
    } catch (error: any) {
      console.error('API: getModels error:', error);
      return { error: error.response?.data?.error || 'Failed to fetch models' };
    }
  },

  // Get all sessions
  getSessions: async (): Promise<ApiResponse<Session[]>> => {
    try {
      console.log('API: Making request to', `${API_BASE_URL}/sessions`);
      const response = await api.get('/sessions');
      console.log('API: getSessions response:', response.data);
      return { data: response.data.sessions };
    } catch (error: any) {
      console.error('API: getSessions error:', error);
      return { error: error.response?.data?.error || 'Failed to fetch sessions' };
    }
  },

  // Create new session
  createSession: async (researchGoal: string, modelShortname: string, apiKey?: string): Promise<ApiResponse<Session>> => {
    try {
      const payload: any = {
        research_goal: researchGoal,
        model_shortname: modelShortname,
      };
      
      if (apiKey && apiKey.trim()) {
        payload.api_key = apiKey;
      }
      
      const response = await api.post('/sessions', payload);
      return { data: response.data.session, message: response.data.message };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to create session' };
    }
  },

  // Get specific session
  getSession: async (sessionId: string): Promise<ApiResponse<Session>> => {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      return { data: response.data.session };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to fetch session' };
    }
  },

  // Generate initial hypothesis
  generateHypothesis: async (sessionId: string, comments?: string, image?: File): Promise<ApiResponse<Hypothesis>> => {
    try {
      let response;
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        if (comments) {
          formData.append('comments', comments);
        }
        response = await api.post(`/sessions/${sessionId}/hypotheses`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const payload: any = {};
        if (comments) {
          payload.comments = comments;
        }
        response = await api.post(`/sessions/${sessionId}/hypotheses`, payload);
      }
      return { data: response.data.hypothesis, message: response.data.message };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to generate hypothesis' };
    }
  },

  // Improve hypothesis
  improveHypothesis: async (sessionId: string, hypothesisId: string, feedback: string, image?: File): Promise<ApiResponse<Hypothesis>> => {
    try {
      let response;
      if (image) {
        const formData = new FormData();
        formData.append('feedback', feedback);
        formData.append('image', image);
        response = await api.post(`/sessions/${sessionId}/hypotheses/${hypothesisId}/improve`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post(`/sessions/${sessionId}/hypotheses/${hypothesisId}/improve`, {
          feedback,
        });
      }
      return { data: response.data.hypothesis, message: response.data.message };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to improve hypothesis' };
    }
  },

  // Generate new hypothesis
  generateNewHypothesis: async (sessionId: string, comments?: string, image?: File): Promise<ApiResponse<Hypothesis>> => {
    try {
      let response;
      if (image || comments) {
        const formData = new FormData();
        if (comments) {
          formData.append('comments', comments);
        }
        if (image) {
          formData.append('image', image);
        }
        response = await api.post(`/sessions/${sessionId}/hypotheses/new`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post(`/sessions/${sessionId}/hypotheses/new`);
      }
      return { data: response.data.hypothesis, message: response.data.message };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to generate new hypothesis' };
    }
  },

  // Get session hypotheses
  getSessionHypotheses: async (sessionId: string): Promise<ApiResponse<Hypothesis[]>> => {
    try {
      const response = await api.get(`/sessions/${sessionId}/hypotheses`);
      return { data: response.data.hypotheses };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to fetch hypotheses' };
    }
  },

  // Delete session
  deleteSession: async (sessionId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete(`/sessions/${sessionId}`);
      return { message: response.data.message };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to delete session' };
    }
  },

  // Download hypothesis as PDF
  downloadHypothesisPdf: async (sessionId: string, hypothesisId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await api.get(`/sessions/${sessionId}/hypotheses/${hypothesisId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'hypothesis.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { message: 'PDF downloaded successfully' };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Failed to download PDF' };
    }
  },
}; 