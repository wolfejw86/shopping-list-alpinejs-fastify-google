import fp from 'fastify-plugin';
import pgp from 'pg-promise';
const DbMigrate = require('db-migrate');

function runMigrations() {
    return new Promise<any[]>((resolve, reject) => {
        const dbMigrate = DbMigrate.getInstance(true);
        dbMigrate.silence(true);

        dbMigrate.up((error: any, results = []) => {
            if (error) {
                return reject(error);
            }

            resolve(results);
        });
    });
}

export default fp(
    async (fastify) => {
        const { appConfig } = fastify;
        const db = pgp()(appConfig.postgres.uri);

        fastify
            .decorate('db', db)
            .addHook('onClose', async (instance, done) => {
                await db.$pool.end();
                done();
            });

        const migrationResults = await runMigrations();

        if (migrationResults.length > 0) {
            fastify.log.info({
                migrationsCount: migrationResults.length,
                msg: 'Successful migrations run',
            });
        }
    },
    { name: 'db' },
);

declare module 'fastify' {
    export interface FastifyInstance {
        db: pgp.IDatabase<{}>;
    }
}
