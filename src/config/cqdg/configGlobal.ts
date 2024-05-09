const configGlobal = {
    participant_id: 'participant_id',
    family_id: 'family_id',
    file_id: 'file_id',
    ferload_url: 'ferload_url',
    data_type: 'data_type',
    file_size: 'file_size',
    file_name: 'file_name',
    file_format: 'file_format',
    relates_to_file_id: 'relates_to.file_id',
    relates_to_file_name: 'relates_to.file_name',
    relates_to_file_format: 'relates_to.file_format',
    relates_to_file_size: 'relates_to.file_size',
    study: 'study',
    study_code: 'study_code',
    studyName: 'study.name',
    studyCode: 'study.study_code',
    name: 'name',
    participants: 'participants',
    submitter_participant_id: 'submitter_participant_id',
    data_access_codes: 'data_access_codes',
    access_limitations: 'access_limitations',
    access_requirements: 'access_requirements',
    fileManifestWantedFields: ['file_id', 'data_type', 'file_size', 'participants.participant_id'],
    contact: 'contact',
    value: 'value',
    fileRequestGetFilesInfoSource: [
        'file_id',
        'study.study_code',
        'study.name',
        'participants.submitter_participant_id',
        'participants.participant_id',
        'file_name',
        'data_type',
        'file_format',
        'study.data_access_codes.access_limitations',
        'study.data_access_codes.access_requirements',
        'study.contact.value',
    ],
    age_categories: [
        { key: 'A-antenatal', label: 'Antenatal', tooltip: 'Before birth' },
        { key: 'B-congenital', label: 'Congenital', tooltip: 'At birth' },
        { key: 'C-neonatal', label: 'Neonatal', tooltip: '< 28 days' },
        { key: 'D-infantile', label: 'Infantile', tooltip: '>= 28 days and < 1 year' },
        { key: 'E-childhood', label: 'Childhood', tooltip: '>= 1 year and < 5 years)' },
        { key: 'F-juvenile', label: 'Juvenile', tooltip: '>= 5 years and < 16 years' },
        { key: 'G-young adult', label: 'Young Adult', tooltip: '>= 16 years and < 40 years' },
        { key: 'H-middle age', label: 'Middle Age', tooltip: '>= 40 years and < 60 years' },
        { key: 'I-senior', label: 'Senior', tooltip: '>= 60 years' },
    ],
};

export default configGlobal;
