// Teste rápido para verificar se a nova SERVICE_ROLE_KEY é válida

const SUPABASE_URL = 'https://kquggpxhvwbgtrrutgmb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdncHhodndiZ3RycnV0Z21iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc0MDg2NCwiZXhwIjoyMDc5MzE2ODY0fQ.fZjnnKH3wIatN1JZckR0pu1uYvkXVFA7Qu51gWBb0zk';

async function testKey() {
  console.log('🔍 Testando nova SERVICE_ROLE_KEY...');
  console.log('📋 Key:', SERVICE_ROLE_KEY.substring(0, 20) + '...');
  
  try {
    // Testar conexão simples com a API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📋 Status Text:', response.statusText);
    
    if (response.status === 200) {
      console.log('✅ CHAVE VÁLIDA! Conexão bem-sucedida!');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na resposta:', errorText.substring(0, 100));
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
}

// Executar teste
testKey().then(isValid => {
  if (isValid) {
    console.log('🎯 Esta SERVICE_ROLE_KEY parece válida!');
    console.log('🚀 Vamos atualizar o .env e testar a criação das tabelas!');
  } else {
    console.log('💡 A chave pode não ser uma SERVICE_ROLE_KEY válida');
    console.log('📋 Verifique no Supabase Dashboard → Settings → API');
    console.log('🔍 Procure por "service_role" (não "anon")');
  }
});