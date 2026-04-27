import { expect } from 'chai';
import request from 'supertest';

import { buildTestApp, TestApp } from './helpers/buildTestApp';

describe('GET /status', () => {
    let testApp: TestApp;

    beforeEach(() => {
        testApp = buildTestApp();
    });

    afterEach(() => testApp.restore());

    it('returns service metadata', async () => {
        const res = await request(testApp.app).get('/status');
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('name');
        expect(res.body).to.have.property('version');
        expect(res.body).to.have.property('elasticsearch');
    });

    it('is also served at the root path', async () => {
        const res = await request(testApp.app).get('/');
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('name');
    });

    it('returns 404 for unknown endpoints', async () => {
        const res = await request(testApp.app).get('/not-a-real-endpoint');
        expect(res.status).to.equal(404);
    });
});
