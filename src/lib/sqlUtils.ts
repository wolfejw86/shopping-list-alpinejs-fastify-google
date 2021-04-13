import { join } from 'path';
import { QueryFile } from 'pg-promise';

export const sql = (relativeFilePath: string) =>
    new QueryFile(join(__dirname, relativeFilePath), { minify: true });
