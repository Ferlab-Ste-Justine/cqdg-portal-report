import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';

import { ES_HOST, ES_PWD, ES_USER } from '../../config/env';
import { reportGenerationErrorHandler } from '../../utils/errors';
import getFamilyIds from '../utils/getFamilyIds';
import getFilesFromSqon from '../utils/getFilesFromSqon';

interface IFileByStudy {
    key: string;
    study_name: string;
    nb_files: number;
}

const fileRequestAccessStats = () => async (req: Request, res: Response): Promise<void> => {
    console.time('getFileRequestAccessStats');

    const { sqon, projectId, withFamily } = req.body;
    const userId = req['kauth']?.grant?.access_token?.content?.sub;
    const accessToken = req.headers.authorization;

    let es = null;
    try {
        es =
            ES_PWD && ES_USER
                ? new Client({ node: ES_HOST, auth: { password: ES_PWD, username: ES_USER } })
                : new Client({ node: ES_HOST });

        const wantedFields = ['file_id', 'study.study_code', 'study.name'];
        const files = await getFilesFromSqon(es, projectId, sqon, userId, accessToken, wantedFields);

        const newFiles = withFamily
            ? await getFamilyIds(
                  es,
                  files?.map(f => f.file_id),
              )
            : files;

        const filesInfosData: IFileByStudy[] = [];
        for (const file of newFiles) {
            const filesFound = files.filter(({ study: { study_code } }) => study_code === file.study?.study_code);
            if (!filesInfosData.find(f => f.key === file.study?.study_code)) {
                filesInfosData.push({
                    key: file.study?.study_code,
                    study_name: file.study?.name || file.study?.study_code,
                    nb_files: filesFound.length,
                });
            }
        }

        res.send(filesInfosData);
        es.close();
    } catch (err) {
        reportGenerationErrorHandler(err, es);
    }

    console.timeEnd('getFileRequestAccessStats');
};

export default fileRequestAccessStats;
