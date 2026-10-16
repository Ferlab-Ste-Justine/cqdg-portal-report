import { expect } from 'chai';
import request from 'supertest';
import tar from 'tar';

import { buildTestApp, TestApp } from './helpers/buildTestApp';
import { makeHitsBody } from './helpers/fixtures';

const extendedMappingResponse = {
    status: 200,
    json: async () => ({ extendedMapping: [] }),
};

const makeFileForAccess = (overrides: Record<string, any> = {}) => ({
    file_id: 'F1',
    file_name: 'f1.cram',
    data_type: 'Aligned Reads',
    file_format: 'CRAM',
    study: {
        study_code: 'SA',
        name: 'Study A',
        data_access_codes: { access_limitations: ['NRES'], access_requirements: ['IRB'] },
        access_authority: { value: 'contact@example.org' },
    },
    participants: [{ participant_id: 'P1', submitter_participant_id: 'SP1' }],
    ...overrides,
});

const extractTarGz = (body: Buffer): Promise<Record<string, string>> =>
    new Promise((resolve, reject) => {
        const entries: Record<string, string> = {};
        const parser = new tar.Parse();
        parser.on('entry', entry => {
            const chunks: Buffer[] = [];
            entry.on('data', c => chunks.push(c));
            entry.on('end', () => {
                entries[entry.path] = Buffer.concat(chunks).toString('utf8');
            });
        });
        parser.on('end', () => resolve(entries));
        parser.on('error', reject);
        parser.end(body);
    });

describe('POST /reports/file-request-access/stats', () => {
    let testApp: TestApp;

    afterEach(() => testApp?.restore());

    it('groups files by study_code with per-study counts', async () => {
        const files = [
            makeFileForAccess({ file_id: 'F1', study: { study_code: 'SA', name: 'Study A' } }),
            makeFileForAccess({ file_id: 'F2', study: { study_code: 'SA', name: 'Study A' } }),
            makeFileForAccess({ file_id: 'F3', study: { study_code: 'SB', name: 'Study B' } }),
        ];

        testApp = buildTestApp({
            esSearch: () => makeHitsBody(files),
            fetch: async () => extendedMappingResponse,
        });

        const res = await request(testApp.app)
            .post('/reports/file-request-access/stats')
            .send({ sqon: { op: 'and', content: [] } });

        expect(res.status).to.equal(200);
        expect(res.body)
            .to.be.an('array')
            .with.lengthOf(2);
        const sa = res.body.find((x: any) => x.key === 'SA');
        const sb = res.body.find((x: any) => x.key === 'SB');
        expect(sa).to.deep.equal({ key: 'SA', study_name: 'Study A', nb_files: 2 });
        expect(sb).to.deep.equal({ key: 'SB', study_name: 'Study B', nb_files: 1 });
    });
});

describe('POST /reports/file-request-access', () => {
    let testApp: TestApp;

    afterEach(() => testApp?.restore());

    it('returns a gzipped tar with a content-disposition header', async () => {
        const files = [makeFileForAccess()];
        let call = 0;
        testApp = buildTestApp({
            esSearch: () => {
                call += 1;
                if (call === 1) {
                    return makeHitsBody(files.map(f => ({ file_id: f.file_id })));
                }
                return makeHitsBody(files);
            },
            fetch: async () => extendedMappingResponse,
        });

        const res = await request(testApp.app)
            .post('/reports/file-request-access')
            .send({ sqon: { op: 'and', content: [] } })
            .buffer(true)
            .parse((r, cb) => {
                const chunks: Buffer[] = [];
                r.on('data', c => chunks.push(c));
                r.on('end', () => cb(null, Buffer.concat(chunks)));
            });

        expect(res.status).to.equal(200);
        expect(res.headers['content-disposition']).to.include('.tar.gz');

        // gzip magic bytes: 0x1f 0x8b
        const body = res.body as Buffer;
        expect(body.length).to.be.greaterThan(0);
        expect(body[0]).to.equal(0x1f);
        expect(body[1]).to.equal(0x8b);
    });

    const downloadArchive = async (files: Record<string, any>[]): Promise<Record<string, string>> => {
        let call = 0;
        testApp = buildTestApp({
            esSearch: () => {
                call += 1;
                if (call === 1) {
                    return makeHitsBody(files.map(f => ({ file_id: f.file_id })));
                }
                return makeHitsBody(files);
            },
            fetch: async () => extendedMappingResponse,
        });

        const res = await request(testApp.app)
            .post('/reports/file-request-access')
            .send({ sqon: { op: 'and', content: [] } })
            .buffer(true)
            .parse((r, cb) => {
                const chunks: Buffer[] = [];
                r.on('data', c => chunks.push(c));
                r.on('end', () => cb(null, Buffer.concat(chunks)));
            });

        expect(res.status).to.equal(200);
        return extractTarGz(res.body as Buffer);
    };

    // the access authority is now indexed under study.access_authority (formerly study.contact).
    // Checks that access.tsv shows its value in the last column, and that the archive content and the
    // other access.tsv columns are unchanged.
    it('fills the Access Authority column of access.tsv from study.access_authority.value', async () => {
        const entries = await downloadArchive([makeFileForAccess()]);
        expect(Object.keys(entries)).to.have.members(['README_EN.txt', 'README_FR.txt', 'access.tsv', 'SA.tsv']);

        const [header, row] = entries['access.tsv'].split('\n');
        expect(header).to.equal('Study Name\tAccess Limitations\tAccess Requirements\tAccess Authority');
        expect(row).to.equal('Study A\tNRES\tIRB\tcontact@example.org');
    });

    // some studies have no access authority in the index.
    // Checks that the export still succeeds and leaves the Access Authority cell empty.
    it('leaves the Access Authority column empty when the study has no access_authority', async () => {
        const studyWithoutAccessAuthority = {
            study_code: 'SA',
            name: 'Study A',
            data_access_codes: { access_limitations: ['NRES'], access_requirements: ['IRB'] },
        };
        const entries = await downloadArchive([makeFileForAccess({ study: studyWithoutAccessAuthority })]);

        const [, row] = entries['access.tsv'].split('\n');
        expect(row).to.equal('Study A\tNRES\tIRB\t');
    });
});
