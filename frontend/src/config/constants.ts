// Production configuration constants
export const PRODUCTION_BACKEND_URL = 'https://campspot-production.up.railway.app/api';
export const DEVELOPMENT_BACKEND_URL = 'http://localhost:5000/api';

// Override any environment variables that might point to old backends
export const getBackendUrl = (): string => {
  // Force Railway backend for production
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('🚀 Vercel deployment detected - forcing Railway backend');
    return PRODUCTION_BACKEND_URL;
  }
  
  // Local development
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return DEVELOPMENT_BACKEND_URL;
  }
  
  // Default to production
  return PRODUCTION_BACKEND_URL;
};

export const API_CONFIG = {
  BASE_URL: getBackendUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};
