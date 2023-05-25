import { QueryConfig, ReportConfig, SheetConfig } from '../types';

const participants: SheetConfig = {
    sheetName: 'Participants',
    root: null,
    columns: [
        { field: 'participant_id', header: 'Participant ID' },
        { field: 'submitter_participant_id', header: 'Submitter Participant ID' },
        {
            field: 'family_relationships.family_id',
            header: 'Family ID',
            transform: values => (values ? [...new Set(values)] : []),
        },
        {
            field: 'family_relationships.submitter_family_id',
            header: 'Submitter Family ID',
            transform: values => (values ? [...new Set(values)] : []),
        },
        {
            field: 'family_relationships.relationship_to_proband',
            header: 'Relationship to Proband',
            additionalFields: ['family_relationships.submitter_participant_id'],
            transform: (values, row) => {
                const user = row?.family_relationships?.find(e => e.submitter_participant_id === row.participant_id);
                return user?.relationship_to_proband;
            },
        },
        { field: 'study.name', header: 'Study Name' },
        { field: 'study.study_code', header: 'Study Code' },
        {
            field: 'family_relationships.family_type',
            header: 'Family Type',
            transform: values => (values ? [...new Set(values)] : []),
        },
        { field: 'gender' },
        { field: 'ethnicity' },
        { field: 'vital_status', header: 'Vital Status' },
        { field: 'is_affected', header: 'Affected Status' },
        { field: 'age_at_recruitment', header: 'Age at Recruitment (Days)' },
    ],
    sort: [
        {
            participant_id: {
                order: 'asc',
            },
        },
    ],
};

const phenotypes: SheetConfig = {
    sheetName: 'Phenotypes',
    root: 'observed_phenotype_tagged',
    columns: [
        { field: 'participant_id', header: 'Participant ID' },
        { field: 'submitter_participant_id', header: 'Submitter Participant ID' },
        {
            field: 'family_relationships.family_id',
            header: 'Family ID',
            transform: values => (values ? [...new Set(values)] : []),
        },
        {
            field: 'family_relationships.submitter_family_id',
            header: 'Submitter Family ID',
            transform: values => (values ? [...new Set(values)] : []),
        },
        {
            field: 'family_relationships.relationship_to_proband',
            header: 'Relationship to Proband',
            additionalFields: ['family_relationships.submitter_participant_id'],
            transform: (values, row) => {
                const user = row?.family_relationships?.find(e => e.submitter_participant_id === row.participant_id);
                return user?.relationship_to_proband;
            },
        },
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
        { field: 'observed_phenotype_tagged.age_at_event', header: 'Age at Phenotype (Days)' },
    ],
    sort: [
        {
            'family_relationships.family_id': {
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
    root: 'mondo_tagged',
    columns: [
        { field: 'participant_id', header: 'Participant ID' },
        { field: 'submitter_participant_id', header: 'Submitter Participant ID' },
        {
            field: 'family_relationships.family_id',
            header: 'Family ID',
            transform: values => (values ? [...new Set(values)] : []),
        },
        {
            field: 'family_relationships.submitter_family_id',
            header: 'Submitter Family ID',
            transform: values => (values ? [...new Set(values)] : []),
        },
        {
            field: 'family_relationships.relationship_to_proband',
            header: 'Relationship to Proband',
            additionalFields: ['family_relationships.submitter_participant_id'],
            transform: (values, row) => {
                const user = row?.family_relationships?.find(e => e.submitter_participant_id === row.participant_id);
                return user?.relationship_to_proband;
            },
        },
        { field: 'mondo_tagged.name', header: 'Diagnosis (MONDO)' },
        { field: 'icd_tagged.name', header: 'Diagnosis (ICD)' },
        { field: 'diagnoses.diagnosis_source_text', header: 'Diagnosis (Source Text)' },
        { field: 'diagnoses.age_at_diagnosis', header: 'Age at Diagnosis (Days)' },
    ],
    sort: [
        {
            'family_relationships.family_id': {
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

const familyRelationship: SheetConfig = {
    sheetName: 'Family Relationship',
    root: 'family_relationships',
    columns: [
        { field: 'participant_id', header: 'Participant ID' },
        { field: 'submitter_participant_id', header: 'Submitter Participant ID' },
        { field: 'family_relationships.family_id', header: 'Family ID' },
        { field: 'family_relationships.submitter_family_id', header: 'Submitter Family ID' },
        { field: 'family_relationships.focus_participant_id', header: 'Family Member ID' },
        { field: 'family_relationships.relationship_to_proband', header: 'Relationship to Proband' },
    ],
    sort: [
        { participant_id: 'asc' },
        {
            'family_relationships.family_id': {
                order: 'asc',
            },
        },
    ],
};

export const queryConfigs: QueryConfig = {
    indexName: 'participant',
    alias: 'participant_centric',
};

export const sheetConfigs: SheetConfig[] = [participants, phenotypes, diagnoses, familyRelationship];

const reportConfig: ReportConfig = { queryConfigs, sheetConfigs };

export default reportConfig;
