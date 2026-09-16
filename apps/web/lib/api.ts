import axios from 'axios';
import type { ApiErrorBody } from './types';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes('/auth/');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !isAuthRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${apiBaseUrl}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return fallback;
  }

  const message = error.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || fallback;
};

export const isUnauthorizedError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401;

export default api;
