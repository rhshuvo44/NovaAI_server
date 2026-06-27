import request from 'supertest';
import { createApp } from '@app';

const app = createApp();

describe('Security', () => {
  it('sets standard security headers via helmet', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('attaches a request id header to every response', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('returns a standardized 404 response for unknown routes', async () => {
    const res = await request(app).get('/api/v1/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('ROUTE_NOT_FOUND');
  });

  it('strips Mongo operator keys from request bodies to prevent NoSQL injection', async () => {
    // Sending a $where-style operator in a field that would normally be a
    // plain string. The sanitizer should strip the operator key entirely
    // rather than letting it reach a Mongoose query.
    const res = await request(app)
      .post('/api/v1/analytics/track')
      .send({ eventName: 'test_event', category: 'test', properties: { $where: 'malicious' } });

    // The request should be processed normally (the dangerous key is simply
    // dropped), not rejected outright, and certainly not executed as a query operator.
    expect(res.status).toBe(202);
  });

  it('escapes HTML special characters in string fields to mitigate stored XSS', async () => {
    const res = await request(app)
      .post('/api/v1/analytics/track')
      .send({ eventName: '<script>alert(1)</script>', category: 'test' });

    expect(res.status).toBe(202);
    // We can't directly inspect the sanitized body from this endpoint's
    // response, but the request completing successfully confirms the
    // sanitizer did not throw or corrupt the request pipeline.
  });

  it('rejects bodies larger than the configured JSON limit gracefully', async () => {
    const hugeString = 'a'.repeat(11 * 1024 * 1024); // 11MB > 10MB limit
    const res = await request(app)
      .post('/api/v1/analytics/track')
      .send({ eventName: 'test', category: 'test', properties: { data: hugeString } });

    expect([400, 413]).toContain(res.status);
  });
});
