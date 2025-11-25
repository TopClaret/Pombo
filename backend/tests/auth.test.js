const request = require('supertest')
const jwt = require('jsonwebtoken')
process.env.DB_STORAGE = ':memory:'
process.env.JWT_SECRET = 'test_secret_!@#2025'
process.env.NODE_ENV = 'test'
const app = require('../server')
const { User, syncModels } = require('../models')

describe('Auth', () => {
  beforeAll(async () => {
    await syncModels(true)
    await User.create({ name: 'Test', email: 'test@example.com', password: 'password123', role: 'user' })
  })

  it('faz login com credenciais válidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200)
    expect(res.body.success).toBeTruthy()
    expect(res.body.data.token).toBeTruthy()
    const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET)
    expect(decoded.id).toBeDefined()
  })
})
