// Script para criar tabelas usando a API REST do Supabase corretamente
// Usa o endpoint /rest/v1/ com método POST e Content-Type: application/json

const SUPABASE_URL = 'https://kquggpxhvwbgtrrutgmb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWdncHhodndiZ3RycnV0Z21iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc0MDg2NCwiZXhwIjoyMDc5MzE2ODY0fQ.fZjnnKH3wIatN1JZckR0pu1uYvkXVFA7Qu51gWBb0zk';

// Script SQL completo - vamos executar como uma única query
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
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    upload_progress INTEGER DEFAULT 0,
    error_message TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- 4. Tabela de análises
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    plate_number VARCHAR(20),
    confidence DECIMAL(5,2),
    processing_time DECIMAL(10,3),
    analysis_result JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
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
    FOR SELECT USING (auth.uid() = id::text::uuid);

CREATE POLICY "Usuários podem atualizar apenas seus próprios dados" ON users
    FOR UPDATE USING (auth.uid() = id::text::uuid);

-- 8. Políticas para a tabela uploads
CREATE POLICY "Usuários podem ver apenas seus próprios uploads" ON uploads
    FOR SELECT USING (auth.uid() = user_id::text::uuid);

CREATE POLICY "Usuários podem inserir apenas seus próprios uploads" ON uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id::text::uuid);

CREATE POLICY "Usuários podem atualizar apenas seus próprios uploads" ON uploads
    FOR UPDATE USING (auth.uid() = user_id::text::uuid);

CREATE POLICY "Usuários podem deletar apenas seus próprios uploads" ON uploads
    FOR DELETE USING (auth.uid() = user_id::text::uuid);

-- 9. Políticas para a tabela analyses
CREATE POLICY "Usuários podem ver análises de seus próprios uploads" ON analyses
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM uploads 
        WHERE uploads.id = analyses.upload_id 
        AND auth.uid() = uploads.user_id::text::uuid
    ));

SELECT 'Tabelas criadas com sucesso!' as status;
`;

async function executeSQL() {
  console.log('🚀 Executando script SQL no Supabase...');
  
  try {
    // Para executar SQL via REST API, precisamos usar um endpoint diferente
    // Vamos tentar executar o SQL completo de uma vez
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sqlScript
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📋 Status Text:', response.statusText);
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Sucesso! Resultado:', result);
    } else {
      const error = await response.text();
      console.log('❌ Erro:', error);
    }
    
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

// Executar o script
executeSQL();