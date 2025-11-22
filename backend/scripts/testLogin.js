const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');
const { User, syncModels } = require('../models');

async function run() {
  try {
    await sequelize.authenticate();
    await syncModels(false);

    const email = 'evaristo@evaristo.com.br';
    const password = '123456';

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      console.log(JSON.stringify({ success: false, error: 'Credenciais inválidas' }));
      process.exit(0);
    }

    const ok = await user.validatePassword(password);
    if (!ok) {
      console.log(JSON.stringify({ success: false, error: 'Credenciais inválidas' }));
      process.exit(0);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    console.log(JSON.stringify({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
      }
    }));
    process.exit(0);
  } catch (err) {
    console.error('Test login error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();

