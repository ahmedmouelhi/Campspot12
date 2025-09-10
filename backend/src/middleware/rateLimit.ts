import rateLimit from 'express-rate-limit';

// Create a limiter middleware (more permissive for development)
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    limit: 1000, // Much higher limit for development
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: 'draft-7', // Set `RateLimit` and `RateLimit-Policy` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting in development for localhost
        return process.env.NODE_ENV === 'development' && 
               (req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === 'localhost');
    }
});

// More restrictive limiter for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // Higher limit for development
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => {
        // Skip auth rate limiting in development for localhost
        return process.env.NODE_ENV === 'development' && 
               (req.ip === '::1' || req.ip === '127.0.0.1' || req.ip === 'localhost');
    }
});
