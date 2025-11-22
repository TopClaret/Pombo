const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Analysis = sequelize.define('Analysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  uploadId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'uploads',
      key: 'id'
    }
  },
  analysisType: {
    type: DataTypes.ENUM('plate_recognition', 'person_detection', 'object_detection', 'text_recognition', 'facial_recognition'),
    allowNull: false
  },
  confidence: {
    type: DataTypes.FLOAT,
    validate: {
      min: 0,
      max: 1
    }
  },
  results: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  processingTime: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  errorMessage: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'analyses',
  indexes: [
    {
      fields: ['uploadId']
    },
    {
      fields: ['analysisType']
    },
    {
      fields: ['status']
    },
    {
      fields: ['confidence']
    }
  ]
});

module.exports = Analysis;
