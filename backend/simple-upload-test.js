const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  console.log('🚀 Testando upload de arquivo...');
  
  try {
    // Primeiro, vamos testar se o servidor está respondendo
    console.log('🌐 Testando conexão com o servidor...');
    
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Servidor respondendo:', healthResponse.data);
    
    // Testar rota de upload sem autenticação primeiro
    console.log('📤 Testando upload sem autenticação...');
    
    const formData = new FormData();
    
    // Criar um arquivo de teste simples
    const testContent = 'Test file content for upload';
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, testContent);
    
    formData.append('files', fs.createReadStream(testFilePath));
    
    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 10000
      });
      
      console.log('✅ Upload bem-sucedido:', response.data);
      
    } catch (uploadError) {
      console.log('📋 Resposta do servidor (esperado para não autenticado):');
      
      if (uploadError.response) {
        console.log('📊 Status:', uploadError.response.status);
        console.log('📝 Mensagem:', uploadError.response.data);
        console.log('🔍 Headers:', uploadError.response.headers);
      } else {
        console.log('💥 Erro de conexão:', uploadError.message);
      }
    }
    
    // Limpar arquivo de teste
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    
    if (error.response) {
      console.log('📋 Detalhes da resposta:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
  
  console.log('🏁 Teste de upload concluído!');
}

// Executar o teste
testUpload().catch(console.error);