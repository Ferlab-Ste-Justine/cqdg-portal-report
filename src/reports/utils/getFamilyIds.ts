import { Client } from '@elastic/elasticsearch';

import getConfigGlobal from '../../config';
import { ES_QUERY_MAX_SIZE, esFileIndex } from '../../config/env';
import { executeSearch } from '../../utils/esUtils';

interface IFileInfo {
    data_type: string;
    family_id: string;
}

/** Get IFileInfo: files data_types and family_ids */
const getFilesInfo = async (fileIds: string[], es: Client): Promise<IFileInfo[]> => {
    const configGlobal = getConfigGlobal();
    const esRequest = {
        query: { bool: { must: [{ terms: { [configGlobal.file_id]: fileIds, boost: 0 } }] } },
        _source: [
            configGlobal.file_id,
            configGlobal.data_type,
            `${configGlobal.participants}.${configGlobal.family_id}`,
        ],
        sort: [{ [configGlobal.data_type]: { order: 'asc' } }],
        size: ES_QUERY_MAX_SIZE,
    };
    const results = await executeSearch(es, esFileIndex, esRequest);
    const hits = results?.body?.hits?.hits || [];
    const sources = hits.map(hit => hit._source);
    const filesInfos = [];
    sources?.forEach(source => {
        source[configGlobal.participants]?.forEach(participant => {
            if (
                participant[configGlobal.family_id] &&
                !filesInfos.find(
                    f =>
                        f[configGlobal.family_id] === participant[configGlobal.family_id] &&
                        f[configGlobal.data_type] === source[configGlobal.data_type],
                )
            ) {
                filesInfos.push({
                    data_type: source[configGlobal.data_type],
                    family_id: participant[configGlobal.family_id] || '',
                });
            }
        });
    });
    return filesInfos;
};

/** for each filesInfos iteration, get files from file.participants.family_id and file.data_type */
const getFilesIdsMatched = async (filesInfos: IFileInfo[], es: Client): Promise<string[]> => {
    const configGlobal = getConfigGlobal();
    const filesIdsMatched = [];
    const results = await Promise.all(
        filesInfos.map(info => {
            const esRequest = {
                query: {
                    bool: {
                        must: [
                            { terms: { [configGlobal.data_type]: [info.data_type], boost: 0 } },
                            {
                                nested: {
                                    path: [configGlobal.participants],
                                    query: {
                                        bool: {
                                            must: [
                                                {
                                                    match: {
                                                        [`${configGlobal.participants}.${configGlobal.family_id}`]: info.family_id,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
                _source: [configGlobal.file_id],
                size: ES_QUERY_MAX_SIZE,
            };
            return executeSearch(es, esFileIndex, esRequest);
        }),
    );

    for (const res of results) {
        const hits = res?.body?.hits?.hits || [];
        const sources = hits.map(hit => hit._source);
        filesIdsMatched.push(...sources.map(s => s[configGlobal.file_id]));
    }

    return filesIdsMatched;
};

/**
 *
 * @param es
 * @param fileIds
 */
const getFamilyIds = async (es: Client, fileIds: string[]): Promise<string[]> => {
    const filesInfos = await getFilesInfo(fileIds, es);
    const filesIdsMatched = await getFilesIdsMatched(filesInfos, es);
    const newFileIds = [...new Set([...fileIds, ...filesIdsMatched])];

    return newFileIds;
};

export default getFamilyIds;
