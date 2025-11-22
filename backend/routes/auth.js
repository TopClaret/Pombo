const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Rate limiting específico para autenticação
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 5, // apenas 5 tentativas por IP
//   message: 'Muitas tentativas, tente novamente em 15 minutos.',
//   standardHeaders: true,
//   legacyHeaders: false,
//   skipSuccessfulRequests: true, // não contar tentativas bem-sucedidas
// });

// Rotas públicas
router.post('/register', register);
router.post('/login', login);

// Rotas protegidas
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

module.exports = router;