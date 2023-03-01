import { Request, Response } from 'express';
import { Client } from '@elastic/elasticsearch';
import { reportGenerationErrorHandler } from '../../utils/errors';
import { ES_PWD, ES_USER, ES_HOST, PROJECT } from '../../config/env';
import generateFamilyIds from './generateFamilySqon';
import generateFiles from './generateFiles';
import generateZip from './generateZip';
import getStudiesInfos from './generateFiles/getStudiesInfos';

const fileRequestAccess = ({ withFamily = false }: { withFamily: boolean }) => async (
    req: Request,
    res: Response,
): Promise<void> => {
    console.time('fileRequestAccess');

    const { sqon } = req.body;

    let es = null;
    try {
        es =
            ES_PWD && ES_USER
                ? new Client({ node: ES_HOST, auth: { password: ES_PWD, username: ES_USER } })
                : new Client({ node: ES_HOST });

        const fileName = `${PROJECT}-access-request.tar.gz`;
        const fileIds = sqon.content?.find(e => e.content?.field === 'file_id')?.content?.value || [];
        const newFileIds = withFamily ? await generateFamilyIds(es, fileIds) : fileIds;
        const studyInfos = await getStudiesInfos(es, newFileIds);
        await generateFiles(es, res, newFileIds, studyInfos);
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
