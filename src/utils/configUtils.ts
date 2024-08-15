import { ReportConfig, SheetConfig } from '../reports/types';
import { getExtendedConfigs } from './extendedMappingUtils';
import ExtendedReportConfigs from './extendedReportConfigs';
import ExtendedReportSheetConfigs from './extendedReportSheetConfigs';

/**
 * Decorates the raw reports configs with default values, values from arranger's project, etc...
 */
export const normalizeConfigs = async (
    accessToken: string,
    reportConfigs: ReportConfig,
): Promise<ExtendedReportConfigs> => {
    const sheets = await Promise.all(
        reportConfigs.sheetConfigs.map(sheetConfig =>
            normalizeSheetConfig(sheetConfig, accessToken, reportConfigs.queryConfigs.indexName),
        ),
    );
    return new ExtendedReportConfigs(reportConfigs, sheets);
};

const normalizeSheetConfig = async (
    sheetConfig: SheetConfig,
    accessToken: string,
    indexName: string,
): Promise<ExtendedReportSheetConfigs> => {
    const extendedConfigs = await getExtendedConfigs(accessToken, indexName);
    return new ExtendedReportSheetConfigs(sheetConfig, extendedConfigs);
};

export default normalizeConfigs;
