import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import Keycloak, { KeycloakConfig } from 'keycloak-connect';

import reportsEndpoint from './reports';
import statusEndpoint from './status';
import { globalErrorHandler, globalErrorLogger, unknownEndpointHandler } from './utils/errors';

export default function(keycloakConfig: KeycloakConfig): Application {
    const keycloak = new Keycloak({}, keycloakConfig);
    const app = express();

    app.use(
        cors({
            exposedHeaders: ['Content-Length', 'Content-Type', 'Content-Disposition'],
        }),
    );
    app.use(compression());
    app.use(express.json({ limit: '50mb' }));
    app.use(
        keycloak.middleware({
            logout: '/logout',
            admin: '/',
        }),
    );

    // endpoints to generate the reports
    app.use('/reports', keycloak.protect(), reportsEndpoint());

    // Health check endpoint
    app.get('/status', statusEndpoint);
    app.get('/', statusEndpoint);

    app.use(globalErrorLogger, unknownEndpointHandler, globalErrorHandler);

    return app;
}
