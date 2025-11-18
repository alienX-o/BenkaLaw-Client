import axios from 'axios';
import { getItem, removeItem, setItem } from './asyncStorage';
import { replace } from '../navigation/RootNavigation';

const httpCommon = axios.create({
  baseURL: 'https://q1gdzrt1-3000.inc1.devtunnels.ms/api',
  //this is a server endpoint which will forward all the requests to the main api end point
  // baseURL: 'https://b96e0c0091e3.ngrok-free.app/api',
  timeout: 60000, // 60 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    // Add any other headers you need, such as Authorization headers
  },
});

// --- State for handling token refresh ---
let isRefreshing = false;
let failedQueue = [];

// Request Interceptor: Adds the Authorization token to requests.
httpCommon.interceptors.request.use(
  async config => {
    if (config.passToken) {
      const token = await getItem('accessToken');
      // const token = '12312';

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Clean up the custom flag before sending the request
    delete config.passToken;
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handles token refresh on 401 Unauthorized errors.
httpCommon.interceptors.response.use(
  response => response, // Directly return successful responses.
  async error => {
    const originalRequest = error.config;
    console.log('hi');
    console.log('staus', error.response?.status);
    console.log('message', error.response?.data.message);
    console.log('url', error.response?.config.url);
    console.log('headers', error.response?.headers);

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      error.response.data.message === 'Unauthorized' &&
      originalRequest.url !== '/auth/login'
    ) {
      originalRequest._retry = true; // Mark as a retry to prevent infinite loops.

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return httpCommon(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      console.log('Access token expired. Attempting to refresh...');

      try {
        const accessToken = await getItem('accessToken');
        const refreshToken = await getItem('refreshToken');

        if (!accessToken || !refreshToken) {
          console.error('Access or Refresh token not found for refresh call.');
          replace('Login');
          return Promise.reject(error);
        }

        // Make the refresh token API call.
        const { data: refreshResponse } = await httpCommon.post(
          '/auth/refresh',
          { accessToken, refreshToken },
          { passToken: false }, // Ensure this call doesn't try to add an auth header
        );

        if (refreshResponse.accessToken && refreshResponse.refreshToken) {
          console.log('Token refreshed successfully.');
          await setItem('accessToken', refreshResponse.accessToken);
          await setItem('refreshToken', refreshResponse.refreshToken);

          httpCommon.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${refreshResponse.accessToken}`;
          originalRequest.headers[
            'Authorization'
          ] = `Bearer ${refreshResponse.accessToken}`;

          processQueue(null, refreshResponse.accessToken);
          // Update the Authorization header of the original request and retry it.
          return httpCommon(originalRequest);
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        processQueue(refreshError, null);
        // If refresh fails, clear tokens and navigate to login.
        await removeItem('accessToken');
        await removeItem('refreshToken');
        await removeItem('userDetails');
        replace('Login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors, just reject the promise.
    console.error('API Error:', error.response?.data || error.message || error);
    return Promise.reject(error);
  },
);

const api = {
  get: (url, params = {}, config = {}) =>
    httpCommon.get(url, { params, ...config }).then(res => res.data),

  post: (url, data = {}, config = {}) =>
    httpCommon.post(url, data, config).then(res => res.data),

  put: (url, data = {}, config = {}) =>
    httpCommon.put(url, data, config).then(res => res.data),

  patch: (url, data = {}, config = {}) =>
    httpCommon.patch(url, data, config).then(res => res.data),

  delete: (url, config = {}) =>
    httpCommon.delete(url, config).then(res => res.data),
};

export { api };
