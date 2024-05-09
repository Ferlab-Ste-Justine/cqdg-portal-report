import { Client } from '@elastic/elasticsearch';
import get from 'lodash/get';

import { ES_QUERY_MAX_SIZE } from '../../config/env';
import { executeSearch } from '../../utils/esUtils';
import { SheetConfig } from '../types';

/** this recursive func allow you to find nested array values */
const getValueRecursive = (file, fieldSplitedByDot, i = 0) => {
    const parent = fieldSplitedByDot[i];
    const child = fieldSplitedByDot[i + 1];
    if (Array.isArray(child)) {
        return getValueRecursive(file, fieldSplitedByDot, i + 1);
    }
    return file[parent].map(e => e[child])?.join(', ');
};

const getFilesInfo = (configColumns, sources): { key: string }[] =>
    sources.map(source =>
        configColumns
            .map(column => {
                const field = column.field;
                /** default case example: field = 'file_id' */
                let value = source[field];
                const fieldSplitedByDot = field?.split('.');
                if (fieldSplitedByDot?.length > 1) {
                    if (Array.isArray(source[fieldSplitedByDot[0]])) {
                        /** array case example: field = 'participants.participant_id' */
                        value = getValueRecursive(source, fieldSplitedByDot);
                    } else {
                        /** nested object case example: field = 'sequencing_experiment.experimental_strategy' */
                        value = get(source, field);
                    }
                }
                if (column.transform) {
                    value = column.transform(value);
                }
                return { [field]: value };
            })
            .reduce((a, b) => Object.assign(a, b), {}),
    );

/** generic function to prepare { key: value }[] from a config ES search friendly */
const getInfosByConfig = async (
    es: Client,
    config: SheetConfig,
    ids: string[],
    idField: string,
    esIndex: string,
    extraFields?: string[],
): Promise<{ filesInfos: { key: string }[]; filesInfosWithExtraFields: { key: string }[] }> => {
    const esRequest = {
        query: { bool: { must: [{ terms: { [idField]: ids, boost: 0 } }] } },
        _source: [...config.columns.map(e => e.field), ...(extraFields || [])],
        sort: config.sort,
        size: ES_QUERY_MAX_SIZE,
    };
    const results = await executeSearch(es, esIndex, esRequest);
    const hits = results?.body?.hits?.hits || [];
    const sources = hits.map(hit => hit._source);
    const configColumns = config.columns;
    const configColumnsWithExtraFields = [...config.columns, ...(extraFields?.map(field => ({ field })) || [])];
    const filesInfos = getFilesInfo(configColumns, sources);
    const filesInfosWithExtraFields = getFilesInfo(configColumnsWithExtraFields, sources);

    return { filesInfos, filesInfosWithExtraFields };
};

export default getInfosByConfig;
