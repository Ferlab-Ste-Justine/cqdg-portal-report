import { SheetConfig } from '../../../reports/types';
import { formatFileSize } from '../../../utils/formatFileSize';

const config: SheetConfig = {
    sheetName: 'Files',
    root: 'file',
    columns: [
        { field: 'stable_file_id', header: 'File ID' },
        { field: 'file_name', header: 'File Name' },
        { field: 'file_size', header: 'File Size', transform: value => formatFileSize(value, { output: 'string' }) },
        { field: 'file_hash', header: 'Hash' },
        { field: 'data_category', header: 'Data Category' },
        { field: 'data_type', header: 'Data Type' },
        { field: 'file_format', header: 'File Format' },
        {
            field: 'sequencing_experiment.experimental_strategies',
            header: 'Experimental Strategy',
            transform: (value: string[] | string) => (Array.isArray(value) ? value.join(', ') : value),
        },
        { field: 'study.name', header: 'Study Name' },
        { field: 'participants.participant_id', header: 'Participant ID' },
        { field: 'biospecimens.sample_id', header: 'Sample ID' },
        { field: 'biospecimens.biospecimen_id', header: 'Biospecimen ID' },
        { field: 'participants.family_type', header: 'Participant Type' },
        { field: 'participants.family_id', header: 'Family ID' },
        { field: 'participants.submitter_participant_id', header: 'External Participant ID' },
        { field: 'biospecimens.submitter_sample_id', header: 'External Sample ID' },
        { field: 'biospecimens.submitter_biospecimen_id', header: 'External Biospecimen ID' },
        { field: 'sequencing_experiment.bio_informatic_analysis', header: 'Analysis ID' },
    ],
    sort: [{ stable_file_id: { order: 'asc' } }],
};

export default config;
