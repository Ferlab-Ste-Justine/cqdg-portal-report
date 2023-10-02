import fs from 'fs';

import { SheetConfig } from '../types';

const generateTsvReport = async (data: { key: string }[], tsvPath: string, config: SheetConfig): Promise<void> => {
    let tsvContent = config.columns.map(c => c.header).join('\t') + '\n';

    for (const row of data) {
        const values = config.columns.map(c => row[c.field]);
        tsvContent += values.join('\t') + '\n';
    }

    await fs.writeFileSync(tsvPath, tsvContent);
};

export default generateTsvReport;
