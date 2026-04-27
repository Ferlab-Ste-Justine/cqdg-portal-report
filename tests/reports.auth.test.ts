import { expect } from 'chai';
import request from 'supertest';

import { buildTestApp, TestApp } from './helpers/buildTestApp';

describe('auth gating on /reports', () => {
    let testApp: TestApp;

    afterEach(() => testApp?.restore());

    it('rejects requests when keycloak.protect() denies access', async () => {
        testApp = buildTestApp({ unauthenticated: true });
        const res = await request(testApp.app)
            .post('/reports/file-manifest/stats')
            .send({ sqon: { op: 'and', content: [] } });
        expect(res.status).to.equal(401);
    });

    it('allows requests when authenticated', async () => {
        testApp = buildTestApp({
            fetch: async () => ({ status: 200, json: async () => ({ extendedMapping: [] }) }),
        });
        const res = await request(testApp.app)
            .post('/reports/file-manifest/stats')
            .send({ sqon: { op: 'and', content: [] } });
        expect(res.status).to.not.equal(401);
        expect(res.status).to.not.equal(403);
    });
});
