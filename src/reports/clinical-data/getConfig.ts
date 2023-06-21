import cqdgClinicalData from '../../config/cqdg/clinicalData/config';
import cqdgClinicalDataFamily from '../../config/cqdg/clinicalData/configFamily';
import cqdgGlobal from '../../config/cqdg/configGlobal';
import { KEYCLOAK_REALM, Realm } from '../../config/env';

const getConfig = () => {
    switch (KEYCLOAK_REALM) {
        case Realm.CQDG:
            return { global: cqdgGlobal, clinicalData: cqdgClinicalData, clinicalDataFamily: cqdgClinicalDataFamily };
        case Realm.KF:
            return { global: cqdgGlobal, clinicalData: cqdgClinicalData, clinicalDataFamily: cqdgClinicalDataFamily };
        case Realm.INCLUDE:
            return { global: cqdgGlobal, clinicalData: cqdgClinicalData, clinicalDataFamily: cqdgClinicalDataFamily };
        case Realm.CLIN:
            return { global: cqdgGlobal, clinicalData: cqdgClinicalData, clinicalDataFamily: cqdgClinicalDataFamily };
        default:
            return { global: cqdgGlobal, clinicalData: cqdgClinicalData, clinicalDataFamily: cqdgClinicalDataFamily };
    }
};

export default getConfig;
