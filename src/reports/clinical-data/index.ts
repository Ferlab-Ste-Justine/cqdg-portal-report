import { Request, Response } from 'express';
import { Client } from '@elastic/elasticsearch';
import generateReport from '../generateReport';
import configCqdg from './configCqdg';
import configFamilyCqdg from './configFamilyCqdg';
import { normalizeConfigs } from '../../utils/configUtils';
import { reportGenerationErrorHandler } from '../../errors';
import { ES_PWD, ES_USER, ES_HOST } from '../../env';
import generateFamilySqon from './generateFamilySqon';

const clinicalDataReport = ({ withFamily = false }: { withFamily: boolean }) => async (req: Request, res: Response) => {
    console.time('clinicalDataReport');
    console.log('clinicalDataReport withFamily=', withFamily);

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
        const normalizedConfigs = await normalizeConfigs(es, projectId, withFamily ? configFamilyCqdg : configCqdg);

        const newSqon = withFamily
            ? await generateFamilySqon(es, projectId, sqon, normalizedConfigs, userId, accessToken)
            : sqon;

        // Generate the report
        await generateReport(es, res, projectId, newSqon, filename, normalizedConfigs, userId, accessToken);
        es.close();
    } catch (err) {
        reportGenerationErrorHandler(err, es);
    }

    console.timeEnd('clinicalDataReport');
};

export default clinicalDataReport;
