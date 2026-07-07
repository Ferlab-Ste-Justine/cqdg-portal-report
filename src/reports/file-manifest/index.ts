import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';

import { ES_HOST, ES_PWD, ES_USER, esFileIndex } from '../../config/env';
import { getSet } from '../../services/userApi';
import { reportGenerationErrorHandler } from '../../utils/errors';
import { cleanTmpFolder, createTmpFolder } from '../../utils/tmpFolderUtils';
import generateTsvReport from '../utils/generateTsvReport';
import getFamilyIds from '../utils/getFamilyIds';
import getFilesFromSqon from '../utils/getFilesFromSqon';
import getInfosByConfig from '../utils/getInfosByConfig';
import getConfig from './getConfig';

const fileManifestReport = () => async (req: Request, res: Response): Promise<void> => {
    console.time('fileManifestReport');

    const { sqon, filename, withFamily = false } = req.body;
    const userId = req['kauth']?.grant?.access_token?.content?.sub;
    const accessToken = req.headers.authorization;

    let es = null;
    try {
        es =
            ES_PWD && ES_USER
                ? new Client({ node: ES_HOST, auth: { password: ES_PWD, username: ES_USER } })
                : new Client({ node: ES_HOST });

        const setId = req.params.setId;
        const { fileManifest: configFileManifest, global: configGlobal } = getConfig();

        let newFileIds: string[];
        if (setId) {
            const set = await getSet(accessToken, setId);
            newFileIds = set.content.ids;
        } else {
            const wantedFields = [configGlobal.stable_file_id];
            const files = await getFilesFromSqon(es, sqon, userId, accessToken, wantedFields);
            const fileIds = files?.map(f => f[configGlobal.stable_file_id]);
            newFileIds = withFamily ? await getFamilyIds(es, fileIds, configGlobal.stable_file_id) : fileIds;
        }

        const { filesInfos, filesInfosWithExtraFields } = await getInfosByConfig(
            es,
            configFileManifest,
            newFileIds,
            configGlobal.stable_file_id,
            esFileIndex,
            configGlobal.stable_file_id,
            [
                configGlobal.relates_to_stable_file_id,
                configGlobal.relates_to_file_name,
                configGlobal.relates_to_file_format,
                configGlobal.relates_to_file_size,
            ],
            configGlobal.data_type,
        );

        const folderPath = await createTmpFolder();
        const tsvPath = `${folderPath}/${filename}.tsv`;

        await generateTsvReport(filesInfos, tsvPath, configFileManifest, filesInfosWithExtraFields);
        res.download(`${folderPath}/${filename}.tsv`, `${filename}.tsv`, () => cleanTmpFolder(folderPath));
        es.close();

    } catch (err) {
        reportGenerationErrorHandler(err, es);
    }

    console.timeEnd('fileManifestReport');
};

export default fileManifestReport;
