const multer = require('multer');
const path = require('path');

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['jpeg', 'jpg', 'png', 'gif'];
  const allowedVideoTypes = process.env.ALLOWED_VIDEO_TYPES?.split(',') || ['mp4', 'avi', 'mov'];
  
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (file.mimetype.startsWith('image/') && allowedImageTypes.includes(ext)) {
    cb(null, true);
  } else if (file.mimetype.startsWith('video/') && allowedVideoTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido. Permitidos: ${[...allowedImageTypes, ...allowedVideoTypes].join(', ')}`), false);
  }
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
    files: 10 // máximo de 10 arquivos por upload
  }
});

// Middleware de validação
const validateUpload = (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'Arquivo muito grande. Tamanho máximo permitido: 100MB' 
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          error: 'Número máximo de arquivos excedido. Máximo: 10 arquivos' 
        });
      }
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    next();
  });
};

module.exports = { validateUpload, upload };