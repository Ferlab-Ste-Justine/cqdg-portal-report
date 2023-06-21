import cqdgGlobal from '../../config/cqdg/configGlobal';
import cqdgFileManifest from '../../config/cqdg/fileManifest/config';
import { KEYCLOAK_REALM, Realm } from '../../config/env';

const getConfig = () => {
    switch (KEYCLOAK_REALM) {
        case Realm.CQDG:
            return { global: cqdgGlobal, fileManifest: cqdgFileManifest };
        case Realm.KF:
            return { global: cqdgGlobal, fileManifest: cqdgFileManifest };
        case Realm.INCLUDE:
            return { global: cqdgGlobal, fileManifest: cqdgFileManifest };
        case Realm.CLIN:
            return { global: cqdgGlobal, fileManifest: cqdgFileManifest };
        default:
            return { global: cqdgGlobal, fileManifest: cqdgFileManifest };
    }
};

export default getConfig;
