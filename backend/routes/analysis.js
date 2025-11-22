const express = require('express');
const { authenticate } = require('../middleware/auth');
const { Analysis, Upload } = require('../models');
const aiProcessorService = require('../services/aiProcessorService');
const logger = require('../utils/logger');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Iniciar análise de placas veiculares
router.post('/upload/:uploadId/analyze-plates', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user.id;

    // Buscar o upload
    const upload = await Upload.findOne({
      where: { id: uploadId, userId }
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload não encontrado' });
    }

    // Verificar se já existe análise para este upload
    const existingAnalysis = await Analysis.findOne({
      where: { uploadId, analysisType: 'plate_recognition' }
    });

    if (existingAnalysis) {
      return res.status(400).json({ 
        error: 'Análise de placas já realizada para este upload',
        analysisId: existingAnalysis.id
      });
    }

    // Criar registro de análise
    const analysis = await Analysis.create({
      uploadId,
      analysisType: 'plate_recognition',
      status: 'processing',
      metadata: {
        requestedBy: userId,
        requestTimestamp: new Date().toISOString()
      }
    });

    // Processar em background (não bloquear a resposta)
    processLicensePlateAnalysis(analysis, upload);

    res.status(202).json({
      message: 'Análise de placas veiculares iniciada',
      analysisId: analysis.id,
      status: 'processing'
    });

  } catch (error) {
    logger.error(`Erro ao iniciar análise: ${error.message}`);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter status da análise
router.get('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    const userId = req.user.id;

    const analysis = await Analysis.findOne({
      include: [{
        model: Upload,
        where: { userId },
        attributes: []
      }]
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Análise não encontrada' });
    }

    res.json(analysis);

  } catch (error) {
    logger.error(`Erro ao buscar análise: ${error.message}`);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter análises de um upload específico
router.get('/upload/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user.id;

    // Verificar se o upload pertence ao usuário
    const upload = await Upload.findOne({
      where: { id: uploadId, userId }
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload não encontrado' });
    }

    // Buscar análises do upload
    const analyses = await Analysis.findAll({
      where: { uploadId },
      order: [['createdAt', 'DESC']]
    });

    res.json(analyses);

  } catch (error) {
    logger.error(`Erro ao buscar análises: ${error.message}`);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter veículos repetidos across all uploads
router.get('/repeated-vehicles', async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar todas as análises de placas concluídas do usuário
    const analyses = await Analysis.findAll({
      include: [{
        model: Upload,
        where: { userId },
        attributes: ['id', 'originalName', 'createdAt']
      }],
      where: { 
        analysisType: 'plate_recognition',
        status: 'completed'
      }
    });

    // Processar veículos repetidos
    const vehicleMap = new Map();
    
    analyses.forEach(analysis => {
      const plates = analysis.results?.detectedPlates || [];
      
      plates.forEach(plate => {
        if (!vehicleMap.has(plate.plateNumber)) {
          vehicleMap.set(plate.plateNumber, []);
        }
        
        vehicleMap.get(plate.plateNumber).push({
          uploadId: analysis.Upload.id,
          fileName: analysis.Upload.originalName,
          uploadDate: analysis.Upload.createdAt,
          analysisId: analysis.id,
          confidence: plate.confidence,
          timestamp: plate.timestamp
        });
      });
    });

    // Filtrar apenas veículos que aparecem múltiplas vezes
    const repeatedVehicles = {};
    
    for (const [plateNumber, occurrences] of vehicleMap.entries()) {
      if (occurrences.length > 1) {
        repeatedVehicles[plateNumber] = {
          occurrences: occurrences.length,
          details: occurrences
        };
      }
    }

    res.json({
      totalUniqueVehicles: vehicleMap.size,
      totalDetections: analyses.reduce((sum, a) => sum + (a.results?.detectedPlates?.length || 0), 0),
      repeatedVehicles: repeatedVehicles,
      summary: {
        totalAnalyses: analyses.length,
        totalUploads: new Set(analyses.map(a => a.uploadId)).size
      }
    });

  } catch (error) {
    logger.error(`Erro ao buscar veículos repetidos: ${error.message}`);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para processar análise em background
async function processLicensePlateAnalysis(analysis, upload) {
  try {
    logger.info(`Iniciando processamento de análise ${analysis.id} para upload ${upload.id}`);
    
    // Chamar o serviço AI
    const results = await aiProcessorService.recognizeLicensePlates(upload.filePath);
    
    // Atualizar análise com resultados
    await analysis.update({
      status: 'completed',
      results: {
        detectedPlates: results.detected_plates || [],
        totalDetections: results.total_detections || 0,
        processingTime: results.processing_time,
        fileInfo: {
          fileName: upload.originalName,
          fileSize: upload.fileSize,
          fileType: upload.fileType
        }
      },
      processingTime: results.processing_time,
      confidence: results.average_confidence
    });

    logger.info(`Análise ${analysis.id} concluída com sucesso`);

  } catch (error) {
    logger.error(`Erro no processamento da análise ${analysis.id}: ${error.message}`);
    
    await analysis.update({
      status: 'failed',
      errorMessage: error.message,
      results: {
        error: error.message,
        processed: false
      }
    });
  }
}

module.exports = router;