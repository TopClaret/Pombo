const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { sequelize } = require('../config/database');
const { User, syncModels } = require('../models');

async function run() {
  try {
    await sequelize.authenticate();
    await syncModels(false);

    const name = 'Evaristo';
    const email = 'evaristo@evaristo.com.br';
    const password = '123456';

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({ name, email, password, role: 'user' });
      console.log(JSON.stringify({ created: true, id: user.id, email: user.email }));
    } else {
      console.log(JSON.stringify({ created: false, id: user.id, email: user.email }));
    }
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();

