const User = require('./User');
const Upload = require('./Upload');
const Analysis = require('./Analysis');

// Associações entre modelos
User.hasMany(Upload, {
  foreignKey: 'userId',
  as: 'uploads',
  onDelete: 'CASCADE'
});

Upload.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Upload.hasMany(Analysis, {
  foreignKey: 'uploadId',
  as: 'analyses',
  onDelete: 'CASCADE'
});

Analysis.belongsTo(Upload, {
  foreignKey: 'uploadId',
  as: 'upload'
});

// Sincronizar modelos com o banco de dados
const syncModels = async (force = false) => {
  try {
    await User.sync({ force });
    await Upload.sync({ force });
    await Analysis.sync({ force });
    
    console.log('Modelos sincronizados com o banco de dados');
  } catch (error) {
    console.error('Erro ao sincronizar modelos:', error);
    throw error;
  }
};

module.exports = {
  User,
  Upload,
  Analysis,
  syncModels
};