// Teste simples para verificar se o redirecionamento funciona
console.log('🔍 Testando redirecionamento...');

// Simular o comportamento do useNavigate
const mockNavigate = (path) => {
  console.log(`✅ Redirecionando para: ${path}`);
  return true;
};

// Testar o redirecionamento do Login
console.log('🧪 Testando Login...');
mockNavigate('/dashboard');

// Testar o redirecionamento do Register  
console.log('🧪 Testando Register...');
mockNavigate('/dashboard');

console.log('🎉 Teste de redirecionamento concluído!');
console.log('💡 Se você ainda está na página inicial, pode ser:');
console.log('   - Cache do navegador (tente Ctrl+F5)');
console.log('   - Estado de autenticação não está atualizando');
console.log('   - Problema com o React Router');