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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for Response
axiosClient.interceptors.response.use(
  (response) => {
    // Fast path to return the whole BaseResponse object, or extract if needed.
    if(response.data && response.data.success !== undefined) {
         if(!response.data.success) {
            return Promise.reject(new Error(response.data.message || 'API Error'));
         }
         return response.data; // Return the whole BaseResponse
    }
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data?.message || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
