// Sistema de migração automática para Supabase usando API REST
// Não requer conexão direta com PostgreSQL

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class SupabaseMigration {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.tables = ['users', 'uploads', 'analyses'];
  }

  // Verificar se uma tabela existe
  async tableExists(tableName) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/${tableName}?limit=1`, 
        {
          headers: {
            'Authorization': `Bearer ${this.serviceRoleKey}`,
            'apikey': this.serviceRoleKey
          }
        }
      );
      
      // Se retornar 200, a tabela existe
      // Se retornar 404, a tabela não existe
      return response.status === 200;
    } catch (error) {
      console.log(`❌ Erro ao verificar tabela ${tableName}:`, error.message);
      return false;
    }
  }

  // Criar tabela individual via API REST
  async createTable(tableName) {
    const tableScripts = {
      users: `
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
        )
      `,
      
      uploads: `
        CREATE TABLE IF NOT EXISTS uploads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_name VARCHAR(255) UNIQUE NOT NULL,
          file_path TEXT NOT NULL,
          file_size BIGINT NOT NULL,
          file_type VARCHAR(100) NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'deleted')),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `,
      
      analyses: `
        CREATE TABLE IF NOT EXISTS analyses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          upload_id UUID NOT NULL,
          plate_number VARCHAR(20),
          confidence FLOAT,
          processing_time INTEGER,
          result_data JSONB DEFAULT '{}',
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
        )
      `
    };

    console.log(`🔄 Criando tabela ${tableName}...`);
    
    try {
      // Para criar tabelas, precisamos usar o SQL Editor do Supabase manualmente
      // Esta função serve apenas para verificar existência
      console.log(`📋 Tabela ${tableName} precisa ser criada manualmente no SQL Editor`);
      return false;
    } catch (error) {
      console.log(`❌ Erro ao criar tabela ${tableName}:`, error.message);
      return false;
    }
  }

  // Verificar e criar tabelas necessárias
  async migrate() {
    console.log('🚀 Iniciando verificação de tabelas no Supabase...');
    
    for (const table of this.tables) {
      const exists = await this.tableExists(table);
      
      if (exists) {
        console.log(`✅ Tabela ${table} já existe`);
      } else {
        console.log(`📋 Tabela ${table} não encontrada`);
        console.log(`💡 Execute manualmente no SQL Editor do Supabase:`);
        
        // Mostrar instruções para criação manual
        if (table === 'users') {
          console.log(`
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
          `);
        }
      }
    }
    
    console.log('🎉 Verificação de tabelas concluída!');
    return true;
  }

  // Verificar conexão com Supabase
  async testConnection() {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
        headers: {
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'apikey': this.serviceRoleKey
        }
      });
      
      return response.status === 200;
    } catch (error) {
      console.log('❌ Erro de conexão com Supabase:', error.message);
      return false;
    }
  }
}

module.exports = SupabaseMigration;