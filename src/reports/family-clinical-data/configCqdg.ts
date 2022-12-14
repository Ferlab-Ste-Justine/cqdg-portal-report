import { QueryConfig, ReportConfig, SheetConfig } from '../types';

const participants: SheetConfig = {
    sheetName: 'Participants',
    root: null,
    columns: [
        { field: 'participant_id', header: 'Participant ID' },
        { field: 'submitter_participant_id', header: 'Submitter Participant ID' },
        { field: 'familyRelationships.family_id', header: 'Family ID' },
        { field: 'familyRelationships.submitter_family_id', header: 'Submitter Family ID' },
        { field: 'familyRelationships.relationship_to_proband', header: 'Relationship to Proband' },
        { field: 'study.name', header: 'Study Name' },
        { field: 'study.study_code', header: 'Study Code' },
        { field: 'familyRelationships.family_type', header: 'Family Type' },
        { field: 'gender' },
        { field: 'ethnicity' },
        { field: 'vital_status', header: 'Vital Status' },
        { field: 'is_affected', header: 'Affected Status' },
        { field: 'age_at_recruitment', header: 'Age at Recruitment (Days)' },
    ],
    sort: [
        {
            'familyRelationships.family_id': {
                order: 'asc',
            },
        },
        {
            participant_id: {
                order: 'asc',
            },
        },
    ],
};

const phenotypes: SheetConfig = {
    sheetName: 'Phenotypes',
    root: 'phenotype',
    columns: [
        { field: 'participant_id', header: 'Participant ID' },
        { field: 'submitter_participant_id', header: 'Submitter Participant ID' },
        { field: 'familyRelationships.family_id', header: 'Family ID' },
        { field: 'familyRelationships.submitter_family_id', header: 'Submitter Family ID' },
        { field: 'familyRelationships.relationship_to_proband', header: 'Relationship to Proband' },
        {
            field: 'observed_phenotype_tagged.name',
            additionalFields: ['non_observed_phenotype_tagged.name'],
            header: 'Phenotype (HPO)',
            transform: (value, row) => {
                if (!row || (!row.observed_phenotype_tagged?.name && !row.non_observed_phenotype_tagged?.name)) {
                    return;
                }
                return value || row.non_observed_phenotype_tagged.name;
            },
        },
        {
            field: 'observed_phenotype_tagged.source_text',
            additionalFields: ['non_observed_phenotype_tagged.source_text'],
            header: 'Phenotype (Source Text)',
            transform: (value, row) => {
                if (
                    !row ||
                    (!row.observed_phenotype_tagged?.source_text && !row.non_observed_phenotype_tagged?.source_text)
                ) {
                    return;
                }
                return value || row.non_observed_phenotype_tagged.name;
            },
        },
        {
            field: 'observed_phenotype_tagged.name',
            additionalFields: ['non_observed_phenotype_tagged.name'],
            header: 'Interpretation',
            transform: (value: string, row) => {
                if (value) {
                    return value;
                } else {
                    if (row.non_observed_phenotype_tagged) {
                        return 'Not Observed';
                    }
                }
            },
        },
        {
            field: 'observed_phenotype_tagged.age_at_event',
            header: 'Age at Phenotype (Days)',
        },
    ],
    sort: [
        {
            'familyRelationships.family_id': {
                order: 'asc',
            },
        },
        {
            participant_id: {
                order: 'asc',
            },
        },
        {
            'observed_phenotype_tagged.age_at_event': {
                order: 'desc',
            },
        },
        {
            'non_observed_phenotype_tagged.age_at_event': {
                order: 'desc',
            },
        },
    ],
};

const diagnoses: SheetConfig = {
    sheetName: 'Diagnoses',
    root: 'diagnosis',
    columns: [
        { field: 'participant_id', header: 'Participant ID' },
        { field: 'submitter_participant_id', header: 'Submitter Participant ID' },
        { field: 'familyRelationships.family_id', header: 'Family ID' },
        { field: 'familyRelationships.submitter_family_id', header: 'Submitter Family ID' },
        { field: 'familyRelationships.relationship_to_proband', header: 'Relationship to Proband' },
        { field: 'mondo_tagged.name', header: 'Diagnosis (MONDO)' },
        { field: 'icd_tagged.name', header: 'Diagnosis (ICD)' },
        { field: 'diagnoses.diagnosis_source_text', header: 'Diagnosis (Source Text)' },
        { field: 'diagnoses.age_at_diagnosis', header: 'Age at Diagnosis (Days)' },
    ],
    sort: [
        {
            'familyRelationships.family_id': {
                order: 'asc',
            },
        },
        {
            participant_id: {
                order: 'asc',
            },
        },
        {
            'diagnoses.age_at_diagnosis': {
                order: 'desc',
            },
        },
    ],
};

export const queryConfigs: QueryConfig = {
    indexName: 'participant',
    alias: 'participant_centric',
};

export const sheetConfigs: SheetConfig[] = [participants, phenotypes, diagnoses];

const reportConfig: ReportConfig = { queryConfigs, sheetConfigs };

export default reportConfig;
