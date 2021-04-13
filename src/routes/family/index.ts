import { FastifyPluginAsync } from 'fastify';
import { forceLogin } from '../../lib/middleware/session';
import { customAlphabet } from 'nanoid';
import { FamilyRepository } from '../../lib/family';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
    const familyRepo = FamilyRepository(fastify.db);

    fastify.addHook('preHandler', async (request, reply) => {
        reply.locals = { user: request.session.user };
    });

    fastify.get('/', async function (request, reply) {
        if (!request.session.user) {
            return reply.view('pages/need-to-signup', {
                title: 'Must Be Signed Up',
            });
        }

        const family = await familyRepo.getFamily(request.session.user.id);

        return reply.view('pages/family', {
            title: 'Family Connect',
            family,
        });
    });

    fastify.get('/code', { preHandler: forceLogin }, async (request) => {
        const userId = request.session.user.id;
        const { code } = await fastify.db.tx(async (t) => {
            const existing_code = await familyRepo.getFamily(userId);

            if (
                existing_code &&
                Date.now() <
                    existing_code.code_created_at.getTime() + 1000 * 60 * 5
            ) {
                return existing_code;
            }

            if (existing_code) {
                return await t.one(
                    `
              UPDATE family 
              SET code = $1, code_created_at = now()
              WHERE id = $2 RETURNING code`,
                    [nanoid(), existing_code.id],
                );
            }

            const { id: familyId, code } = await t.one<{
                id: string;
                code: string;
            }>(
                `INSERT INTO family (code, code_created_at) 
                VALUES ($1, now()) RETURNING id, code`,
                [nanoid()],
            );

            await t.none(
                `INSERT INTO family_member (family_id, user_id) 
                VALUES ($1, $2) ON CONFLICT(family_id, user_id) DO NOTHING`,
                [familyId, userId],
            );

            return { code };
        });

        return { code };
    });

    fastify.post<{ Body: { code: string } }>(
        '/code',
        {
            preHandler: forceLogin,
            schema: {
                body: {
                    type: 'object',
                    required: ['code'],
                    properties: {
                        code: { type: 'string' },
                    },
                },
            },
        },
        async (request) => {
            const userId = request.session.user.id;
            const { code } = request.body;

            await fastify.db.tx(async (t) => {
                const { id: familyId } = await t.one<{ id: string }>(
                    `select id
              FROM family
              WHERE code = $1 AND code_created_at > now() - interval '5 min'`,
                    [code],
                );

                await t.none(
                    `insert into family_member (family_id, user_id)
                values ($1, $2) ON CONFLICT (family_id,user_id) DO NOTHING`,
                    [familyId, userId],
                );
            });

            return { code };
        },
    );
};

export default root;
