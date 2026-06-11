import { expect } from 'chai';
import request from 'supertest';

import { buildTestApp, TestApp } from './helpers/buildTestApp';
import { makeFileSource, makeHitsBody } from './helpers/fixtures';

const extendedMappingResponse = {
    status: 200,
    json: async () => ({ extendedMapping: [] }),
};

describe('POST /reports/file-manifest/stats', () => {
    let testApp: TestApp;

    afterEach(() => testApp?.restore());

    it('groups files by data_type with unique participants and totals', async () => {
        const files = [
            makeFileSource({
                file_id: 'F1',
                data_type: 'Aligned Reads',
                file_size: 100,
                participants: [{ participant_id: 'P1' }],
            }),
            makeFileSource({
                file_id: 'F2',
                data_type: 'Aligned Reads',
                file_size: 200,
                participants: [{ participant_id: 'P1' }, { participant_id: 'P2' }],
            }),
            makeFileSource({
                file_id: 'F3',
                data_type: 'Variants',
                file_size: 50,
                participants: [{ participant_id: 'P3' }],
            }),
        ];

        testApp = buildTestApp({
            esSearch: () => makeHitsBody(files),
            fetch: async () => extendedMappingResponse,
        });

        const res = await request(testApp.app)
            .post('/reports/file-manifest/stats')
            .send({ sqon: { op: 'and', content: [] } });

        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('array').with.lengthOf(2);

        const aligned = res.body.find((x: any) => x.value === 'Aligned Reads');
        expect(aligned).to.deep.include({
            key: 'Aligned Reads',
            value: 'Aligned Reads',
            nb_participants: 2,
            nb_files: 2,
            nb_files_skipped: 0,
            size: 300,
        });

        const variants = res.body.find((x: any) => x.value === 'Variants');
        expect(variants).to.deep.include({ nb_participants: 1, nb_files: 1, nb_files_skipped: 0, size: 50 });
    });

    it('returns an empty array when no files match', async () => {
        testApp = buildTestApp({ fetch: async () => extendedMappingResponse });
        const res = await request(testApp.app)
            .post('/reports/file-manifest/stats')
            .send({ sqon: { op: 'and', content: [] } });
        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal([]);
    });

    it('dedupes files sharing a stable_file_id before computing nb_files and size', async () => {
        const files = [
            makeFileSource({
                file_id: 'F1',
                stable_file_id: 'FH1',
                data_type: 'Aligned Reads',
                file_size: 100,
                participants: [{ participant_id: 'P1' }],
            }),
            makeFileSource({
                file_id: 'F2',
                stable_file_id: 'FH1',
                data_type: 'Aligned Reads',
                file_size: 100,
                participants: [{ participant_id: 'P1' }],
            }),
            makeFileSource({
                file_id: 'F3',
                stable_file_id: 'FH2',
                data_type: 'Aligned Reads',
                file_size: 200,
                participants: [{ participant_id: 'P2' }],
            }),
        ];

        testApp = buildTestApp({
            esSearch: () => makeHitsBody(files),
            fetch: async () => extendedMappingResponse,
        });

        const res = await request(testApp.app)
            .post('/reports/file-manifest/stats')
            .send({ sqon: { op: 'and', content: [] } });

        expect(res.status).to.equal(200);
        const aligned = res.body.find((x: any) => x.value === 'Aligned Reads');
        expect(aligned).to.deep.include({
            nb_files: 2,
            nb_files_skipped: 1,
            size: 300,
            nb_participants: 2,
        });
    });

    it('does not drop a data_type when its files share a stable_file_id with files of another data_type', async () => {
        const files = [
            makeFileSource({
                file_id: 'F1',
                stable_file_id: 'shared-stable-id',
                data_type: 'Aligned Reads',
                file_size: 100,
                participants: [{ participant_id: 'P1' }],
            }),
            makeFileSource({
                file_id: 'F2',
                stable_file_id: 'shared-stable-id',
                data_type: 'Quality Control Metrics',
                file_size: 50,
                participants: [{ participant_id: 'P1' }],
            }),
            makeFileSource({
                file_id: 'F3',
                stable_file_id: 'shared-stable-id',
                data_type: 'Structural Variations (SVs)',
                file_size: 25,
                participants: [{ participant_id: 'P1' }],
            }),
        ];

        testApp = buildTestApp({
            esSearch: () => makeHitsBody(files),
            fetch: async () => extendedMappingResponse,
        });

        const res = await request(testApp.app)
            .post('/reports/file-manifest/stats')
            .send({ sqon: { op: 'and', content: [] } });

        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('array').with.lengthOf(3);

        const dataTypes = res.body.map((x: any) => x.value).sort();
        expect(dataTypes).to.deep.equal([
            'Aligned Reads',
            'Quality Control Metrics',
            'Structural Variations (SVs)',
        ]);

        for (const entry of res.body) {
            expect(entry).to.deep.include({ nb_files: 1, nb_files_skipped: 0 });
        }
    });
});

