// Debug script to check environment variables
console.log('=== Environment Variables Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('VITE_APP_NAME:', import.meta.env.VITE_APP_NAME);
console.log('VITE_NODE_ENV:', import.meta.env.VITE_NODE_ENV);
console.log('Current URL would be:', (import.meta.env.VITE_API_BASE_URL || '/api') + '/camping-sites');
console.log('===================================');
