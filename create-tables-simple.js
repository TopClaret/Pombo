// Script simples para criar tabelas no Supabase usando fetch API
// Não requer instalação de pacotes extras

const SUPABASE_URL = 'https://kquggpxhvwbgtrrutgmb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdncHhodndiZ3RycnV0Z21iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc0MDg2NCwiZXhwIjoyMDc5MzE2ODY0fQ.fZjnnKH3wIatN1JZckR0pu1uYvkXVFA7Qu51gWBb0zk';

// Script SQL completo
const sqlScript = `
-- Script para criar as tabelas no Supabase

-- 1. Habilitar extensão pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de usuários (users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de uploads
CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) UNIQUE NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'deleted')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de análises
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    plate_number VARCHAR(20),
    confidence FLOAT,
    processing_time INTEGER,
    result_data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_analyses_upload_id ON analyses(upload_id);
CREATE INDEX IF NOT EXISTS idx_analyses_plate_number ON analyses(plate_number);

-- 6. Políticas de Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- 7. Políticas para a tabela users
CREATE POLICY "Usuários podem ver apenas seus próprios dados" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Usuários podem atualizar apenas seus próprios dados" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- 8. Políticas para a tabela uploads
CREATE POLICY "Usuários podem ver apenas seus próprios uploads" ON uploads
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem inserir apenas seus próprios uploads" ON uploads
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem atualizar apenas seus próprios uploads" ON uploads
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Usuários podem deletar apenas seus próprios uploads" ON uploads
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- 9. Políticas para a tabela analyses
CREATE POLICY "Usuários podem ver análises de seus uploads" ON analyses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM uploads 
            WHERE uploads.id = analyses.upload_id 
            AND uploads.user_id::text = auth.uid()::text
        )
    );

SELECT 'Tabelas criadas com sucesso!' as status;
`;

async function createTables() {
  console.log('🚀 Iniciando criação automática das tabelas...');
  console.log('📋 Usando SERVICE_ROLE_KEY para bypass RLS');
  
  try {
    // Dividir o script em comandos menores (Supabase tem limite de tamanho)
    const commands = sqlScript.split(';').filter(cmd => cmd.trim().length > 0);
    
    let successCount = 0;
    let totalCount = commands.length;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (!command) continue;
      
      const sql = command + ';';
      
      console.log(`📝 [${i+1}/${totalCount}] Executando: ${sql.substring(0, 80)}...`);
      
      try {
        // Usar a API REST do Supabase para executar SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY
          },
          body: JSON.stringify({
            query: sql
          })
        });
        
        if (response.ok) {
          successCount++;
          console.log(`✅ Comando executado com sucesso`);
        } else {
          const errorText = await response.text();
          console.log(`⚠️  Comando pode ter falhado: ${response.status} ${errorText.substring(0, 100)}`);
        }
        
      } catch (error) {
        console.log(`❌ Erro no comando: ${error.message}`);
      }
      
      // Pequena pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n🎉 Conclusão: ${successCount}/${totalCount} comandos executados com sucesso!`);
    console.log('📋 Acesse o Supabase Table Editor para verificar as tabelas:');
    console.log('👉 https://supabase.com/dashboard/project/kquggpxhvwbgtrrutgmb');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n💡 Solução alternativa manual:');
    console.log('1. Acesse https://supabase.com/dashboard/project/kquggpxhvwbgtrrutgmb');
    console.log('2. Vá em SQL Editor');
    console.log('3. Cole o conteúdo do arquivo supabase_tables.sql');
    console.log('4. Clique em RUN');
  }
}

// Executar a criação das tabelas
createTables();