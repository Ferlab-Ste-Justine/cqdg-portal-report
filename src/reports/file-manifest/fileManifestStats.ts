import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';

import { ES_HOST, ES_PWD, ES_USER } from '../../config/env';
import { reportGenerationErrorHandler } from '../../utils/errors';
import getFamilyIds from '../utils/getFamilyIds';
import getFilesFromSqon from '../utils/getFilesFromSqon';
import getConfig from './getConfig';

interface IFileByDataType {
    key: string;
    value: string;
    nb_participants: number;
    nb_files: number;
    size: number;
}

const fileManifestStats = () => async (req: Request, res: Response): Promise<void> => {
    console.time('getFileManifestStats');

    const { sqon, projectId, withFamily = false } = req.body;
    const userId = req['kauth']?.grant?.access_token?.content?.sub;
    const accessToken = req.headers.authorization;

    let es = null;
    try {
        es =
            ES_PWD && ES_USER
                ? new Client({ node: ES_HOST, auth: { password: ES_PWD, username: ES_USER } })
                : new Client({ node: ES_HOST });

        const configGlobal = getConfig().global;
        const files = await getFilesFromSqon(
            es,
            projectId,
            sqon,
            userId,
            accessToken,
            configGlobal.fileManifestWantedFields,
        );

        const newFiles = withFamily
            ? await getFamilyIds(
                  es,
                  files?.map(f => f[configGlobal.file_id]),
              )
            : files;

        /** Join files by data_type */
        const filesInfosData: IFileByDataType[] = [];
        for (const file of newFiles) {
            const filesFound = files.filter(f => f[configGlobal.data_type] === file[configGlobal.data_type]);
            if (!filesInfosData.find(f => f.value === file[configGlobal.data_type])) {
                const participantIds = [];
                for (const fileFound of filesFound) {
                    participantIds.push(...fileFound[configGlobal.participants].map(p => p.participant_id));
                }
                const participantIdsUniq = [...new Set(participantIds)];
                const nb_participants = participantIdsUniq.length;
                filesInfosData.push({
                    key: file[configGlobal.data_type],
                    value: file[configGlobal.data_type],
                    nb_participants,
                    nb_files: filesFound.length,
                    size: filesFound.reduce((a, b) => a + (b ? b[configGlobal.file_size] : 0), 0),
                });
            }
        }

        res.send(filesInfosData);
        es.close();
    } catch (err) {
        reportGenerationErrorHandler(err, es);
    }

    console.timeEnd('getFileManifestStats');
};

export default fileManifestStats;
