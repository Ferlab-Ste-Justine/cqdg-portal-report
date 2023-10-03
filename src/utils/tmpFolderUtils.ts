import fs from 'fs';

/**
 * @description Create a temporary folder in /tmp
 */
export const createTmpFolder = async (): Promise<string> => {
    const randomString = Math.random()
        .toString(36)
        .substring(2, 15);
    const folderPath = `/tmp/${randomString}`;
    await fs.mkdirSync(folderPath);
    return folderPath;
};

export const cleanTmpFolder = (folderPath: string): void => fs.rmSync(folderPath, { recursive: true, force: true });
