const axios = require('axios');

async function testConnection() {
  console.log('🔍 Testando conexão com o backend...');
  
  try {
    // Testar health check
    const healthResponse = await axios.get('http://localhost:5000/health', {
      timeout: 5000
    });
    
    console.log('✅ Health check:', healthResponse.data);
    
    // Testar rota raiz
    const rootResponse = await axios.get('http://localhost:5000/', {
      timeout: 5000
    });
    
    console.log('✅ Rota raiz:', rootResponse.data);
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 O servidor pode não estar rodando');
    } else if (error.response) {
      console.log('📋 Status:', error.response.status);
      console.log('📋 Dados:', error.response.data);
    }
  }
}

// Executar teste
testConnection().then(() => {
  console.log('\n🏁 Teste de conexão concluído!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});