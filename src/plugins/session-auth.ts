import fp from 'fastify-plugin';
import cookie from 'fastify-cookie';
import session from 'fastify-session';
import pgSession from 'connect-pg-simple';
import grant from 'grant';

export default fp(
    async (fastify) => {
        const { appConfig } = fastify;
        const { google } = appConfig;

        const SessionStore = pgSession(session as any);

        return fastify
            .register(cookie)
            .register(session, {
                store: new SessionStore({
                    pgPromise: fastify.db,
                    tableName: 'user_sessions',
                }),
                saveUninitialized: false,
                secret: appConfig.postgres.sessionSecret,
                cookie: {
                    secure: process.env.NODE_ENV !== 'development',
                    maxAge: 1000 * 60 * 60 * 24 * 30,
                },
            })
            .register(
                grant.fastify()({
                    defaults: {
                        transport: 'session',
                        origin: fastify.appConfig.appOrigin,
                    },
                    google: {
                        key: google.client_id,
                        secret: google.client_secret,
                        scope: ['email'],
                        response: ['tokens', 'raw', 'jwt', 'profile'],
                        callback: '/user/signup',
                    },
                }),
            );
    },
    { name: 'auth', dependencies: ['db'] },
);
