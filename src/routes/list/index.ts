import { FastifyPluginAsync } from 'fastify';
import EventEmitter from 'events';
import { FastifySSEPlugin } from 'fastify-sse-v2';
import { EventIterator } from 'event-iterator';
import { FamilyRepository } from '../../lib/family';
import { BadRequestError, forceLogin } from '../../lib/middleware/session';

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
    await fastify.register(FastifySSEPlugin);

    const familyRepo = FamilyRepository(fastify.db);
    const dataPusher = new EventEmitter();

    fastify.addHook('preHandler', async (request, reply) => {
        reply.locals = { user: request.session.user };
    });

    fastify.get('/', async function (request, reply) {
        const userId = request.session.user.id;
        const family = await familyRepo.getFamily(userId);

        if (!family) {
            return reply.redirect(`${fastify.appConfig.appOrigin}/family`);
        }

        const list = await fastify.db
            .manyOrNone<{
                id: string;
                content: string;
                list_id: string;
            }>(
                `
        select l.id as list_id, li.id, li.content from list l
        inner join list_item li
        on li.list_id = l.id
        where family_id = $1
        order by li.id`,
                [family.id],
            )
            .then((list) => {
                return list.map((item) => ({ ...item, listId: item.list_id }));
            });

        return reply.view('pages/list', {
            title: 'Shopping List',
            json: JSON.stringify(list),
            listId: list.length ? list[0].list_id : '',
            family,
        });
    });

    fastify.delete<{ Body: { id: string; listId: string; content: string } }>(
        '/item',
        { preHandler: forceLogin },
        async (request) => {
            const userId = request.session.user.id;
            const family = await familyRepo.getFamily(userId);

            if (!family) {
                throw new Error('unauthorized');
            }

            await fastify.db.none(
                'delete from list_item where list_id = $1 and id = $2',
                [request.body.listId, request.body.id],
            );

            dataPusher.emit('data', {
                event: 'list_item_deleted',
                data: JSON.stringify(request.body),
            });

            return request.body;
        },
    );

    fastify.post<{ Body: { content: string; listId?: string } }>(
        '/item',
        {
            preHandler: forceLogin,
            schema: {
                body: {
                    type: 'object',
                    required: ['content'],
                    properties: {
                        content: { type: 'string' },
                        listId: { type: 'string' },
                    },
                },
            },
        },
        async function (request, reply) {
            const { content, listId } = request.body;
            const userId = request.session.user.id;

            const family = await familyRepo.getFamily(userId);

            if (!family) {
                return reply.redirect(`${fastify.appConfig.appOrigin}/family`);
            }

            await fastify.db.tx(async (t) => {
                let list = listId
                    ? await t.oneOrNone('SELECT id from list WHERE id = $1', [
                          listId,
                      ])
                    : null;

                if (!list) {
                    list = await t.one(
                        'insert into list (family_id) values ($1) returning id',
                        [family.id],
                    );
                }

                const {
                    id,
                } = await t.one(
                    'insert into list_item (list_id, content) values ($1, $2) returning id',
                    [list.id, content],
                );

                dataPusher.emit('data', {
                    event: 'list_item_added',
                    data: JSON.stringify({ listId: list.id, content, id }),
                });
            });

            // emit realtime update

            reply.code(204);
        },
    );

    fastify.get('/sse', function (req, reply) {
        reply.sse(
            new EventIterator(({ push }) => {
                dataPusher.on('data', push);

                return () => dataPusher.removeListener('data', push);
            }),
        );
    });

    fastify.get('/sync', async (request) => {
        const userId = request.session.user.id;
        const family = await familyRepo.getFamily(userId);

        if (!family) {
            throw new BadRequestError('Nope');
        }

        const list = await fastify.db
            .manyOrNone<{
                id: string;
                content: string;
                list_id: string;
            }>(
                `
        select l.id as list_id, li.id, li.content from list l
        inner join list_item li
        on li.list_id = l.id
        where family_id = $1
        order by li.id`,
                [family.id],
            )
            .then((list) => {
                return list.map((item) => ({ ...item, listId: item.list_id }));
            });

        return {
            data: list,
        };
    });
};

export default root;
