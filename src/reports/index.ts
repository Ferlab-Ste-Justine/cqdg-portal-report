import express, { Router } from 'express';

import clinicalDataReport from './clinical-data';
import biospecimenDataReport from './biospecimen-data';
import fileManifestReport from './file-manifest';
import fileRequestAccess from './file-request-access';

export default (): Router => {
    const router = express.Router();

    router.use('/clinical-data', clinicalDataReport({ withFamily: false }));
    router.use('/clinical-data-family', clinicalDataReport({ withFamily: true }));
    router.use('/biospecimen-data', biospecimenDataReport());
    router.use('/file-manifest', fileManifestReport({ withFamily: false }));
    router.use('/file-manifest-family', fileManifestReport({ withFamily: true }));
    router.use('/file-request-access', fileRequestAccess({ withFamily: false }));
    router.use('/file-request-access-family', fileRequestAccess({ withFamily: true }));

    return router;
};
