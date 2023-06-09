import { KEYCLOAK_REALM, Realm } from '../../../config/env';
import { ReportConfig } from '../../types';
import configCqdg from './configCqdg';
import configFamilyCqdg from './configFamilyCqdg';

const getConfig = (withFamily: boolean): ReportConfig => {
    switch (KEYCLOAK_REALM) {
        case Realm.CQDG:
            return withFamily ? configFamilyCqdg : configCqdg;
        case Realm.KF:
            return withFamily ? configFamilyCqdg : configCqdg;
        case Realm.INCLUDE:
            return withFamily ? configFamilyCqdg : configCqdg;
        case Realm.CLIN:
            return withFamily ? configFamilyCqdg : configCqdg;
        default:
            return withFamily ? configFamilyCqdg : configCqdg;
    }
};

export default getConfig;
