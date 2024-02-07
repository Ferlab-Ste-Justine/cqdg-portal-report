import dotenv from 'dotenv';

dotenv.config();

// Port of this service
export const PORT = process.env.PORT || 4000;

// ElasticSearch host
export const ES_HOST = process.env.ES_HOST || 'localhost:9200';
export const ES_USER = process.env.ES_USER;
export const ES_PWD = process.env.ES_PASS;
// ElasticSearch queries parameters
export const ES_QUERY_MAX_SIZE: number = Number(process.env.ES_QUERY_MAX_SIZE) || 10000;

// Project (this is not the arranger project id)
export const PROJECT: string = process.env.PROJECT || 'CQDG';

export const esFileIndex = process.env.ES_FILE_INDEX || 'file_centric';
export const esFileAlias = process.env.ES_FILE_INDEX || 'file';

// Keycloak configs
export const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://auth.qa.cqdg.ferlab.bio/auth';
export const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'CQDG';
export const KEYCLOAK_CLIENT = process.env.KEYCLOAK_CLIENT || 'cqdg-client';

export const RIFF_URL = process.env.RIFF_URL || 'https://riff-qa.kf-strides.org';

export enum Realm {
    INCLUDE = 'includedcc',
    CQDG = 'CQDG',
    KF = 'kidsfirstdrc',
    CLIN = 'clin',
}
