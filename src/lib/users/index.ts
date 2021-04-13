import { join } from 'path';
import pgPromise, { QueryFile } from 'pg-promise';

const sql = (relativeFilePath: string) =>
    new QueryFile(join(__dirname, relativeFilePath), { minify: true });

const getUserIdSql = sql('./getUserIdByProvider.sql');
const createUserSql = sql('./createUser.sql');

export const UserRepository = (
    db: pgPromise.IDatabase<Record<string, unknown>>,
) => {
    const getUserIdByProvider = (providerType: string, providerId: string) =>
        db.one<{ id: string }>(getUserIdSql, [providerType, providerId]);

    const createUser = (providerType: string, providerId: string) =>
        db
            .oneOrNone<{ id: string }>(createUserSql, [
                providerType,
                providerId,
            ])
            .then((result) => {
                if (result) {
                    return result;
                }

                return getUserIdByProvider(providerType, providerId);
            });

    return {
        getUserIdByProvider,
        createUser,
    };
};
