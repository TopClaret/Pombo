const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sanitizeData, preventNoSQLInjection, securityHeaders } = require('./middleware/security');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const analysisRoutes = require('./routes/analysis');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;
const { testConnection } = require('./config/database');
const { syncModels } = require('./models');
const SupabaseMigration = require('./utils/supabaseMigration');

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middlewares de segurança adicionais
app.use(securityHeaders);
app.use(sanitizeData);
app.use(preventNoSQLInjection);

// Rate limiting - mais restritivo para endpoints críticos
// const generalLimiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: 'Muitas requisições deste IP, tente novamente mais tarde.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 5, // apenas 5 tentativas de login por IP
//   message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
// });

// app.use(generalLimiter);
// Aplicar rate limiting específico para auth routes será feito nas rotas

// Middleware para parsing JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo ao Pombo - Sistema de Análise de Placas Veiculares',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      upload: '/api/upload', 
      analysis: '/api/analysis',
      dashboard: '/api/dashboard'
    },
    documentation: 'Consulte a documentação da API para mais detalhes'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor funcionando' });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const start = async () => {
  try {
    // Sistema de migração automática para Supabase
    const migration = new SupabaseMigration();
    
    // Testar conexão com Supabase
    const isConnected = await migration.testConnection();
    if (isConnected) {
      console.log('✅ Conexão com Supabase estabelecida');
      
      // Verificar e criar tabelas se necessário
      await migration.migrate();
    } else {
      console.log('⚠️  Não foi possível conectar com Supabase');
      console.log('💡 Verifique se as tabelas existem manualmente no SQL Editor');
    }
    
    // Tentar conexão direta com PostgreSQL (pode falhar)
    try {
      await testConnection();
      await syncModels(false);
    } catch (e) {
      console.log('⚠️  Conexão direta com PostgreSQL falhou - usando modo API REST');
    }
    
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (e) {
    console.log('❌ Erro ao iniciar servidor:', e.message);
  }
};

start();

module.exports = app;
