import fs from 'fs';

import getConfig from '../../config';
import { formatFileSize } from '../../utils/formatFileSize';
import { SheetConfig } from '../types';

const generateTsvReport = async (
    data: { key: string }[],
    tsvPath: string,
    config: SheetConfig,
    dataWithExtraFields: { key: string }[],
): Promise<void> => {
    const configGlobal = getConfig();

    let tsvContent = config.columns.map(c => c.header).join('\t') + '\n';

    for (const row of data) {
        const values = config.columns.map(c => row[c.field]);
        tsvContent += values.join('\t') + '\n';

        /** [CQDG-737] if the current file is a CRAM and has a CRAI sub-file then add new line for it */
        /** first check in get back the file with extra infos in dataWithExtraFields */
        const fileFound = dataWithExtraFields.find(e => e[configGlobal.file_id] === row[configGlobal.file_id]);
        /** then check if the file has a CRAI child in relates_to */
        if (fileFound?.[configGlobal.relates_to_file_format] === 'CRAI') {
            /** copy the row but change the id, name, format and size */
            const craiRow = {
                ...row,
                file_id: fileFound?.[configGlobal.relates_to_file_id],
                file_name: fileFound?.[configGlobal.relates_to_file_name],
                file_format: fileFound?.[configGlobal.relates_to_file_format],
                file_size: formatFileSize(fileFound?.[configGlobal.relates_to_file_size], { output: 'string' }),
            };
            const craiValues = config.columns.map(c => craiRow[c.field]);
            /** then create new line for the CRAI file */
            tsvContent += craiValues.join('\t') + '\n';
        }
    }

    await fs.writeFileSync(tsvPath, tsvContent);
};

export default generateTsvReport;
