/* eslint-disable no-undef */
if (typeof importScripts === 'function') {
    importScripts(
        'https://storage.googleapis.com/workbox-cdn/releases/6.1.1/workbox-sw.js',
    );

    const { registerRoute } = workbox.routing;
    const { CacheFirst } = workbox.strategies;
    const { CacheableResponse } = workbox.cacheableResponse;

    workbox.loadModule('workbox-strategies');

    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'image',
        new workbox.strategies.NetworkFirst(),
    );
}
