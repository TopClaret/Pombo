const ocrService = require('./services/ocrService');
const path = require('path');

async function testOCR() {
  console.log('🚀 Iniciando teste do serviço OCR...');
  
  try {
    // Testar inicialização
    console.log('📦 Inicializando serviço OCR...');
    await ocrService.initialize();
    console.log('✅ Serviço OCR inicializado com sucesso!');
    
    // Testar com uma imagem existente
    const testImagePath = path.join(__dirname, 'uploads', 'files-1763748975849-91525888.png');
    console.log(`🔍 Testando reconhecimento na imagem: ${testImagePath}`);
    
    const result = await ocrService.recognizeLicensePlate(testImagePath);
    
    console.log('📊 Resultado do OCR:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.plate) {
      console.log(`🎉 Placa reconhecida: ${result.plate}`);
      console.log(`📈 Confiança: ${result.confidence}%`);
    } else if (result.success) {
      console.log('ℹ️  Nenhuma placa detectada na imagem');
      console.log(`📝 Texto bruto: "${result.rawText}"`);
    } else {
      console.log('❌ Falha no reconhecimento');
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste OCR:', error.message);
    console.error(error.stack);
  }
}

// Executar teste
testOCR().then(() => {
  console.log('\n🏁 Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});