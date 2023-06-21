import { buildQuery } from '@arranger/middleware';
import { Client } from '@elastic/elasticsearch';

import { ES_QUERY_MAX_SIZE } from '../../config/env';
import { getExtendedConfigs, getNestedFields } from '../../utils/arrangerUtils';
import { executeSearch } from '../../utils/esUtils';
import ExtendedReportConfigs from '../../utils/extendedReportConfigs';
import { Sqon } from '../../utils/setsTypes';
import { resolveSetsInSqon } from '../../utils/sqonUtils';
import getConfig from './getConfig';

/**
 * Generate a sqon from the family_id of all the participants in the given `sqon`.
 * @param {object} es - an `elasticsearch.Client` instance.
 * @param {string} projectId - the id of the arranger project.
 * @param {object} sqon - the sqon used to filter the results.
 * @param {object} normalizedConfigs - the normalized report configuration.
 * @param {string} userId - the user id.
 * @param {string} accessToken - the user access token.
 * @returns {object} - A sqon of all the `family_id`.
 */
const generateFamilySqon = async (
    es: Client,
    projectId: string,
    sqon: Sqon,
    normalizedConfigs: ExtendedReportConfigs,
    userId: string,
    accessToken: string,
): Promise<Sqon> => {
    const extendedConfig = await getExtendedConfigs(es, projectId, normalizedConfigs.indexName);
    const nestedFields = getNestedFields(extendedConfig);
    const newSqon = await resolveSetsInSqon(sqon, userId, accessToken);
    const query = buildQuery({ nestedFields, filters: newSqon });
    const configGlobal = getConfig().global;

    const participantIds =
        (sqon.content || []).filter(e => (e.content?.field || '') === configGlobal.participant_id)[0]?.content.value ||
        [];

    const esRequest = {
        query,
        aggs: { [configGlobal.family_id]: { terms: { field: configGlobal.family_id, size: ES_QUERY_MAX_SIZE } } },
    };
    const results = await executeSearch(es, normalizedConfigs.alias, esRequest);
    const buckets = results?.body?.aggregations
        ? results?.body?.aggregations[configGlobal.family_id]?.buckets || []
        : [];
    const familyIds = buckets.map(b => b.key);

    return {
        op: 'or',
        content: [
            { op: 'in', content: { field: configGlobal.family_id, value: familyIds } },
            { op: 'in', content: { field: configGlobal.participant_id, value: participantIds } },
        ],
    };
};

export default generateFamilySqon;
