import { Application } from 'express';
import proxyquire from 'proxyquire';
import sinon, { SinonStub } from 'sinon';

import keycloakConfig from '../../src/config/keycloak';

export type ESSearchResponder = (params: { index: string; body: any }) => any;
export type FetchResponder = (
    url: string,
    init: any,
) => Promise<{ status: number; json: () => Promise<any> }> | { status: number; json: () => Promise<any> };

export interface TestAppOptions {
    esSearch?: ESSearchResponder;
    fetch?: FetchResponder;
    userId?: string | null;
    unauthenticated?: boolean;
}

export interface TestApp {
    app: Application;
    stubs: {
        esSearch: SinonStub;
        esClose: SinonStub;
        fetch: SinonStub;
        buildQuery: SinonStub;
    };
    restore: () => void;
}

const emptyHits = { hits: { hits: [], total: { value: 0 } } };

export const buildTestApp = (options: TestAppOptions = {}): TestApp => {
    const esSearch = sinon.stub();
    if (options.esSearch) {
        esSearch.callsFake(async params => ({ body: options.esSearch!(params) }));
    } else {
        esSearch.resolves({ body: emptyHits });
    }
    const esClose = sinon.stub().resolves(undefined);

    class FakeESClient {
        search = esSearch;
        close = esClose;
    }

    const fetchStub = sinon.stub();
    if (options.fetch) {
        fetchStub.callsFake(options.fetch as any);
    } else {
        fetchStub.resolves({ status: 200, json: async () => ({}) });
    }

    const buildQueryStub = sinon.stub().returns({ match_all: {} });

    const keycloakUserId = options.userId === undefined ? 'test-user' : options.userId;
    const unauthenticated = options.unauthenticated === true;

    class FakeKeycloak {
        constructor(_store?: any, _config?: any) { }

        middleware() {
            return (req: any, _res: any, next: any) => {
                if (keycloakUserId !== null) {
                    req.kauth = { grant: { access_token: { content: { sub: keycloakUserId } } } };
                }
                next();
            };
        }

        protect() {
            return (_req: any, res: any, next: any) => {
                if (unauthenticated) {
                    res.status(401).send({ message: 'Unauthorized' });
                    return;
                }
                next();
            };
        }
    }

    const fetchModule: any = fetchStub;
    fetchModule['@global'] = true;
    fetchModule['@noCallThru'] = true;

    const esModule = { Client: FakeESClient, '@global': true, '@noCallThru': true };
    const arrangerModule = { buildQuery: buildQueryStub, '@global': true, '@noCallThru': true };

    const keycloakModule: any = FakeKeycloak;
    keycloakModule['@global'] = true;
    keycloakModule['@noCallThru'] = true;

    const appModule = proxyquire.noPreserveCache()('../../src/app', {
        'keycloak-connect': keycloakModule,
        '@elastic/elasticsearch': esModule,
        'node-fetch': fetchModule,
        '@arranger/middleware': arrangerModule,
    });

    const buildApp = appModule.default || appModule;
    const app: Application = buildApp(keycloakConfig);

    return {
        app,
        stubs: { esSearch, esClose, fetch: fetchStub, buildQuery: buildQueryStub },
        restore: () => sinon.restore(),
    };
};
