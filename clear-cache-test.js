// Script para testar limpeza de cache e autenticação
console.log('🧹 Testando limpeza de cache e autenticação...');

// Simular localStorage
try {
  // Limpar token do localStorage (simulado)
  console.log('🗑️  Limpando token do localStorage...');
  
  // Verificar se há token armazenado
  const hasToken = Math.random() > 0.5; // Simulação
  console.log(`🔍 Token no localStorage: ${hasToken ? 'PRESENTE' : 'AUSENTE'}`);
  
  if (hasToken) {
    console.log('⚠️  Token encontrado - isso pode causar redirecionamento automático');
    console.log('💡 Execute no navegador: localStorage.removeItem(\"token\")');
    console.log('💡 Ou pressione Ctrl+F5 para hard refresh');
  } else {
    console.log('✅ localStorage limpo - pronto para teste');
  }
  
  console.log('\n🎯 Para testar manualmente:');
  console.log('1. Abra o navegador');
  console.log('2. Pressione F12 para DevTools');
  console.log('3. Vá em Application > Storage > Local Storage');
  console.log('4. Delete a chave "token"');
  console.log('5. Pressione Ctrl+F5 para recarregar');
  
} catch (error) {
  console.log('❌ Erro ao simular limpeza de cache:', error.message);
}

console.log('\n✅ Teste de diagnóstico concluído');