describe('POST /reports/file-manifest', () => {
    let testApp: TestApp;

    afterEach(() => testApp?.restore());

    const runManifestRequest = (files: Record<string, any>[]) => {
        let call = 0;
        testApp = buildTestApp({
            esSearch: () => {
                call += 1;
                if (call === 1) {
                    return makeHitsBody(files.map(f => ({ stable_file_id: f.stable_file_id })));
                }
                return makeHitsBody(files);
            },
            fetch: async () => extendedMappingResponse,
        });
        return request(testApp.app)
            .post('/reports/file-manifest')
            .send({ sqon: { op: 'and', content: [] }, filename: 'manifest' });
    };

    it('streams a TSV showing the stable_file_id (FH) in the File ID column, never the FI file_id', async () => {
        const files = [
            makeFileSource({ file_id: 'FI1', stable_file_id: 'FH1', file_name: 'a.cram' }),
            makeFileSource({ file_id: 'FI2', stable_file_id: 'FH2', file_name: 'b.cram' }),
        ];

        const res = await runManifestRequest(files);
        expect(res.status).to.equal(200);
        expect(res.headers['content-disposition']).to.include('manifest.tsv');

        const lines = res.text.trim().split('\n');
        expect(lines[0]).to.include('File ID');
        expect(lines[0]).to.include('File Name');

        expect(lines).to.have.lengthOf(3);
        const fileIdColumn = lines.slice(1).map(l => l.split('\t')[0]);
        expect(fileIdColumn).to.deep.equal(['FH1', 'FH2']);
        expect(res.text).to.not.include('FI1');
        expect(res.text).to.not.include('FI2');
    });

    it('dedupes rows that share a stable_file_id (same physical file, different sample-scoped file_id)', async () => {
        const files = [
            makeFileSource({ file_id: 'FI1', stable_file_id: 'FH1', biospecimens: [{ sample_id: 'S1' }] }),
            makeFileSource({ file_id: 'FI2', stable_file_id: 'FH1', biospecimens: [{ sample_id: 'S2' }] }),
            makeFileSource({ file_id: 'FI3', stable_file_id: 'FH2' }),
        ];

        const res = await runManifestRequest(files);
        expect(res.status).to.equal(200);

        const lines = res.text.trim().split('\n');
        expect(lines).to.have.lengthOf(3);

        const fileIdColumn = lines.slice(1).map(l => l.split('\t')[0]);
        expect(fileIdColumn).to.deep.equal(['FH1', 'FH2']);
    });

    it('keeps a row when its stable_file_id matches another row with a different data_type', async () => {
        const files = [
            makeFileSource({ stable_file_id: 'FH-shared', data_type: 'Aligned Reads' }),
            makeFileSource({ stable_file_id: 'FH-shared', data_type: 'Quality Control Metrics' }),
        ];

        const res = await runManifestRequest(files);
        expect(res.status).to.equal(200);

        const lines = res.text.trim().split('\n');
        expect(lines).to.have.lengthOf(3);

        const fileIdColumn = lines.slice(1).map(l => l.split('\t')[0]);
        expect(fileIdColumn).to.deep.equal(['FH-shared', 'FH-shared']);
    });

    it('keeps every row when stable_file_id is missing (no dedup without a stable id)', async () => {
        const files = [
            makeFileSource({ file_name: 'a.cram' }),
            makeFileSource({ file_name: 'a.cram' }),
            makeFileSource({ file_name: 'b.cram', stable_file_id: '' }),
        ];

        const res = await runManifestRequest(files);
        expect(res.status).to.equal(200);

        const lines = res.text.trim().split('\n');
        expect(lines).to.have.lengthOf(4);

        const fileNameColumn = lines.slice(1).map(l => l.split('\t')[1]);
        expect(fileNameColumn).to.deep.equal(['a.cram', 'a.cram', 'b.cram']);
    });

    it('emits the CRAI sub-row with the related stable id and never an FI file_id', async () => {
        const files = [
            makeFileSource({
                file_id: 'FI1',
                stable_file_id: 'FH1',
                file_name: 'sample.cram',
                file_format: 'CRAM',
                relates_to: {
                    file_id: 'FI1-crai',
                    stable_file_id: 'FH1-crai',
                    file_name: 'sample.crai',
                    file_format: 'CRAI',
                    file_size: 10,
                },
            }),
        ];

        const res = await runManifestRequest(files);
        expect(res.status).to.equal(200);

        const lines = res.text.trim().split('\n');
        expect(lines).to.have.lengthOf(3); // header + CRAM row + CRAI row

        const fileIdColumn = lines.slice(1).map(l => l.split('\t')[0]);
        expect(fileIdColumn).to.deep.equal(['FH1', 'FH1-crai']);
        expect(res.text).to.not.include('FI1-crai');
        expect(res.text).to.not.include('FI1');
    });

    it('resolves a saved set by querying ES on stable_file_id with the set FH ids', async () => {
        const files = [
            makeFileSource({ file_id: 'FI1', stable_file_id: 'FH1', file_name: 'a.cram' }),
            makeFileSource({ file_id: 'FI2', stable_file_id: 'FH2', file_name: 'b.cram' }),
        ];

        let capturedQuery: any;
        testApp = buildTestApp({
            esSearch: (params: { index: string; body: any }) => {
                capturedQuery = params.body?.query;
                return makeHitsBody(files);
            },
            fetch: async (url: string) => {
                if (url.includes('user-sets')) {
                    return { status: 200, json: async () => ({ content: { ids: ['FH1', 'FH2'] } }) };
                }
                return extendedMappingResponse;
            },
        });

        const res = await request(testApp.app)
            .post('/reports/file-manifest/set-123')
            .send({ filename: 'manifest' });

        expect(res.status).to.equal(200);

        // the ES terms filter is keyed on stable_file_id, using the FH ids stored in the set
        const terms = capturedQuery?.bool?.must?.[0]?.terms;
        expect(terms).to.have.property('stable_file_id');
        expect(terms.stable_file_id).to.deep.equal(['FH1', 'FH2']);

        // the manifest is built from those set ids
        const lines = res.text.trim().split('\n');
        const fileIdColumn = lines.slice(1).map(l => l.split('\t')[0]);
        expect(fileIdColumn).to.deep.equal(['FH1', 'FH2']);
    });
});
