import { Client } from '@elastic/elasticsearch';

import getConfigGlobal from '../../config';
import { ES_QUERY_MAX_SIZE, esFileIndex } from '../../config/env';
import { executeSearch } from '../../utils/esUtils';

interface IFileInfos {
    study_code: string;
    study_name: string;
    submitter_participant_ids: string;
    participant_ids: string;
    file_name: string;
    data_type: string;
    file_format: string;
    access_limitations: string;
    access_requirements: string;
    access_authority: string;
}

const getFilesInfos = async (es: Client, fileIds: string[]): Promise<IFileInfos[]> => {
    const configGlobal = getConfigGlobal();
    const esRequest = {
        query: { bool: { must: [{ terms: { [configGlobal.file_id]: fileIds, boost: 0 } }] } },
        _source: configGlobal.fileRequestGetFilesInfoSource,
        sort: [{ file_id: { order: 'asc' } }],
        size: ES_QUERY_MAX_SIZE,
    };
    const results = await executeSearch(es, esFileIndex, esRequest);
    const hits = results?.body?.hits?.hits || [];
    const files = hits.map(hit => hit._source);
    const filesInfos = files.map(file => ({
        study_code: file[configGlobal.study][configGlobal.study_code],
        study_name: file[configGlobal.study][configGlobal.name],
        submitter_participant_ids: file[configGlobal.participants]
            .map(p => p[configGlobal.submitter_participant_id])
            .join(', '),
        participant_ids: file[configGlobal.participants].map(p => p[configGlobal.participant_id]).join(', '),
        file_name: file[configGlobal.file_name],
        data_type: file[configGlobal.data_type],
        file_format: file[configGlobal.file_format],
        access_limitations: file[configGlobal.study][configGlobal.data_access_codes]
            ? file[configGlobal.study][configGlobal.data_access_codes][configGlobal.access_limitations]
                  .map(v => v)
                  .join(', ')
            : [],
        access_requirements: file[configGlobal.study][configGlobal.data_access_codes]
            ? file[configGlobal.study][configGlobal.data_access_codes][configGlobal.access_requirements]
                  .map(v => v)
                  .join(', ')
            : [],
        access_authority: file[configGlobal.study][configGlobal.contact]
            ? file[configGlobal.study][configGlobal.contact][configGlobal.value]
            : [],
    }));
    return filesInfos;
};

export interface IStudyInfos {
    study_code: string;
    study_name: string;
    files: IFileInfos[];
    access_limitations: string;
    access_requirements: string;
    access_authority: string;
}

/** get all studies infos from the file ids */
const getStudiesInfos = async (es: Client, fileIds: string[]): Promise<IStudyInfos[]> => {
    const filesInfos = await getFilesInfos(es, fileIds);
    const studiesInfo: IStudyInfos[] = [];
    for (const fileInfos of filesInfos) {
        const studyInfo = studiesInfo.find(study => study.study_name === fileInfos.study_name);
        if (studyInfo) {
            studyInfo.files.push(fileInfos);
        } else {
            studiesInfo.push({
                study_code: fileInfos.study_code,
                study_name: fileInfos.study_name,
                files: [fileInfos],
                access_limitations: fileInfos.access_limitations,
                access_requirements: fileInfos.access_requirements,
                access_authority: fileInfos.access_authority,
            });
        }
    }
    return studiesInfo;
};

export default getStudiesInfos;
