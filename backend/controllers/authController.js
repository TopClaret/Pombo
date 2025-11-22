const jwt = require('jsonwebtoken');
const { User } = require('../models');
const supabaseService = require('../services/supabaseService');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// Gerar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Registrar novo usuário
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (supabaseService.isConfigured()) {
      const existingInCloud = await supabaseService.getUserByEmail(email);
      if (existingInCloud) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const hashed = await bcrypt.hash(password, 12);
      const created = await supabaseService.createUser({
        name,
        email,
        password: hashed,
        role: role || 'user'
      });

      const token = generateToken(created.id);
      return res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          user: {
            id: created.id,
            name: created.name,
            email: created.email,
            role: created.role
          },
          token
        }
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    const token = generateToken(user.id);
    return res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    const msg = (error && (error.details || error.message)) || '';
    if (supabaseService.isConfigured() && /ENOTFOUND|fetch failed|supabase/i.test(msg)) {
      return res.status(503).json({ error: 'Supabase indisponível. Verifique SUPABASE_URL e chaves no .env.' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Login de usuário
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (supabaseService.isConfigured()) {
      const user = await supabaseService.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = generateToken(user.id);
      return res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        }
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user.id);
    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter perfil do usuário
const getProfile = async (req, res) => {
  try {
    if (supabaseService.isConfigured()) {
      const { id } = req.user;
      const user = await supabaseService.supabase
        .from('users')
        .select('id,name,email,role')
        .eq('id', id)
        .single();

      if (user.error) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json({ success: true, data: { user: user.data } });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    return res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar perfil do usuário
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (supabaseService.isConfigured()) {
      const current = await supabaseService.supabase
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (current.error) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      if (email && email !== current.data.email) {
        const exists = await supabaseService.getUserByEmail(email);
        if (exists) {
          return res.status(400).json({ error: 'Email já está em uso' });
        }
      }

      const { data, error } = await supabaseService.supabase
        .from('users')
        .update({
          name: name ?? current.data.name,
          email: email ?? current.data.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select('id,name,email,role')
        .single();

      if (error) {
        return res.status(500).json({ error: 'Erro ao atualizar perfil' });
      }

      return res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: { user: data }
      });
    }

    const user = await User.findByPk(req.user.id);

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    await user.save();

    return res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
