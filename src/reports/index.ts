import express, { Router } from 'express';

import clinicalDataReport from './clinical-data';
import biospecimenDataReport from './biospecimen-data';
import fileManifestReport from './file-manifest';

export default (): Router => {
    const router = express.Router();

    router.use('/clinical-data', clinicalDataReport({ withFamily: false }));
    router.use('/clinical-data-family', clinicalDataReport({ withFamily: true }));
    router.use('/biospecimen-data', biospecimenDataReport());
    router.use('/file-manifest', fileManifestReport({ withFamily: false }));
    router.use('/file-manifest-family', fileManifestReport({ withFamily: true }));

    return router;
};
