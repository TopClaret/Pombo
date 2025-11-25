const request = require('supertest')
process.env.DB_STORAGE = ':memory:'
process.env.JWT_SECRET = 'test_secret_!@#2025'
process.env.NODE_ENV = 'test'
jest.mock('../utils/aiProcessor', () => ({
  processFileAnalysis: jest.fn(async () => undefined),
  processBatchAnalysis: jest.fn(async () => ({ successful: 1, failed: 0 }))
}))
const app = require('../server')
const { User, syncModels } = require('../models')
const fs = require('fs')
const path = require('path')

describe('Upload', () => {
  let token
  beforeAll(async () => {
    await syncModels(true)
    const u = await User.create({ name: 'Uploader', email: 'uploader@example.com', password: 'password123', role: 'user' })
    const login = await request(app).post('/api/auth/login').send({ email: 'uploader@example.com', password: 'password123' })
    token = login.body.data.token
  })

  it('envia imagem e cria registro de upload', async () => {
    const sample = path.join(__dirname, 'fixtures', 'sample-placa.jpg')
    const exists = fs.existsSync(sample)
    const filePath = exists ? sample : path.join(process.cwd(), '..', 'ai-processor', 'sample-placa.jpg')
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('files', filePath)
      .expect(201)
    expect(res.body.success).toBeTruthy()
    expect(Array.isArray(res.body.data.uploads)).toBeTruthy()
    expect(res.body.data.uploads[0].id).toBeDefined()
  })
})
