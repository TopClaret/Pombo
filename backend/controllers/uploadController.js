const { Upload } = require('../models');
const { processFileAnalysis } = require('../utils/aiProcessor');

// Upload de arquivos
const uploadFiles = async (req, res) => {
  try {
    const files = req.files;
    const userId = req.user.id;

    const uploads = await Promise.all(
      files.map(async (file) => {
        const upload = await Upload.create({
          userId,
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          fileType: file.mimetype.startsWith('image/') ? 'image' : 'video',
          mimeType: file.mimetype,
          status: 'pending',
          metadata: {
            originalName: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype
          }
        });

        // Processar análise em background
        processFileAnalysis(upload.id);

        return upload;
      })
    );

    res.status(201).json({
      success: true,
      message: 'Arquivos enviados com sucesso',
      data: { uploads }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar uploads do usuário
const getUserUploads = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, fileType } = req.query;
    
    const where = { userId };
    if (status) where.status = status;
    if (fileType) where.fileType = fileType;

    const offset = (page - 1) * limit;
    
    const { count, rows: uploads } = await Upload.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        uploads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar uploads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter detalhes de um upload específico
const getUploadDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const upload = await Upload.findOne({
      where: { id, userId },
      include: [
        {
          association: 'analyses',
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload não encontrado' });
    }

    res.json({
      success: true,
      data: { upload }
    });
  } catch (error) {
    console.error('Erro ao obter detalhes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir upload
const deleteUpload = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const upload = await Upload.findOne({ where: { id, userId } });
    
    if (!upload) {
      return res.status(404).json({ error: 'Upload não encontrado' });
    }

    // Marcar como deletado (soft delete)
    upload.status = 'deleted';
    await upload.save();

    // TODO: Implementar exclusão física do arquivo do storage

    res.json({
      success: true,
      message: 'Upload excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  uploadFiles,
  getUserUploads,
  getUploadDetails,
  deleteUpload
};