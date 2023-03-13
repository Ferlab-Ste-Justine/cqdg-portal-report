import { Client } from '@elastic/elasticsearch';
import { Request, Response } from 'express';

import { ES_HOST, ES_PWD, ES_USER, PROJECT } from '../../config/env';
import { reportGenerationErrorHandler } from '../../utils/errors';
import getFamilyIds from '../utils/getFamilyIds';
import getFilesFromSqon from '../utils/getFilesFromSqon';
import generateFiles from './generateFiles';
import generateZip from './generateZip';
import getStudiesInfos from './getStudiesInfos';

const fileRequestAccess = () => async (req: Request, res: Response): Promise<void> => {
    console.time('fileRequestAccess');

    const { sqon, projectId, withFamily = false } = req.body;
    const userId = req['kauth']?.grant?.access_token?.content?.sub;
    const accessToken = req.headers.authorization;

    let es = null;
    try {
        es =
            ES_PWD && ES_USER
                ? new Client({ node: ES_HOST, auth: { password: ES_PWD, username: ES_USER } })
                : new Client({ node: ES_HOST });

        const fileName = `${PROJECT}-access-request.tar.gz`;

        const wantedFields = ['file_id'];
        const files = await getFilesFromSqon(es, projectId, sqon, userId, accessToken, wantedFields);
        const fileIds = files?.map(f => f.file_id);
        const newFileIds = withFamily ? await getFamilyIds(es, fileIds) : fileIds;
        const studyInfos = await getStudiesInfos(es, newFileIds);
        await generateFiles(studyInfos);
        await generateZip(studyInfos, fileName);

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.sendFile(`/tmp/${fileName}`);

        es.close();
    } catch (err) {
        reportGenerationErrorHandler(err, es);
    }
    console.timeEnd('fileRequestAccess');
};

export default fileRequestAccess;
