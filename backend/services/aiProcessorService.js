const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class AIProcessorService {
    constructor() {
        this.baseURL = process.env.AI_PROCESSOR_URL || 'http://localhost:8000';
        this.timeout = parseInt(process.env.AI_PROCESSOR_TIMEOUT) || 30000;
    }

    async processFile(filePath, analysisType = 'plate_recognition') {
        try {
            const formData = new FormData();
            
            // Ler o arquivo e adicionar ao form data
            const fileStream = fs.createReadStream(filePath);
            formData.append('file', fileStream);
            formData.append('analysis_type', analysisType);
            formData.append('file_name', path.basename(filePath));

            logger.info(`Enviando arquivo para processamento AI: ${filePath}`);

            const response = await axios.post(
                `${this.baseURL}/process/file`,
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: this.timeout,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            logger.info(`Processamento AI concluído para: ${filePath}`);
            return response.data;

        } catch (error) {
            logger.error(`Erro no processamento AI: ${error.message}`, error);
            
            if (error.response) {
                logger.error(`Resposta do servidor AI: ${JSON.stringify(error.response.data)}`);
                throw new Error(`Servidor AI retornou erro: ${error.response.status} - ${error.response.statusText}`);
            } else if (error.request) {
                throw new Error('Servidor AI não respondeu. Verifique se o processador está rodando.');
            } else {
                throw new Error(`Erro ao configurar requisição: ${error.message}`);
            }
        }
    }

    async processPath(filePath, analysisType = 'plate_recognition') {
        try {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
            const response = await axios.post(
                `${this.baseURL}/process/path`,
                null,
                { params: { file_path: absolutePath, analysis_type: analysisType }, timeout: this.timeout }
            );
            return response.data;
        } catch (error) {
            logger.error(`Erro no processamento AI (path): ${error.message}`, error);
            if (error.response) {
                logger.error(`Resposta do servidor AI: ${JSON.stringify(error.response.data)}`);
                throw new Error(`Servidor AI retornou erro: ${error.response.status} - ${error.response.statusText}`);
            } else if (error.request) {
                throw new Error('Servidor AI não respondeu. Verifique se o processador está rodando.');
            } else {
                throw new Error(`Erro ao configurar requisição: ${error.message}`);
            }
        }
    }

    async getStatus() {
        try {
            const response = await axios.get(`${this.baseURL}/health`, {
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            logger.error(`Erro ao verificar status do AI Processor: ${error.message}`);
            return { status: 'offline', error: error.message };
        }
    }

    async batchProcess(files, analysisType = 'plate_recognition') {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.processFile(file, analysisType);
                results.push({
                    file,
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    file,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    // Método específico para reconhecimento de placas
    async recognizeLicensePlates(filePath) {
        const res = await this.processPath(filePath, 'plate_recognition');
        return res && res.results ? res.results : res;
    }

    // Método para detecção de pessoas
    async detectPeople(filePath) {
        return this.processFile(filePath, 'person_detection');
    }

    // Método para OCR
    async extractText(filePath) {
        return this.processFile(filePath, 'text_recognition');
    }
}

module.exports = new AIProcessorService();