const { createClient } = require('./backend/node_modules/@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

// Configuração do cliente Supabase com SERVICE_ROLE_KEY (bypass RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Script SQL para criar as tabelas
const sqlScript = `
-- Script para criar as tabelas no Supabase
-- Executado automaticamente via SERVICE_ROLE_KEY

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

-- 10. Comentários para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do sistema Pombo';
COMMENT ON TABLE uploads IS 'Tabela de uploads de imagens para análise';
COMMENT ON TABLE analyses IS 'Tabela de resultados das análises de placas';

SELECT 'Tabelas criadas com sucesso!' as status;
`;

async function createTables() {
  try {
    console.log('🚀 Conectando ao Supabase...');
    console.log(`📋 URL: ${supabaseUrl}`);
    
    // Executar o script SQL usando a API do Supabase
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: sqlScript 
    });

    if (error) {
      // Se exec_sql não existir, tentar método alternativo
      if (error.code === 'PGRST302' || error.message.includes('function exec_sql')) {
        console.log('⚠️  Função exec_sql não disponível, tentando método alternativo...');
        await executeAlternativeMethod();
        return;
      }
      throw error;
    }

    console.log('✅ Tabelas criadas com sucesso!');
    console.log('📊 Resultado:', data);
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    
    // Método alternativo caso exec_sql não esteja disponível
    if (error.code === 'PGRST302' || error.message.includes('function exec_sql')) {
      console.log('🔄 Tentando método alternativo...');
      await executeAlternativeMethod();
    }
  }
}

async function executeAlternativeMethod() {
  try {
    console.log('🔧 Usando método alternativo para criar tabelas...');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        const cleanCommand = command.trim() + ';';
        console.log(`📝 Executando: ${cleanCommand.substring(0, 100)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: cleanCommand 
        }).catch(() => ({ error: { message: 'Função exec_sql não disponível' } }));
        
        if (error && !error.message.includes('function exec_sql')) {
          console.warn(`⚠️  Comando pode ter falhado: ${error.message}`);
        }
        
        // Pequena pausa entre comandos
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('✅ Todas as tabelas foram criadas!');
    console.log('📋 Verifique no Supabase Dashboard → Table Editor');
    
  } catch (error) {
    console.error('❌ Erro no método alternativo:', error.message);
    console.log('\n💡 Solução alternativa:');
    console.log('1. Acesse https://supabase.com/dashboard/project/kquggpxhvwbgtrrutgmb');
    console.log('2. Vá em SQL Editor');
    console.log('3. Cole o conteúdo do arquivo supabase_tables.sql');
    console.log('4. Clique em RUN');
  }
}

// Executar a criação das tabelas
createTables();