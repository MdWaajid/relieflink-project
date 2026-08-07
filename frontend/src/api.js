import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Auth
  login: (email, password) => axios.post(`${API_BASE}/auth/login`, { email, password }).then(r => r.data),
  register: (data) => axios.post(`${API_BASE}/auth/register`, data).then(r => r.data),
  createAuthority: (data) => axios.post(`${API_BASE}/auth/create-authority`, data).then(r => r.data),

  // Camps
  getCamps: (params) => axios.get(`${API_BASE}/camps`, { params }).then(r => r.data),
  createCamp: (data) => axios.post(`${API_BASE}/camps`, data).then(r => r.data),
  createCampWithManager: (data) => axios.post(`${API_BASE}/camps/create-with-manager`, data).then(r => r.data),
  updateCamp: (campId, data) => axios.patch(`${API_BASE}/camps/${campId}`, data).then(r => r.data),

  // NGOs
  getNgos: (params) => axios.get(`${API_BASE}/ngos`, { params }).then(r => r.data),
  createNgo: (data) => axios.post(`${API_BASE}/ngos`, data).then(r => r.data),
  createNgoWithCoordinator: (data) => axios.post(`${API_BASE}/ngos/create-with-coordinator`, data).then(r => r.data),
  addResource: (ngoId, data) => axios.post(`${API_BASE}/ngos/${ngoId}/resources`, data).then(r => r.data),
  getNgoResources: (ngoId) => axios.get(`${API_BASE}/ngos/${ngoId}/resources`).then(r => r.data),
  getAllResources: () => axios.get(`${API_BASE}/resources`).then(r => r.data),

  // Budget Requests
  getBudgetRequests: (params) => axios.get(`${API_BASE}/budget-requests`, { params }).then(r => r.data),
  createBudgetRequest: (data) => axios.post(`${API_BASE}/budget-requests`, data).then(r => r.data),
  reviewBudgetRequest: (bReqId, data) => axios.patch(`${API_BASE}/budget-requests/${bReqId}/review`, data).then(r => r.data),

  // Requests
  getRequests: (params) => axios.get(`${API_BASE}/requests`, { params }).then(r => r.data),
  createRequest: (data) => axios.post(`${API_BASE}/requests`, data).then(r => r.data),
  getRequestMatches: (reqId) => axios.get(`${API_BASE}/requests/${reqId}/matches`).then(r => r.data),
  acceptRequest: (reqId) => axios.patch(`${API_BASE}/requests/${reqId}/accept`).then(r => r.data),
  updateRequestStatus: (reqId, status) => axios.patch(`${API_BASE}/requests/${reqId}/status`, { status }).then(r => r.data),
  overridePriority: (reqId, priority, reason) => axios.patch(`${API_BASE}/requests/${reqId}/priority`, { priority, reason }).then(r => r.data),
  reassignRequest: (reqId, ngoId) => axios.patch(`${API_BASE}/requests/${reqId}/reassign`, { ngo_id: ngoId }).then(r => r.data),

  // Notifications
  getNotifications: () => axios.get(`${API_BASE}/notifications`).then(r => r.data),
  markNotificationRead: (id) => axios.patch(`${API_BASE}/notifications/${id}/read`).then(r => r.data),

  // Analytics
  getAnalytics: () => axios.get(`${API_BASE}/analytics/overview`).then(r => r.data),
};
