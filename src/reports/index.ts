import express, { Router } from 'express';

import biospecimenDataReport from './biospecimen-data';
import clinicalDataReport from './clinical-data';
import fileManifestReport from './file-manifest';
import fileManifestStats from './file-manifest/fileManifestStats';
import fileRequestAccess from './file-request-access';
import fileRequestAccessStats from './file-request-access/fileRequestAccessStats';

export default (): Router => {
    const router = express.Router();

    router.use('/clinical-data', clinicalDataReport({ withFamily: false }));
    router.use('/biospecimen-data', biospecimenDataReport());
    router.use('/file-manifest/stats', fileManifestStats());
    router.use('/file-manifest', fileManifestReport({ withFamily: false }));
    router.use('/file-request-access/stats', fileRequestAccessStats());
    router.use('/file-request-access', fileRequestAccess({ withFamily: false }));

    return router;
};
