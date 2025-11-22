const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Obter estatísticas do dashboard
router.get('/stats', async (req, res) => {
  try {
    // TODO: Implementar estatísticas do dashboard
    res.json({ 
      message: 'Endpoint de estatísticas do dashboard',
      stats: {
        totalUploads: 0,
        processingUploads: 0,
        completedUploads: 0,
        totalAnalysis: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter atividades recentes
router.get('/recent-activities', async (req, res) => {
  try {
    // TODO: Implementar atividades recentes
    res.json({ 
      message: 'Endpoint de atividades recentes',
      activities: []
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;