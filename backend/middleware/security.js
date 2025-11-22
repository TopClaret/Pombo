const xss = require('xss');

// Sanitização de dados para prevenir XSS
const sanitizeData = (req, res, next) => {
  // Função para sanitizar objetos recursivamente
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? xss(obj) : obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  };
  
  // Sanitizar body, query e params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Prevenção de ataques de injeção NoSQL
const preventNoSQLInjection = (req, res, next) => {
  const checkForNoSQLInjection = (obj) => {
    if (typeof obj === 'string') {
      // Verificar padrões comuns de injeção NoSQL
      const noSQLPatterns = [
        /\$where/i,
        /\$ne/i,
        /\$gt/i,
        /\$lt/i,
        /\$gte/i,
        /\$lte/i,
        /\$in/i,
        /\$nin/i,
        /\$exists/i,
        /\$regex/i,
        /\$options/i,
        /\$elemMatch/i,
        /\$all/i,
        /\$size/i,
        /\$type/i,
        /\$not/i,
        /\$mod/i,
        /\$text/i,
        /\$search/i,
        /\$language/i,
        /\$caseSensitive/i,
        /\$diacriticSensitive/i
      ];
      
      for (const pattern of noSQLPatterns) {
        if (pattern.test(obj)) {
          throw new Error('Tentativa de injeção NoSQL detectada');
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          checkForNoSQLInjection(obj[key]);
        }
      }
    }
  };
  
  try {
    checkForNoSQLInjection(req.body);
    checkForNoSQLInjection(req.query);
    checkForNoSQLInjection(req.params);
    next();
  } catch (error) {
    res.status(400).json({ 
      error: 'Requisição inválida',
      message: error.message 
    });
  }
};

// Headers de segurança adicionais
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

module.exports = {
  sanitizeData,
  preventNoSQLInjection,
  securityHeaders
};