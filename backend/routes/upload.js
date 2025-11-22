const express = require('express');
const { uploadFiles, getUserUploads, getUploadDetails, deleteUpload } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const { validateUpload } = require('../middleware/uploadValidation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Upload de arquivos
router.post('/', validateUpload, uploadFiles);

// Listar uploads do usuário
router.get('/', getUserUploads);

// Detalhes de um upload específico
router.get('/:id', getUploadDetails);

// Excluir upload
router.delete('/:id', deleteUpload);

module.exports = router;