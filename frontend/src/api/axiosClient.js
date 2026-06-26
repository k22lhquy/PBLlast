import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for Request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser/Axios set Content-Type automatically for FormData (includes boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
}

// Interceptor for Response
axiosClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined) {
      if (!response.data.success) {
        return Promise.reject(new Error(response.data.message || 'API Error'));
      }
      return response.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check for 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Use axios directly to avoid interceptor loop
          const res = await axios.post('http://localhost:8000/auth/refresh', {
             refresh_token: refreshToken
          });
          
          if (res.data.success) {
            const { access_token, refresh_token } = res.data.data;
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            
            isRefreshing = false;
            onRefreshed(access_token);
            refreshSubscribers = [];
            
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return axiosClient(originalRequest);
          }
        } catch (refreshError) {
          console.error("Refresh token failed:", refreshError);
        }
      }
      
      // If refresh fails or no refresh token, logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      isRefreshing = false;
      refreshSubscribers = [];
      // window.location.href = '/login'; // Optional: Redirect if possible
    }

    console.error('API Error:', error.response?.data?.message || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
