import { executeSearch } from '../../utils/esUtils';
import { Client } from '@elastic/elasticsearch';
import { esFileIndex } from '../../config/env';

interface IFileInfo {
    data_type: string;
    family_id: string;
}

/** Get IFileInfo: files data_types and family_ids */
const getFilesInfo = async (fileIds: string[], es: Client): Promise<IFileInfo[]> => {
    const esRequest = {
        query: { bool: { must: [{ terms: { file_id: fileIds, boost: 0 } }] } },
        _source: ['file_id', 'data_type', 'participants.participant_id', 'participants.family_id'],
        sort: [{ data_type: { order: 'asc' } }],
        size: 10000,
    };
    const results = await executeSearch(es, esFileIndex, esRequest);
    const hits = results?.body?.hits?.hits || [];
    const sources = hits.map(hit => hit._source);
    const filesInfos = [];
    sources.forEach(source => {
        source.participants.forEach(participant => {
            if (
                participant.family_id &&
                !filesInfos.find(f => f.family_id === participant.family_id && f.data_type === source.data_type)
            ) {
                filesInfos.push({
                    data_type: source.data_type,
                    family_id: participant.family_id || '',
                });
            }
        });
    });
    return filesInfos;
};

/** for each filesInfos iteration, get files from file.participants.family_id and file.data_type */
const getFilesIdsMatched = async (filesInfos: IFileInfo[], es: Client): Promise<string[]> => {
    const filesIdsMatched = [];
    const results = await Promise.all(
        filesInfos.map(info => {
            const esRequest = {
                query: {
                    bool: {
                        must: [
                            { terms: { data_type: [info.data_type], boost: 0 } },
                            {
                                nested: {
                                    path: 'participants',
                                    query: {
                                        bool: { must: [{ match: { 'participants.family_id': info.family_id } }] },
                                    },
                                },
                            },
                        ],
                    },
                },
                _source: ['file_id'],
                size: 10000,
            };
            return executeSearch(es, esFileIndex, esRequest);
        }),
    );

    for (const res of results) {
        const hits = res?.body?.hits?.hits || [];
        const sources = hits.map(hit => hit._source);
        filesIdsMatched.push(...sources.map(s => s.file_id));
    }

    return filesIdsMatched;
};

/**
 *
 * @param es
 * @param fileIds
 */
const generateFamilyIds = async (es: Client, fileIds: string[]): Promise<string[]> => {
    const filesInfos = await getFilesInfo(fileIds, es);
    const filesIdsMatched = await getFilesIdsMatched(filesInfos, es);
    const newFileIds = [...new Set([...fileIds, ...filesIdsMatched])];

    return newFileIds;
};

export default generateFamilyIds;