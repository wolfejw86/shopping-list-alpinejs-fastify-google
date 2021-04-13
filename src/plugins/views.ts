import { join } from 'path';
import { glob } from 'glob';
import fp from 'fastify-plugin';
import pov from 'point-of-view';
import * as handlebars from 'handlebars';
import fastifyStatic from 'fastify-static';

export type Pages = 'home' | 'pages/list';

export default fp(async (fastify) => {
    const publicDir = join(__dirname, '../public');

    await fastify.register(fastifyStatic, {
        root: publicDir,
    });

    const partialsFiles: string[] = await new Promise((resolve, reject) =>
        glob(
            join(__dirname, '../views/partials/**/*.html'),
            (err: any, files: any) => {
                err ? reject(err) : resolve(files);
            },
        ),
    );
    const filenameRe = /.*\/([a-zA-Z]*)\.html/;
    const viewDirPath = join(__dirname, '../views');

    const partials = partialsFiles
        .map((file) => {
            const partialName = filenameRe.exec(file);
            const partial = partialName?.[1];

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return { [partial!]: file.replace(viewDirPath, '') };
        })
        .reduce((all, next) => ({ ...all, ...next }));

    fastify.register(pov, {
        engine: { handlebars },
        options: {
            partials,
        },
        root: viewDirPath,
        viewExt: 'html',
        defaultContext: {
            title: 'RSS Feed Reader',
            environment: 'production',
        },
    });
});

declare module 'fastify' {
    interface FastifyReply {
        view(page: Pages, data?: Record<string, any>): FastifyReply;
        // eslint-disable-next-line @typescript-eslint/ban-types
        locals?: object;
    }
}
