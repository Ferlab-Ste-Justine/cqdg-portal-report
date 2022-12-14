import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';
import generateReport from '../generateReport';
import configCqdg from './configCqdg';
import { normalizeConfigs } from '../../utils/configUtils';

import generateFamilySqon from './generateFamilySqon';
import { reportGenerationErrorHandler } from '../../errors';
import {ES_PWD, ES_USER, PROJECT} from '../../env';

const clinicalDataReport = (esHost: string) => async (req: Request, res: Response) => {
    console.time('family-clinical-data');

    const { sqon, projectId, filename = null } = req.body;
    const userId = req['kauth']?.grant?.access_token?.content?.sub;
    const accessToken = req.headers.authorization;

    let es = null;
    try {
        // prepare the ES client
        es =
            ES_PWD && ES_USER
                ? new Client({ node: esHost, auth: { password: ES_PWD, username: ES_USER } })
                : new Client({ node: esHost });

        // decorate the configs with default values, values from arranger's project, etc...
        const normalizedConfigs = await normalizeConfigs(es, projectId, configCqdg);

        // generate a new sqon containing the id of all family members for the current sqon
        const familySqon = await generateFamilySqon(
            es,
            projectId,
            sqon,
            normalizedConfigs,
            userId,
            accessToken,
            PROJECT,
        );

        // Generate the report
        await generateReport(es, res, projectId, familySqon, filename, normalizedConfigs, userId, accessToken);
        es.close();
    } catch (err) {
        reportGenerationErrorHandler(err, es);
    }

    console.timeEnd('family-clinical-data');
};

export default clinicalDataReport;
