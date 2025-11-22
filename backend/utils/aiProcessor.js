const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { Upload, Analysis } = require('../models');
const ocrService = require('../services/ocrService');
const aiProcessorService = require('../services/aiProcessorService');
const logger = require('./logger');

// Processar análise de arquivo
const processFileAnalysis = async (uploadId) => {
  try {
    const upload = await Upload.findByPk(uploadId);
    if (!upload) {
      console.error('Upload não encontrado:', uploadId);
      return;
    }

    // Atualizar status para processando
    upload.status = 'processing';
    await upload.save();

    const startTime = Date.now();
    
    // Processar arquivo localmente usando OCR
    let analysisResults = [];
    
    if (upload.fileType === 'image') {
      // Processar imagem com OCR para reconhecimento de placas
      try {
        const ocrResult = await ocrService.recognizeLicensePlate(upload.filePath);
        logger.debug('OCR Result:', ocrResult);
        
        if (ocrResult.success && ocrResult.plate) {
          analysisResults.push({
            type: 'license_plate',
            confidence: ocrResult.confidence / 100,
            data: {
              plate_number: ocrResult.plate,
              raw_text: ocrResult.rawText,
              confidence: ocrResult.confidence
            },
            processingTime: Date.now() - startTime,
            metadata: {
              timestamp: ocrResult.timestamp,
              source: 'tesseract_ocr'
            }
          });
          
          logger.info(`Placa reconhecida: ${ocrResult.plate} (confiança: ${ocrResult.confidence})`);
        } else {
          logger.warn('Nenhuma placa detectada na imagem');
          try {
            const aiResult = await aiProcessorService.recognizeLicensePlates(upload.filePath);
            const detections = (aiResult && aiResult.all_detections) ? aiResult.all_detections : [];
            if (detections.length > 0) {
              const best = detections[0];
              analysisResults.push({
                type: 'license_plate',
                confidence: best.confidence,
                data: {
                  plate_number: best.plate_number,
                  raw_text: ocrResult.rawText,
                  confidence: Math.round((best.confidence || 0) * 100),
                  vehicle_color: best.vehicle_color || null,
                  vehicle_color_confidence: (best.vehicle_color_confidence ?? null)
                },
                processingTime: Date.now() - startTime,
                metadata: {
                  timestamp: new Date().toISOString(),
                  source: 'ai_processor',
                  bbox: best.bbox
                }
              });
            } else {
              analysisResults.push({
                type: 'license_plate',
                confidence: 0,
                data: {
                  plate_number: null,
                  raw_text: ocrResult.rawText,
                  confidence: ocrResult.confidence,
                  vehicle_color: aiResult.overall_vehicle_color || null,
                  vehicle_color_confidence: (aiResult.overall_vehicle_color_confidence ?? null)
                },
                processingTime: Date.now() - startTime,
                metadata: {
                  timestamp: new Date().toISOString(),
                  source: 'ai_processor',
                  status: 'ai_processor_no_plate_detected'
                }
              });
            }
          } catch (e) {
            analysisResults.push({
              type: 'license_plate',
              confidence: 0,
              data: {
                plate_number: null,
                raw_text: ocrResult.rawText,
                confidence: ocrResult.confidence
              },
              processingTime: Date.now() - startTime,
              metadata: {
                timestamp: new Date().toISOString(),
                source: 'ai_processor',
                status: 'ai_processor_error'
              }
            });
          }
        }
      } catch (ocrError) {
        logger.error('Erro no processamento OCR:', ocrError);
        
        // Adicionar resultado de erro no OCR
        analysisResults.push({
          type: 'license_plate',
          confidence: 0 / 100,
          data: {
            plate_number: null,
            error: ocrError.message
          },
          processingTime: Date.now() - startTime,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'tesseract_ocr',
            status: 'ocr_error'
          }
        });
      }
    } else if (upload.fileType === 'video') {
      // Para vídeos, adicionar placeholder (implementação futura)
      analysisResults.push({
        type: 'video_analysis',
        confidence: 0,
        data: {
          status: 'pending_implementation',
          message: 'Análise de vídeo será implementada em versões futuras'
        },
        processingTime: Date.now() - startTime,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'system'
        }
      });
      
      logger.info('Upload de vídeo detectado - análise de vídeo pendente de implementação');
    }

    const processingTime = Date.now() - startTime;
    
    upload.status = 'completed';
    upload.analysisResults = analysisResults;
    upload.processingTime = processingTime;
    await upload.save();

    // Criar registros de análise individuais
    await Promise.all(
      analysisResults.map(async (result) => {
        await Analysis.create({
          uploadId: upload.id,
          analysisType: result.type,
          confidence: result.confidence,
          results: result.data,
          processingTime: result.processingTime,
          status: 'completed',
          metadata: result.metadata || {}
        });
      })
    );

    console.log(`Análise concluída para upload ${uploadId} em ${processingTime}ms`);

  } catch (error) {
    console.error('Erro no processamento AI:', error);
    
    // Atualizar status para falha
    const upload = await Upload.findByPk(uploadId);
    if (upload) {
      upload.status = 'failed';
      upload.errorMessage = error.message;
      await upload.save();
    }
  }
};

// Processar análise em lote
const processBatchAnalysis = async (uploadIds) => {
  try {
    const results = await Promise.allSettled(
      uploadIds.map(id => processFileAnalysis(id))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Processamento em lote concluído: ${successful} sucessos, ${failed} falhas`);
    
    return { successful, failed };
  } catch (error) {
    console.error('Erro no processamento em lote:', error);
    throw error;
  }
};

module.exports = {
  processFileAnalysis,
  processBatchAnalysis
};
