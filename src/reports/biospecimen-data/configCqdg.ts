import { QueryConfig, ReportConfig, SheetConfig } from '../types';

const biospecimens: SheetConfig = {
    sheetName: 'Biospecimens',
    root: 'files.biospecimens',
    columns: [
        { field: 'participant_id' },
        { field: 'submitter_participant_id' },
        { field: 'study.name', header: 'Study Name' },
        { field: 'study.study_code', header: 'Study Code' },
        { field: 'files.biospecimens.sample_id', header: 'Sample ID' },
        { field: 'files.biospecimens.submitter_sample_id', header: 'Submitter Sample ID' },
        { field: 'files.biospecimens.sample_type', header: 'Sample Type' },
        { field: 'files.biospecimens.fhir_id', header: 'Biospecimen ID' },
        { field: 'files.biospecimens.submitter_biospecimen_id', header: 'Submitter Biospecimen ID' },
        { field: 'files.biospecimens.biospecimen_tissue_source', header: 'Biospecimen Tissue Source' },
        {
            field: 'files.biospecimens.age_biospecimen_collection',
            header: 'Age at Biospecimen Collection (days)',
        },
    ],
    sort: [
        {
            'files.biospecimens.sample_id': {
                order: 'asc',
            },
        },
    ],
};

const queryConfigs: QueryConfig = {
    indexName: 'participant',
    alias: 'participant_centric',
};

const sheetConfigs: SheetConfig[] = [biospecimens];

const reportConfig: ReportConfig = { queryConfigs, sheetConfigs };

export default reportConfig;
