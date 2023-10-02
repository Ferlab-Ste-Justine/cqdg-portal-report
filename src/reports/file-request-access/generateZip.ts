import tar from 'tar';

import { IStudyInfos } from './getStudiesInfos';

const generateZip = async (
    studyInfos: IStudyInfos[],
    fileName: string,
    path: string,
    withoutFiles: boolean,
): Promise<void> => {
    const fileNames: string[] = ['README_EN.txt', 'README_FR.txt', 'access.tsv'];

    if (!withoutFiles) {
        for (const studyInfo of studyInfos) {
            fileNames.push(`${studyInfo.study_code}.tsv`);
        }
    }

    await tar.create(
        {
            gzip: true, // enable gzip compression
            portable: true, // use relative paths only
            cwd: '/tmp/', // set the current working directory to the script directory
            file: path, // set the output file
            sync: true, // use synchronous file operations
        },
        // list of files to include in the tar stream
        fileNames,
    );
};

export default generateZip;
