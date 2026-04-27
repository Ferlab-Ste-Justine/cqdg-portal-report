import { Client } from '@elastic/elasticsearch';
import get from 'lodash/get';

import { ES_QUERY_MAX_SIZE } from '../../config/env';
import { executeSearch } from '../../utils/esUtils';
import { SheetConfig } from '../types';

/** this recursive func allow you to find nested array values */
const getValueRecursive = (file: any, fieldSplitedByDot: string[], i = 0): string => {
    const parent = fieldSplitedByDot[i];
    const child = fieldSplitedByDot[i + 1];
    if (Array.isArray(child)) {
        return getValueRecursive(file, fieldSplitedByDot, i + 1);
    }
    return file[parent].map((e: any) => e[child])?.join(', ');
};

const getFilesInfo = (configColumns: any[], sources: any[]): { key: string }[] =>
    sources.map((source: any) =>
        configColumns
            .map((column: any) => {
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
            .reduce((a: any, b: any) => Object.assign(a, b), {}),
    );

/** generic function to prepare { key: value }[] from a config ES search friendly */
const getInfosByConfig = async (
    es: Client,
    config: SheetConfig,
    ids: string[],
    idField: string,
    esIndex: string,
    dedupField: string,
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
    const sources = hits.map((hit: any) => hit._source);
    // The ETL emits one row per (sample/file), so the same physical file can
    // appear multiple times under different `file_id`s. Dedupe on `dedupField`
    // (e.g. `file_name`) so the manifest doesn't list the same file twice.
    const dedupKey = dedupField;
    const seen = new Set<string>();
    const dedupedSources = sources.filter((source: any) => {
        const value = source[dedupKey];
        if (value === undefined || value === null) return true;
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
    const configColumns = config.columns;
    const configColumnsWithExtraFields = [...config.columns, ...(extraFields?.map(field => ({ field })) || [])];
    const filesInfos = getFilesInfo(configColumns, dedupedSources);
    const filesInfosWithExtraFields = getFilesInfo(configColumnsWithExtraFields, dedupedSources);

    return { filesInfos, filesInfosWithExtraFields };
};

export default getInfosByConfig;
