const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  console.log('🚀 Testando upload de arquivo...');
  
  try {
    // Verificar se temos um token válido
    const token = process.env.TEST_TOKEN || localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ Token não encontrado. Faça login primeiro.');
      return;
    }
    
    console.log('✅ Token encontrado');
    
    // Criar um arquivo de teste simples
    const testFilePath = path.join(__dirname, 'test-image.jpg');
    
    // Se não existir um arquivo de teste, criar um
    if (!fs.existsSync(testFilePath)) {
      console.log('📝 Criando arquivo de teste...');
      // Criar um arquivo JPEG simples
      const buffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
      ]);
      fs.writeFileSync(testFilePath, buffer);
    }
    
    // Preparar o formulário para upload
    const formData = new FormData();
    const fileStream = fs.createReadStream(testFilePath);
    
    formData.append('files', fileStream);
    
    console.log('📤 Enviando arquivo para o servidor...');
    
    // Fazer a requisição
    const response = await axios.post('http://localhost:5000/api/upload', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        ...formData.getHeaders()
      },
      timeout: 30000
    });
    
    console.log('✅ Upload realizado com sucesso!');
    console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('💥 Erro durante o upload:', error.message);
    
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Dados:', error.response.data);
    }
    
    console.error('🔍 Stack:', error.stack);
  }
}

// Executar teste
testUpload().then(() => {
  console.log('\n🏁 Teste de upload concluído!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});