import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';
import fs from 'fs';

import { ES_HOST, ES_PWD, ES_USER, esFileIndex } from '../../config/env';
import { reportGenerationErrorHandler } from '../../utils/errors';
import generateTsvReport from '../utils/generateTsvReport';
import getFamilyIds from '../utils/getFamilyIds';
import getFilesFromSqon from '../utils/getFilesFromSqon';
import getInfosByConfig from '../utils/getInfosByConfig';
import getConfig from './getConfig';

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

        const { fileManifest: configFileManifest, global: configGlobal } = getConfig();
        const wantedFields = [configGlobal.file_id];
        const files = await getFilesFromSqon(es, projectId, sqon, userId, accessToken, wantedFields);
        const fileIds = files?.map(f => f[configGlobal.file_id]);
        const newFileIds = withFamily ? await getFamilyIds(es, fileIds) : fileIds;
        const filesInfos = await getInfosByConfig(
            es,
            configFileManifest,
            newFileIds,
            configGlobal.file_id,
            esFileIndex,
        );

        /** create tmp folder to clean it after process */
        const randomString = Math.random()
            .toString(36)
            .substring(2, 15);
        const folderPath = `/tmp/${randomString}`;
        await fs.mkdirSync(folderPath);
        const tsvPath = `${folderPath}/${filename}.tsv`;

        await generateTsvReport(filesInfos, tsvPath, configFileManifest);

        const cleanFolder = () => fs.rmSync(folderPath, { recursive: true, force: true });
        await res.download(`${folderPath}/${filename}.tsv`, `${filename}.tsv`, cleanFolder);
        es.close();
    } catch (err) {
        reportGenerationErrorHandler(err, es);
    }

    console.timeEnd('fileManifestReport');
};

export default fileManifestReport;
