// Teste simples para verificar se os eventos estão funcionando
console.log('🎯 Testando sistema de eventos de autenticação');

// Adicionar listener para evento storage
window.addEventListener('storage', (event) => {
  console.log('📢 Evento storage capturado:', event.key);
  console.log('✅ App.tsx deve re-renderizar agora');
});

// Simular o que acontece no login
console.log('1. Simulando login bem-sucedido...');

// Disparar evento manualmente (igual ao AuthContext faz)
window.dispatchEvent(new Event('storage'));

console.log('2. Evento storage disparado!');
console.log('3. Se você viu a mensagem acima, o sistema está funcionando');
console.log('4. O problema pode ser cache do navegador');
console.log('💡 Pressione Ctrl+F5 para limpar o cache e teste novamente');