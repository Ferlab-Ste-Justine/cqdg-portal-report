import { QueryConfig, ReportConfig, SheetConfig } from '../types';

const biospecimens: SheetConfig = {
    sheetName: 'Biospecimens',
    root: 'files.biospecimens',
    columns: [
        { field: 'participant.participant_id', header: 'Participant ID' },
        { field: 'participant.submitter_participant_id', header: 'Submitter Participant ID' },
        { field: 'study.name', header: 'Study Name' },
        { field: 'study.study_code', header: 'Study Code' },
        { field: 'sample_id', header: 'Sample ID' },
        { field: 'submitter_sample_id', header: 'Submitter Sample ID' },
        { field: 'sample_type', header: 'Sample Type' },
        { field: 'biospecimen_id', header: 'Biospecimen ID' },
        { field: 'submitter_biospecimen_id', header: 'Submitter Biospecimen ID' },
        { field: 'biospecimen_tissue_source', header: 'Biospecimen Tissue Source' },
        {
            field: 'age_biospecimen_collection',
            header: 'Age at Biospecimen Collection (Days)',
        },
    ],
    sort: [
        {
            sample_id: {
                order: 'asc',
            },
        },
    ],
};

const queryConfigs: QueryConfig = {
    indexName: 'biospecimen',
    alias: 'biospecimen_centric',
};

const sheetConfigs: SheetConfig[] = [biospecimens];

const reportConfig: ReportConfig = { queryConfigs, sheetConfigs };

export default reportConfig;
