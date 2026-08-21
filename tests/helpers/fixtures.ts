export const makeFileSource = (overrides: Record<string, any> = {}) => ({
    file_id: 'F1',
    file_name: 'file1.cram',
    file_size: 100,
    file_format: 'CRAM',
    data_category: 'Sequencing',
    data_type: 'Aligned Reads',
    sequencing_experiment: { experimental_strategies: ['WGS'], bio_informatic_analysis: 'A1' },
    study: { name: 'Study A', study_code: 'SA' },
    participants: [{ participant_id: 'P1', family_id: 'FAM1' }],
    biospecimens: [{ sample_id: 'S1', biospecimen_id: 'B1' }],
    ...overrides,
});

export const makeHitsBody = (sources: Record<string, any>[]) => ({
    hits: {
        total: { value: sources.length },
        hits: sources.map(_source => ({ _source })),
    },
});
