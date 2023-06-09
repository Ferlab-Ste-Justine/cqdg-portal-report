import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';
import { inspect } from 'util';

import { ES_HOST, ES_PWD, ES_USER } from '../../config/env';
import { normalizeConfigs } from '../../utils/configUtils';
import { reportGenerationErrorHandler } from '../../utils/errors';
import generateExcelReport from '../utils/generateExcelReport';
import getConfig from './config/getConfig';
import generateFamilySqon from './generateFamilySqon';

const clinicalDataReport = () => async (req: Request, res: Response): Promise<void> => {
    console.time('clinicalDataReport');

    const { sqon, projectId, filename = null, withFamily = false } = req.body;
    const userId = req['kauth']?.grant?.access_token?.content?.sub;
    const accessToken = req.headers.authorization;

    let es = null;
    try {
        // prepare the ES client
        es =
            ES_PWD && ES_USER
                ? new Client({ node: ES_HOST, auth: { password: ES_PWD, username: ES_USER } })
                : new Client({ node: ES_HOST });

        const config = getConfig(withFamily);

        // decorate the configs with default values, values from arranger's project, etc...
        const normalizedConfigs = await normalizeConfigs(es, projectId, config);

        const newSqon = withFamily
            ? await generateFamilySqon(es, projectId, sqon, normalizedConfigs, userId, accessToken)
            : sqon;

        // Generate the report
        await generateExcelReport(es, res, projectId, newSqon, filename, normalizedConfigs, userId, accessToken);
        es.close();
    } catch (err) {
        reportGenerationErrorHandler(err, es);
    }

    console.timeEnd('clinicalDataReport');
};

export default clinicalDataReport;
