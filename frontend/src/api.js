const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

const jsonHeaders = {
  'Content-Type': 'application/json'
};

const getToken = () => localStorage.getItem('authToken');
const setToken = (token) => localStorage.setItem('authToken', token);
const clearToken = () => localStorage.removeItem('authToken');
const getGoogleAuthUrl = () => `${API_BASE_URL}/auth/google`;

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? 'Request failed');
  }

  return data;
};

const request = (path, options = {}) => {
  const headers = {
    ...jsonHeaders,
    ...(options.headers ?? {})
  };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  }).then(handleResponse);
};

export { clearToken, getGoogleAuthUrl, getToken, request, setToken };
