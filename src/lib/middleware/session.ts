import { preHandlerAsyncHookHandler } from 'fastify';

export class BadRequestError extends Error {
    code = 400;
    statusCode = 400;
    constructor(msg: string) {
        super(msg);
    }
}

export const forceLogin: preHandlerAsyncHookHandler = async (request) => {
    if (!request.session.user) {
        throw new BadRequestError('Must be logged in to take this action');
    }
};
