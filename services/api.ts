import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://cycle-tracker-2igy.onrender.com/api'; // Update this with your machine IP for physical device testing

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log('📦 [Payload]:', JSON.stringify(config.data, null, 2));
    }
    
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to log responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response} ${response.config.url}`);
    if (response.data) {
      console.log('📥 [Data]:', JSON.stringify(response.data, null, 2));
    }
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ [API Error] ${error} ${error.config.url}`);
      console.error('📥 [Error Data]:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('🌐 [Network Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
