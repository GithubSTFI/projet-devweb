const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for auth endpoints (login, register, forgot-password).
 * Allows 10 attempts per 15 minutes per IP, then blocks.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.'
    },
    handler: (req, res, next, options) => {
        console.warn(`[SECURITY] Rate limit hit: IP=${req.ip}, path=${req.path}, time=${new Date().toISOString()}`);
        res.status(429).json(options.message);
    }
});

/**
 * General API limiter – less strict, for all other protected routes.
 * 200 requests per minute per IP.
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Trop de requêtes. Veuillez ralentir.'
    }
});

module.exports = { authLimiter, apiLimiter };
