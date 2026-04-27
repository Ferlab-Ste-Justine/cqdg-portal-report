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

    it('dedupes files sharing a file_hash before computing nb_files and size', async () => {
        // F1 and F2 are the same physical file emitted by the ETL under two
        // different file_ids - without dedup the stats would report 3 files /
        // 400 bytes instead of 2 files / 300 bytes for "Aligned Reads".
        const files = [
            makeFileSource({
                file_id: 'F1',
                file_hash: 'h1',
                data_type: 'Aligned Reads',
                file_size: 100,
                participants: [{ participant_id: 'P1' }],
            }),
            makeFileSource({
                file_id: 'F2',
                file_hash: 'h1',
                data_type: 'Aligned Reads',
                file_size: 100,
                participants: [{ participant_id: 'P1' }],
            }),
            makeFileSource({
                file_id: 'F3',
                file_hash: 'h2',
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
});

describe('POST /reports/file-manifest', () => {
    let testApp: TestApp;

    afterEach(() => testApp?.restore());

    const runManifestRequest = (files: Record<string, any>[]) => {
        let call = 0;
        testApp = buildTestApp({
            esSearch: () => {
                // 1st call: getFilesFromSqon (wantedFields: file_id only)
                // 2nd+ calls: getInfosByConfig (full source)
                call += 1;
                if (call === 1) {
                    return makeHitsBody(files.map(f => ({ file_id: f.file_id })));
                }
                return makeHitsBody(files);
            },
            fetch: async () => extendedMappingResponse,
        });
        return request(testApp.app)
            .post('/reports/file-manifest')
            .send({ sqon: { op: 'and', content: [] }, filename: 'manifest' });
    };

    it('streams a TSV with a header row and one row per file', async () => {
        const files = [
            makeFileSource({ file_id: 'F1', file_name: 'a.cram' }),
            makeFileSource({ file_id: 'F2', file_name: 'b.cram' }),
        ];

        const res = await runManifestRequest(files);
        expect(res.status).to.equal(200);
        expect(res.headers['content-disposition']).to.include('manifest.tsv');

        const lines = res.text.trim().split('\n');
        expect(lines[0]).to.include('File ID');
        expect(lines[0]).to.include('File Name');

        expect(lines).to.have.lengthOf(3);
        expect(lines[1]).to.include('F1');
        expect(lines[2]).to.include('F2');
    });

    it('dedupes rows when the ETL emits the same physical file under different file_ids', async () => {
        // The ETL emits one row per (sample/file), so the same physical file
        // can appear under several distinct file_ids that share a file_hash.
        // The manifest should list each physical file once.
        const files = [
            makeFileSource({ file_id: 'F1', file_hash: 'hash-1', biospecimens: [{ sample_id: 'S1' }] }),
            makeFileSource({ file_id: 'F2', file_hash: 'hash-1', biospecimens: [{ sample_id: 'S2' }] }),
            makeFileSource({ file_id: 'F3', file_hash: 'hash-2' }),
        ];

        const res = await runManifestRequest(files);
        expect(res.status).to.equal(200);

        const lines = res.text.trim().split('\n');
        // 1 header + 2 deduped data rows (F1 wins over F2 because they share the same file_hash)
        expect(lines).to.have.lengthOf(3);

        const fileIdColumn = lines.slice(1).map(l => l.split('\t')[0]);
        expect(fileIdColumn).to.deep.equal(['F1', 'F3']);
    });

    it('keeps every row when file_hash is missing (no dedup without a hash)', async () => {
        // Files without a computed hash should pass through untouched, even if
        // other fields collide — the dedup only kicks in when file_hash is set.
        const files = [
            makeFileSource({ file_id: 'F1', file_name: 'a.cram' }),
            makeFileSource({ file_id: 'F2', file_name: 'a.cram' }),
            makeFileSource({ file_id: 'F3', file_name: 'b.cram', file_hash: '' }),
        ];

        const res = await runManifestRequest(files);
        expect(res.status).to.equal(200);

        const lines = res.text.trim().split('\n');
        // 1 header + 3 data rows, none deduped
        expect(lines).to.have.lengthOf(4);
        const fileIdColumn = lines.slice(1).map(l => l.split('\t')[0]);
        expect(fileIdColumn).to.deep.equal(['F1', 'F2', 'F3']);
    });
});
