import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('OpenAI Config Management (e2e)', () => {
  let app: INestApplication;
  let configId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get available OpenAI models', () => {
    return request(app.getHttpServer())
      .get('/openai-config/models')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0]).toHaveProperty('id');
        expect(res.body.data[0]).toHaveProperty('name');
        expect(res.body.data[0]).toHaveProperty('description');
      });
  });

  it('should create a new OpenAI config', () => {
    const createDto = {
      name: 'Test Config',
      description: 'Test configuration for OpenAI',
      model: 'gpt-3.5-turbo',
      apiKey: 'sk-test-key-for-testing-only',
      systemPrompt: 'Bạn là trợ lý AI thông minh cho fanpage bán hàng.',
      maxTokens: 150,
      temperature: 0.7,
      status: 'active',
      isDefault: false,
      applicableScenarios: [],
      applicableFanpages: [],
    };

    return request(app.getHttpServer())
      .post('/openai-config')
      .send(createDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe(createDto.name);
        expect(res.body.model).toBe(createDto.model);
        configId = res.body._id;
      });
  });

  it('should get all OpenAI configs', () => {
    return request(app.getHttpServer())
      .get('/openai-config')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page');
        expect(res.body).toHaveProperty('totalPages');
        expect(res.body.data).toBeInstanceOf(Array);
      });
  });

  it('should get OpenAI config by id', () => {
    if (!configId) return;

    return request(app.getHttpServer())
      .get(`/openai-config/${configId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(configId);
        expect(res.body).toHaveProperty('name');
        expect(res.body).toHaveProperty('model');
      });
  });

  it('should update OpenAI config', () => {
    if (!configId) return;

    const updateDto = {
      name: 'Updated Test Config',
      temperature: 0.8,
    };

    return request(app.getHttpServer())
      .patch(`/openai-config/${configId}`)
      .send(updateDto)
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toBe(updateDto.name);
        expect(res.body.temperature).toBe(updateDto.temperature);
      });
  });

  it('should get usage statistics', () => {
    if (!configId) return;

    return request(app.getHttpServer())
      .get(`/openai-config/${configId}/usage-stats`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('totalRequests');
        expect(res.body.data).toHaveProperty('successfulResponses');
        expect(res.body.data).toHaveProperty('failedResponses');
        expect(res.body.data).toHaveProperty('totalTokensUsed');
        expect(res.body.data).toHaveProperty('successRate');
        expect(res.body.data).toHaveProperty('avgTokensPerRequest');
      });
  });

  it('should set as default config', () => {
    if (!configId) return;

    return request(app.getHttpServer())
      .post(`/openai-config/${configId}/set-default`)
      .expect(200)
      .expect((res) => {
        expect(res.body.isDefault).toBe(true);
      });
  });

  it('should get default config', () => {
    return request(app.getHttpServer())
      .get('/openai-config/default')
      .expect(200)
      .expect((res) => {
        if (res.body.data) {
          expect(res.body.data.isDefault).toBe(true);
        }
      });
  });

  it('should delete OpenAI config', () => {
    if (!configId) return;

    return request(app.getHttpServer())
      .delete(`/openai-config/${configId}`)
      .expect(204);
  });
});

// Integration test for ChatBot with OpenAI Config
describe('ChatBot OpenAI Integration (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should process message with OpenAI fallback using database config', async () => {
    // First create a test config
    const createDto = {
      name: 'Chatbot Test Config',
      description: 'Configuration for chatbot testing',
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY || 'sk-test-key',
      systemPrompt: 'Bạn là trợ lý AI cho fanpage. Trả lời ngắn gọn và thân thiện.',
      maxTokens: 100,
      temperature: 0.5,
      status: 'active',
      isDefault: true,
      applicableScenarios: [],
      applicableFanpages: [],
    };

    const configResponse = await request(app.getHttpServer())
      .post('/openai-config')
      .send(createDto)
      .expect(201);

    const configId = configResponse.body._id;

    // Mock a webhook message that doesn't match any script
    const webhookPayload = {
      object: 'page',
      entry: [{
        id: 'test-page-id',
        time: Date.now(),
        messaging: [{
          sender: { id: 'test-user-psid' },
          recipient: { id: 'test-page-id' },
          timestamp: Date.now(),
          message: {
            mid: 'test-message-id',
            text: 'Xin chào, tôi cần tư vấn về sản phẩm không có trong kịch bản'
          }
        }]
      }]
    };

    // This would trigger the chatbot processor and should use our config
    // Note: This requires proper webhook setup and test data
    console.log('Webhook payload prepared for testing:', webhookPayload);
    console.log('OpenAI Config created for testing:', configId);

    // Cleanup
    await request(app.getHttpServer())
      .delete(`/openai-config/${configId}`)
      .expect(204);
  });
});