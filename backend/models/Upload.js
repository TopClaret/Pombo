const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Upload = sequelize.define('Upload', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'deleted'),
    defaultValue: 'pending'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  analysisResults: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  processingTime: {
    type: DataTypes.INTEGER
  },
  errorMessage: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'uploads',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['fileType']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Upload;
