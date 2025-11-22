const jwt = require('jsonwebtoken');
const { User } = require('../models');
const supabaseService = require('../services/supabaseService');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Desativar temporariamente Supabase devido a problemas de configuração
    // if (supabaseService.isConfigured()) {
    //   const { data, error } = await supabaseService.supabase
    //     .from('users')
    //     .select('*')
    //     .eq('id', decoded.id)
    //     .single();
    //
    //   if (error || !data) {
    //     return res.status(401).json({ error: 'Token inválido ou usuário inativo.' });
    //   }
    //
    //   req.user = { id: data.id, name: data.name, email: data.email, role: data.role };
    //   return next();
    // }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Token inválido ou usuário inativo.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado.' });
    }
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissões insuficientes.' 
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
