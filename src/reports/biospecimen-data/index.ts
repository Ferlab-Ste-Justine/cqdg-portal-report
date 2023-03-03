import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';

import { ES_HOST, ES_PWD, ES_USER } from '../../config/env';
import { normalizeConfigs } from '../../utils/configUtils';
import { reportGenerationErrorHandler } from '../../utils/errors';
import ExtendedReportConfigs from '../../utils/extendedReportConfigs';
import generateExcelReport from '../utils/generateExcelReport';
import configCqdg from './configCqdg';

const biospecimenDataReport = () => async (req: Request, res: Response) => {
    console.time('biospecimenDataReport');

    const { sqon, projectId, filename = null } = req.body;
    const userId = req['kauth']?.grant?.access_token?.content?.sub;
    const accessToken = req.headers.authorization;

    let es = null;
    try {
        // prepare the ES client
        es =
            ES_PWD && ES_USER
                ? new Client({ node: ES_HOST, auth: { password: ES_PWD, username: ES_USER } })
                : new Client({ node: ES_HOST });

        // decorate the configs with default values, values from arranger's project, etc...
        const normalizedConfigs: ExtendedReportConfigs = await normalizeConfigs(es, projectId, configCqdg);

        // Generate the report
        await generateExcelReport(es, res, projectId, sqon, filename, normalizedConfigs, userId, accessToken);
        es.close();
    } catch (err) {
        reportGenerationErrorHandler(err, es);
    }

    console.timeEnd('biospecimenDataReport');
};

export default biospecimenDataReport;
