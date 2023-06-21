import configCqdg from './cqdg/configGlobal';
import { KEYCLOAK_REALM, Realm } from './env';

const getConfigGlobal = () => {
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

export default getConfigGlobal;
