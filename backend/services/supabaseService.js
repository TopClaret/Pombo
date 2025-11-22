const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class SupabaseService {
    constructor() {
        this.supabase = null;
        this.initialize();
    }

    initialize() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                logger.warn('Variáveis de ambiente do Supabase não configuradas. Usando banco local.');
                return;
            }

            if (supabaseUrl.includes('your-project-ref.supabase.co')) {
                logger.warn('SUPABASE_URL parece ser um placeholder. Substitua pelo URL real do seu projeto.');
            }

            this.supabase = createClient(supabaseUrl, supabaseKey);
            logger.info('Cliente Supabase inicializado com sucesso');
        } catch (error) {
            logger.error('Erro ao inicializar Supabase:', error);
        }
    }

    isConfigured() {
        return this.supabase !== null;
    }

    // Métodos para usuários
    async createUser(userData) {
        if (!this.isConfigured()) {
            throw new Error('Supabase não configurado');
        }

        try {
            const insertPayload = {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.role || 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Se um id válido for fornecido, usa; caso contrário, deixa o Supabase gerar
            if (userData.id) insertPayload.id = userData.id;

            const { data, error } = await this.supabase
                .from('users')
                .insert([insertPayload])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            logger.error('Erro ao criar usuário no Supabase:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        if (!this.isConfigured()) {
            throw new Error('Supabase não configurado');
        }

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
            return data;
        } catch (error) {
            logger.error('Erro ao buscar usuário no Supabase:', error);
            throw error;
        }
    }

    // Métodos para uploads
    async createUpload(uploadData) {
        if (!this.isConfigured()) {
            throw new Error('Supabase não configurado');
        }

        try {
            const { data, error } = await this.supabase
                .from('uploads')
                .insert([{
                    id: uploadData.id,
                    user_id: uploadData.user_id,
                    file_name: uploadData.file_name,
                    file_path: uploadData.file_path,
                    file_size: uploadData.file_size,
                    mime_type: uploadData.mime_type,
                    status: uploadData.status || 'pending',
                    analysis_results: uploadData.analysis_results,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            logger.error('Erro ao criar upload no Supabase:', error);
            throw error;
        }
    }

    async getUploadsByUserId(userId) {
        if (!this.isConfigured()) {
            throw new Error('Supabase não configurado');
        }

        try {
            const { data, error } = await this.supabase
                .from('uploads')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Erro ao buscar uploads no Supabase:', error);
            throw error;
        }
    }

    // Método para verificar saúde do Supabase
    async healthCheck() {
        if (!this.isConfigured()) {
            return { healthy: false, error: 'Supabase não configurado' };
        }

        try {
            const { error } = await this.supabase
                .from('users')
                .select('count')
                .limit(1);

            return { 
                healthy: !error, 
                error: error ? error.message : null 
            };
        } catch (error) {
            return { 
                healthy: false, 
                error: error.message 
            };
        }
    }
}

module.exports = new SupabaseService();
