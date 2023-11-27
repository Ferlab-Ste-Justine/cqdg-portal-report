import { QueryConfig, ReportConfig, SheetConfig } from '../../../reports/types';
import getAgeCategory from '../../../reports/utils/getAgeCategory';
import getConfigGlobal from '../../index';

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
            additionalFields: ['family_relationships.participant_id', 'family_relationships.submitter_participant_id'],
            transform: (values, row) => {
                const user = row?.family_relationships?.find(e => e.participant_id === row.participant_id);
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
        {
            field: 'age_at_recruitment',
            header: 'Age at Recruitment',
            transform: value => getAgeCategory(value),
        },
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
    root: 'phenotypes_tagged',
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
            additionalFields: ['family_relationships.participant_id', 'family_relationships.submitter_participant_id'],
            transform: (values, row) => {
                const user = row?.family_relationships?.find(e => e.participant_id === row.participant_id);
                return user?.relationship_to_proband;
            },
        },
        {
            field: 'phenotypes_tagged',
            header: 'Phenotype (HPO)',
            transform: (values: { name: string }) => values?.name,
        },
        {
            field: 'phenotypes_tagged.source_text',
            header: 'Phenotype (Source Text)',
        },
        {
            field: 'phenotypes_tagged.is_observed',
            header: 'Interpretation',
            transform: (observed: boolean | null) => {
                if (!observed) return;
                return observed ? 'Observed' : 'Not Observed';
            },
        },
        {
            field: 'phenotypes_tagged.age_at_event',
            header: 'Age at Phenotype',
            transform: value => getAgeCategory(value),
        },
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
            'phenotypes_tagged.age_at_event': {
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
            additionalFields: ['family_relationships.participant_id', 'family_relationships.submitter_participant_id'],
            transform: (values, row) => {
                const user = row?.family_relationships?.find(e => e.participant_id === row.participant_id);
                return user?.relationship_to_proband;
            },
        },
        { field: 'mondo_tagged.name', header: 'Diagnosis (MONDO)' },
        { field: 'icd_tagged.name', header: 'Diagnosis (ICD)' },
        { field: 'diagnoses.diagnosis_source_text', header: 'Diagnosis (Source Text)' },
        {
            field: 'diagnoses.age_at_diagnosis',
            header: 'Age at Diagnosis',
            transform: value => getAgeCategory(value),
        },
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
        {
            field: 'participant_id',
            header: 'Participant ID',
            additionalFields: ['family_relationships.participant_id'],
            transform: (values, row) => row?.family_relationships?.participant_id,
        },
        {
            field: 'submitter_participant_id',
            header: 'Submitter Participant ID',
            additionalFields: ['family_relationships.submitter_participant_id'],
            transform: (values, row) => row?.family_relationships.submitter_participant_id,
        },
        { field: 'family_relationships.family_id', header: 'Family ID' },
        { field: 'family_relationships.submitter_family_id', header: 'Submitter Family ID' },
        { field: 'family_relationships.focus_participant_id', header: 'Family Member ID' },
        { field: 'family_relationships.relationship_to_proband', header: 'Relationship to Proband' },
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
    ],
};

export const queryConfigs: QueryConfig = {
    indexName: 'participant',
    alias: 'participant_centric',
};

export const sheetConfigs: SheetConfig[] = [participants, phenotypes, diagnoses, familyRelationship];

const reportConfig: ReportConfig = { queryConfigs, sheetConfigs };

export default reportConfig;
