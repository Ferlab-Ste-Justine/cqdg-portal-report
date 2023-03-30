import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';

import { ES_HOST, ES_PWD, ES_USER, esFileIndex } from '../../config/env';
import { reportGenerationErrorHandler } from '../../utils/errors';
import generateTsvReport from '../utils/generateTsvReport';
import getFamilyIds from '../utils/getFamilyIds';
import getFilesFromSqon from '../utils/getFilesFromSqon';
import getInfosByConfig from '../utils/getInfosByConfig';
import configCqdg from './configCqdg';

const fileManifestReport = () => async (req: Request, res: Response): Promise<void> => {
    console.time('fileManifestReport');

    const { sqon, filename, projectId, withFamily = false } = req.body;
    const userId = req['kauth']?.grant?.access_token?.content?.sub;
    const accessToken = req.headers.authorization;

    let es = null;
    try {
        es =
            ES_PWD && ES_USER
                ? new Client({ node: ES_HOST, auth: { password: ES_PWD, username: ES_USER } })
                : new Client({ node: ES_HOST });

        const wantedFields = ['file_id'];
        const files = await getFilesFromSqon(es, projectId, sqon, userId, accessToken, wantedFields);
        const fileIds = files?.map(f => f.file_id);
        const newFileIds = withFamily ? await getFamilyIds(es, fileIds) : fileIds;

        const filesInfos = await getInfosByConfig(es, configCqdg, newFileIds, 'file_id', esFileIndex);

        const path = `/tmp/${filename}.tsv`;
        await generateTsvReport(filesInfos, path, configCqdg);

        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.tsv"`);
        res.sendFile(path);

        es.close();
    } catch (err) {
        reportGenerationErrorHandler(err, es);
    }

    console.timeEnd('fileManifestReport');
};

export default fileManifestReport;
