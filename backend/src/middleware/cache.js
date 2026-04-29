const cache = new Map();

// Simple in-memory cache for frequently accessed data
const memoryCache = {
  set: (key, value, ttl = 300000) => { // 5 minutes default TTL
    cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  },
  
  get: (key) => {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      cache.delete(key);
      return null;
    }
    
    return item.value;
  },
  
  delete: (key) => {
    cache.delete(key);
  },
  
  clear: () => {
    cache.clear();
  }
};

// Cache middleware for static resources
const staticCache = (maxAge = 86400000) => { // 24 hours default
  return (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next(); // Don't cache API routes
    }
    
    res.set('Cache-Control', `public, max-age=${maxAge / 1000}`);
    next();
  };
};

// Cache middleware for API responses
const apiCache = (ttl = 300000) => { // 5 minutes default
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = `${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    const cachedData = memoryCache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        memoryCache.set(cacheKey, data, ttl);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// ETag generation for conditional requests
const generateETag = (data) => {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
};

// Conditional request middleware
const conditionalRequest = () => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      const etag = generateETag(data);
      res.set('ETag', etag);
      
      const ifNoneMatch = req.get('If-None-Match');
      if (ifNoneMatch && ifNoneMatch === etag) {
        return res.status(304).end();
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Cache invalidation helper
const invalidateCache = (pattern) => {
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
};

module.exports = {
  memoryCache,
  staticCache,
  apiCache,
  conditionalRequest,
  invalidateCache
};
