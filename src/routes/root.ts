import { FastifyPluginAsync } from 'fastify';
import { UserRepository } from '../lib/users';
// import { google } from 'googleapis';

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
    const userRepo = UserRepository(fastify.db);

    fastify.addHook('preHandler', async (request, reply) => {
        reply.locals = { user: request.session.user };
    });

    fastify.get('/', async function (request, reply) {
        return reply.view('home');
    });

    fastify.get('/user/signup', async (request, reply) => {
        const { provider } = request.session.grant;
        const { sub, email, picture } = request.session.grant.response.profile;
        const newUser = await userRepo.createUser(provider, sub);

        request.session.user = {
            ...newUser,
            email,
            picture,
        };

        return reply.redirect(fastify.appConfig.appOrigin + '/');
    });
};

export default root;
