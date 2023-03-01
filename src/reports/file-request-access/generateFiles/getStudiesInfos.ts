import { Client } from '@elastic/elasticsearch';
import { executeSearch } from '../../../utils/esUtils';
import { esFileIndex } from '../../../config/env';

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

const getAccessAuthority = (study_code: string): string => {
    if (study_code?.toLowerCase() === 'cag') {
        return 'www.cag/acces.ca';
    }
    return 'NA';
};

const getFilesInfos = async (es: Client, fileIds: string[]): Promise<IFileInfos[]> => {
    const esRequest = {
        query: { bool: { must: [{ terms: { file_id: fileIds, boost: 0 } }] } },
        _source: [
            'file_id',
            'study.study_code',
            'study.name',
            'participants.submitter_participant_id',
            'participants.participant_id',
            'file_name',
            'data_type',
            'file_format',
            'study.data_access_codes.access_limitations',
            'study.data_access_codes.access_requirements',
        ],
        sort: [{ file_id: { order: 'asc' } }],
        size: 10000,
    };
    const results = await executeSearch(es, esFileIndex, esRequest);
    const hits = results?.body?.hits?.hits || [];
    const files = hits.map(hit => hit._source);
    const filesInfos = files.map(file => ({
        study_code: file.study.study_code,
        study_name: file.study.name,
        submitter_participant_ids: file.participants.map(p => p.submitter_participant_id).join(', '),
        participant_ids: file.participants.map(p => p.participant_id).join(', '),
        file_name: file.file_name,
        data_type: file.data_type,
        file_format: file.file_format,
        access_limitations: file.study.data_access_codes?.access_limitations.map(v => v).join(', '),
        access_requirements: file.study.data_access_codes?.access_requirements.map(v => v).join(', '),
        access_authority: file.study.data_access_codes?.access_authority || getAccessAuthority(file.study.study_code),
    }));
    return filesInfos;
};

export interface IStudyInfos {
    study_code: string;
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
        const studyInfo = studiesInfo.find(study => study.study_code === fileInfos.study_code);
        if (studyInfo) {
            studyInfo.files.push(fileInfos);
        } else {
            studiesInfo.push({
                study_code: fileInfos.study_code,
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