CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_analyses_upload_id ON analyses(upload_id);
CREATE INDEX IF NOT EXISTS idx_analyses_plate_number ON analyses(plate_number);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "UsuÃ¡rios podem ver apenas seus prÃ³prios dados" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "UsuÃ¡rios podem atualizar apenas seus prÃ³prios dados" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "UsuÃ¡rios podem ver apenas seus prÃ³prios uploads" ON uploads FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "UsuÃ¡rios podem inserir apenas seus prÃ³prios uploads" ON uploads FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "UsuÃ¡rios podem atualizar apenas seus prÃ³prios uploads" ON uploads FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "UsuÃ¡rios podem deletar apenas seus prÃ³prios uploads" ON uploads FOR DELETE USING (auth.uid()::text = user_id::text);
CREATE POLICY "UsuÃ¡rios podem ver anÃ¡lises de seus uploads" ON analyses FOR SELECT USING (EXISTS (SELECT 1 FROM uploads WHERE uploads.id = analyses.upload_id AND uploads.user_id::text = auth.uid()::text));

SELECT 'Tabelas criadas com sucesso!' as status;
