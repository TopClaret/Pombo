const request = require('supertest')
process.env.DB_STORAGE = ':memory:'
process.env.JWT_SECRET = 'test_secret_!@#2025'
process.env.NODE_ENV = 'test'
jest.mock('../services/aiProcessorService', () => ({
  recognizeLicensePlates: jest.fn(async () => ({
    detected_plates: [
      { plate_number: 'ABC1D23', confidence: 0.92, timestamp: Date.now() }
    ],
    total_detections: 1,
    processing_time: 120,
    average_confidence: 0.92
  }))
}))
const app = require('../server')
const { User, Upload, syncModels } = require('../models')

describe('Analysis', () => {
  let token, uploadId
  beforeAll(async () => {
    await syncModels(true)
    await User.create({ name: 'Analyst', email: 'analyst@example.com', password: 'password123', role: 'user' })
    const login = await request(app).post('/api/auth/login').send({ email: 'analyst@example.com', password: 'password123' })
    token = login.body.data.token
    const up = await Upload.create({
      userId: login.body.data.user.id,
      originalName: 'sample-placa.jpg',
      fileName: 'sample-placa.jpg',
      filePath: 'ai-processor/sample-placa.jpg',
      fileType: 'image/jpeg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      status: 'uploaded'
    })
    uploadId = up.id
  })

  it('inicia análise de placas e marca como processing', async () => {
    const res = await request(app)
      .post(`/api/analysis/upload/${uploadId}/analyze-plates`)
      .set('Authorization', `Bearer ${token}`)
      .expect(202)
    expect(res.body.status).toBe('processing')
    expect(res.body.analysisId).toBeDefined()
  })
})
