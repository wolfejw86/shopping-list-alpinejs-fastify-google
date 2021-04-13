import { join } from 'path';
import pgPromise, { QueryFile } from 'pg-promise';

const sql = (relativeFilePath: string) =>
    new QueryFile(join(__dirname, relativeFilePath), { minify: true });

const getFamilyQuery = sql('./getFamily.sql');

export function FamilyRepository(
    db: pgPromise.IDatabase<Record<string, unknown>>,
) {
    // const generateCodeSql = sql('./createCode.sql');

    return {
        // generateCode(userId: string) {
        //     return db.one(generateCodeSql, [userId]);
        // },
        getFamily(userId: string) {
            return db.oneOrNone<{
                id: string;
                code: string;
                code_created_at: Date;
            }>(getFamilyQuery, [userId]);
        },
    };
}
