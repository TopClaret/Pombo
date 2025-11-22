# Configuração do Supabase

## 📋 Pré-requisitos

1. **Conta no Supabase**: [https://supabase.com](https://supabase.com)
2. **Projeto criado** no Supabase
3. **URL e Chaves de API** do seu projeto

## 🚀 Configuração Rápida

### 1. Criar Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Clique em "New Project"
3. Preencha:
   - **Name**: `pombo-app` (ou seu nome preferido)
   - **Database Password**: Uma senha segura
   - **Region**: Escolha a região mais próxima (ex: `South America (São Paulo)`)

### 2. Obter Credenciais

Após criar o projeto, vá em **Settings > API** e copie:

- **URL**: `https://seu-project-ref.supabase.co`
- **anon key**: `sua-chave-anon-aqui`
- **service_role key**: `sua-chave-service-role-aqui`

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `backend/.env` e substitua:

```env
# Supabase Database
SUPABASE_URL=https://seu-project-ref.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

### 4. Criar Tabelas no Supabase

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de uploads
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT DEFAULT 'pending',
    analysis_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_created_at ON uploads(created_at DESC);

-- Habilitar RLS (Row Level Security) se necessário
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
```

### 5. Reiniciar Serviços

```bash
# Parar serviços se estiverem rodando
cd backend
npm run stop

# Reiniciar backend
npm start

# Reiniciar frontend (em outro terminal)
cd frontend
npm start
```

## 🔍 Verificação

Após configurar, verifique se o Supabase está funcionando:

1. O backend mostrará no log: `Cliente Supabase inicializado com sucesso`
2. Ao registrar um usuário, aparecerá: `Usuário sincronizado com Supabase: email@exemplo.com`
3. Os dados aparecerão na interface do Supabase

## 🌐 Deploy Online

Para deploy online, configure também:

1. **Variáveis de ambiente** no seu provedor de hosting (Vercel, Netlify, Railway, etc.)
2. **CORS** nas configurações do Supabase
3. **Domínios permitidos** nas configurações de autenticação do Supabase

## 🛠️ Troubleshooting

### Erro de Conexão
- Verifique se as credenciais estão corretas
- Verifique se a região do projeto está acessível

### Erro de Tabela Não Encontrada
- Execute o SQL acima para criar as tabelas

### Erro de Permissão
- Use a `SERVICE_ROLE_KEY` para operações administrativas
- Use a `ANON_KEY` para operações do cliente

## 📊 Migração de Dados

Para migrar dados do SQLite para Supabase:

1. Exporte dados do SQLite
2. Use a interface do Supabase para importar
3. Ou escreva scripts de migração

---

**Nota**: O sistema funciona em modo híbrido - usa SQLite local se Supabase não estiver configurado, e Supabase quando disponível.