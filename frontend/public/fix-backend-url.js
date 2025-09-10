// Emergency fix for backend URL - override any cached references
(function() {
    console.log('🚨 Emergency backend URL fix loading...');
    
    // Override fetch to intercept old Render URLs
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === 'string' && url.includes('campspot-backend.onrender.com')) {
            const fixedUrl = url.replace('campspot-backend.onrender.com', 'campspot-production.up.railway.app');
            console.warn('🔧 OVERRIDING OLD RENDER URL:', url, '→', fixedUrl);
            return originalFetch(fixedUrl, options);
        }
        return originalFetch(url, options);
    };
    
    // Also override Request constructor
    const OriginalRequest = window.Request;
    window.Request = function(input, init) {
        if (typeof input === 'string' && input.includes('campspot-backend.onrender.com')) {
            const fixedInput = input.replace('campspot-backend.onrender.com', 'campspot-production.up.railway.app');
            console.warn('🔧 OVERRIDING OLD RENDER REQUEST:', input, '→', fixedInput);
            return new OriginalRequest(fixedInput, init);
        }
        return new OriginalRequest(input, init);
    };
    
    console.log('✅ Backend URL fix applied - all requests will now use Railway backend');
})();
