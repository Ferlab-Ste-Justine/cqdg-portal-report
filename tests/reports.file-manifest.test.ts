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
            size: 300,
        });

        const variants = res.body.find((x: any) => x.value === 'Variants');
        expect(variants).to.deep.include({ nb_participants: 1, nb_files: 1, size: 50 });
    });

    it('returns an empty array when no files match', async () => {
        testApp = buildTestApp({ fetch: async () => extendedMappingResponse });
        const res = await request(testApp.app)
            .post('/reports/file-manifest/stats')
            .send({ sqon: { op: 'and', content: [] } });
        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal([]);
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

    it('dedupes rows when the same file_id appears multiple times (shared across samples)', async () => {
        const files = [
            makeFileSource({ file_id: 'F1', file_name: 'shared.cram', biospecimens: [{ sample_id: 'S1' }] }),
            makeFileSource({ file_id: 'F1', file_name: 'shared.cram', biospecimens: [{ sample_id: 'S2' }] }),
            makeFileSource({ file_id: 'F2', file_name: 'other.cram' }),
        ];

        const res = await runManifestRequest(files);
        expect(res.status).to.equal(200);

        const lines = res.text.trim().split('\n');
        expect(lines).to.have.lengthOf(3);

        const fileIdColumn = lines.slice(1).map(l => l.split('\t')[0]);
        expect(fileIdColumn).to.deep.equal(['F1', 'F2']);
    });
});
