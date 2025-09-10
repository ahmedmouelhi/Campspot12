import cache from 'memory-cache';
import { Request, Response, NextFunction } from 'express';

// Cache duration in milliseconds
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const cacheMiddleware = (duration: number = DEFAULT_CACHE_DURATION) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `__express__${req.originalUrl || req.url}`;
        const cachedBody = cache.get(key);

        if (cachedBody) {
            // Ensure JSON responses have the correct Content-Type
            if (typeof cachedBody === 'object' || (typeof cachedBody === 'string' && cachedBody.trim().startsWith('{'))) {
                res.setHeader('Content-Type', 'application/json');
            }
            res.send(cachedBody);
            return;
        }

        // Store the original send function
        const oldSend = res.send;
        
        // Override the send function
        res.send = function(body: any): Response {
            // Put the response in cache
            cache.put(key, body, duration);
            
            // Restore the original send function
            res.send = oldSend;
            return res.send(body);
        };

        next();
    };
};

// Helper function to clear cache for specific routes
export const clearCache = (route: string) => {
    cache.del(`__express__${route}`);
};

// Cache durations for different types of content
export const CACHE_DURATIONS = {
    CAMPING_SITES: 30 * 60 * 1000, // 30 minutes
    ACTIVITIES: 15 * 60 * 1000,    // 15 minutes
    BLOG_POSTS: 60 * 60 * 1000,    // 1 hour
    EQUIPMENT: 10 * 60 * 1000      // 10 minutes
};
