const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class OCRService {
    constructor() {
        this.worker = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            logger.info('Inicializando worker Tesseract OCR...');
            
            this.worker = await Tesseract.createWorker('por');
            await this.worker.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
                tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
                user_defined_dpi: '300'
            });

            this.isInitialized = true;
            logger.info('Worker Tesseract OCR inicializado com sucesso');
            
        } catch (error) {
            logger.error('Erro ao inicializar Tesseract OCR:', error);
            throw new Error('Falha ao inicializar serviço de OCR');
        }
    }

    async recognizeLicensePlate(imagePath, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            logger.info(`Processando imagem para reconhecimento de placa: ${imagePath}`);
            
            const primary = await this.worker.recognize(imagePath);
            let text = primary.data.text;
            let confidence = primary.data.confidence;
            let processedPlate = this.processPlateText(text);

            if (!processedPlate) {
                await this.worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT });
                const sparse = await this.worker.recognize(imagePath);
                const sparsePlate = this.processPlateText(sparse.data.text);
                if (sparsePlate) {
                    text = sparse.data.text;
                    confidence = sparse.data.confidence;
                    processedPlate = sparsePlate;
                }
            }

            if (!processedPlate) {
                await this.worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_WORD });
                const word = await this.worker.recognize(imagePath);
                const wordPlate = this.processPlateText(word.data.text);
                if (wordPlate) {
                    text = word.data.text;
                    confidence = word.data.confidence;
                    processedPlate = wordPlate;
                }
            }

            await this.worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.AUTO });

            logger.info(`Placa reconhecida: ${processedPlate} (Confiança: ${confidence}%)`);
            
            return {
                success: !!processedPlate,
                plate: processedPlate,
                rawText: text,
                confidence: confidence,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error('Erro no reconhecimento de placa:', error);
            return {
                success: false,
                error: error.message,
                plate: null,
                confidence: 0
            };
        }
    }

    processPlateText(text) {
        if (!text) return null;
        
        let processed = text.trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .replace(/\s+/g, '');

        const fixAmbiguity = (s) => {
            const arr = s.split('');
            if (arr.length >= 7) {
                if (/[A-Z]/.test(arr[3])) arr[3] = arr[3].replace('O','0').replace('I','1').replace('Q','0');
                if (/[0-9]/.test(arr[4])) arr[4] = arr[4].replace('5','S').replace('8','B').replace('2','Z');
            }
            return arr.join('');
        };

        processed = fixAmbiguity(processed);
        
        // Formatar no padrão brasileiro: AAA0A00 ou AAA0000
        if (processed.length >= 7) {
            const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
            const oldPattern = /^[A-Z]{3}[0-9]{4}$/;
            if (mercosulPattern.test(processed) || oldPattern.test(processed)) {
                return processed;
            }
        }
        return null;
    }

    async recognizeText(imagePath, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const { data: { text, confidence } } = await this.worker.recognize(imagePath);
            
            return {
                success: true,
                text: text.trim(),
                confidence: confidence,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error('Erro no reconhecimento de texto:', error);
            return {
                success: false,
                error: error.message,
                text: null,
                confidence: 0
            };
        }
    }

    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.isInitialized = false;
            logger.info('Worker Tesseract OCR finalizado');
        }
    }
}

module.exports = new OCRService();
