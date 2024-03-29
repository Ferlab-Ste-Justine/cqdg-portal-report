import configCqdg from '../../config/cqdg/biospecimenData/config';
import { KEYCLOAK_REALM, Realm } from '../../config/env';
import { ReportConfig } from '../types';

const getConfig = (): ReportConfig => {
    switch (KEYCLOAK_REALM) {
        case Realm.CQDG:
            return configCqdg;
        case Realm.KF:
            return configCqdg;
        case Realm.INCLUDE:
            return configCqdg;
        case Realm.CLIN:
            return configCqdg;
        default:
            return configCqdg;
    }
};

export default getConfig;
