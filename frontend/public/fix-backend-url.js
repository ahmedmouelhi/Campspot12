// ULTRA-AGGRESSIVE URL OVERRIDE - CATCH ALL POSSIBLE SCENARIOS
(function() {
    console.log('🚨 ULTRA-AGGRESSIVE backend URL fix loading...');
    
    const CORRECT_BACKEND_URL = 'https://campspot-production.up.railway.app/api';
    const OLD_RENDER_DOMAINS = [
        'campspot-backend.onrender.com',
        'https://campspot-backend.onrender.com',
        'http://campspot-backend.onrender.com'
    ];
    
    // Function to fix any URL containing old domains
    function fixUrl(url) {
        if (typeof url !== 'string') return url;
        
        for (const oldDomain of OLD_RENDER_DOMAINS) {
            if (url.includes(oldDomain)) {
                let fixedUrl = url.replace(oldDomain, 'campspot-production.up.railway.app');
                // Ensure it uses HTTPS
                if (fixedUrl.startsWith('http://campspot-production.up.railway.app')) {
                    fixedUrl = fixedUrl.replace('http://', 'https://');
                }
                console.warn('🔧 URL OVERRIDE:', url, '→', fixedUrl);
                return fixedUrl;
            }
        }
        return url;
    }
    
    // Override fetch
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        const fixedUrl = fixUrl(url);
        if (fixedUrl !== url) {
            console.log('🌐 FETCH OVERRIDE APPLIED');
        }
        return originalFetch(fixedUrl, options);
    };
    
    // Override Request constructor
    const OriginalRequest = window.Request;
    window.Request = function(input, init) {
        const fixedInput = fixUrl(input);
        if (fixedInput !== input) {
            console.log('📝 REQUEST OVERRIDE APPLIED');
        }
        return new OriginalRequest(fixedInput, init);
    };
    
    // Override XMLHttpRequest
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new OriginalXHR();
        const originalOpen = xhr.open;
        xhr.open = function(method, url, ...args) {
            const fixedUrl = fixUrl(url);
            if (fixedUrl !== url) {
                console.log('🌐 XHR OVERRIDE APPLIED');
            }
            return originalOpen.call(this, method, fixedUrl, ...args);
        };
        return xhr;
    };
    
    // Force correct API URL in global scope if needed
    window.CAMPSPOT_API_URL = CORRECT_BACKEND_URL;
    
    // Log every 5 seconds to confirm override is active
    setInterval(() => {
        console.log('🛡️ URL Override Active - Railway backend enforced');
    }, 5000);
    
    console.log('✅ ULTRA-AGGRESSIVE backend URL fix applied - ALL requests will use Railway backend');
    console.log('🎯 Target backend URL:', CORRECT_BACKEND_URL);
})();
