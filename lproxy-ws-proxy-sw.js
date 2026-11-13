const PROXY_MARKER = '/__lproxy_ws_proxy__/';
const DOWNLOAD_FETCH_HEADER = 'x-lproxy-download-fetch';
let controlClientId = '';

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    const markerAt = url.pathname.indexOf(PROXY_MARKER);
    if (markerAt !== -1) {
        const targetPathPart = url.pathname.slice(markerAt + PROXY_MARKER.length);
        const targetPath = '/' + targetPathPart + url.search;
        if (shouldStartClientDownload(event, targetPath)) {
            event.respondWith(handleProxyClientDownload(event, targetPath));
            return;
        }
        event.respondWith(handleProxyFetch(event, targetPath));
        return;
    }

    if (isProxyChildRequest(event, url)) {
        const targetPath = url.pathname + url.search;
        if (shouldStartClientDownload(event, targetPath)) {
            event.respondWith(handleProxyClientDownload(event, targetPath));
            return;
        }
        event.respondWith(handleProxyFetch(event, targetPath));
    }
});

self.addEventListener('message', event => {
    const data = event.data || {};
    if (data.type === 'lproxy-ws-control') {
        controlClientId = event.source && event.source.id ? event.source.id : '';
    }
});

function isProxyChildRequest(event, url) {
    if (url.origin !== self.location.origin) {
        return false;
    }
    if (!event.request.referrer) {
        return false;
    }
    try {
        const referrer = new URL(event.request.referrer);
        return referrer.origin === self.location.origin && referrer.pathname.indexOf(PROXY_MARKER) !== -1;
    } catch (error) {
        return false;
    }
}

function shouldStartClientDownload(event, targetPath) {
    if (event.request.headers.get(DOWNLOAD_FETCH_HEADER) === '1') {
        return false;
    }
    return (event.request.mode === 'navigate' || event.request.destination === 'document')
        && isProxyDownloadPath(targetPath);
}

function isProxyDownloadPath(targetPath) {
    try {
        const url = new URL(targetPath || '/', self.location.origin);
        return url.searchParams.get('mode') === 'download'
            || url.pathname.indexOf('/fbdownload/') !== -1;
    } catch (error) {
        return false;
    }
}

async function handleProxyClientDownload(event, targetPath) {
    try {
        const client = await findControlClient(event.clientId);
        if (!client) {
            return new Response('No active proxy client', { status: 503 });
        }

        await askClient(client, {
            method: event.request.method,
            path: targetPath,
            headers: Array.from(event.request.headers.entries()),
            body: await event.request.arrayBuffer()
        }, 'lproxy-ws-download', 3000);

        return new Response('<!doctype html><meta charset="utf-8"><title>download</title><body>下载已开始</body>', {
            status: 200,
            headers: {
                'content-type': 'text/html; charset=utf-8',
                'cache-control': 'no-store'
            }
        });
    } catch (error) {
        return new Response(String(error && error.message || error), { status: 502 });
    }
}

async function handleProxyFetch(event, targetPath) {
    try {
        const client = await findControlClient(event.clientId);
        if (!client) {
            return new Response('No active proxy client', { status: 503 });
        }

        const body = await event.request.arrayBuffer();
        const response = await askClient(client, {
            method: event.request.method,
            path: targetPath,
            headers: Array.from(event.request.headers.entries()),
            body
        });

        return new Response(response.body || new ArrayBuffer(0), {
            status: response.status || 502,
            statusText: response.statusText || '',
            headers: response.headers || []
        });
    } catch (error) {
        return new Response(String(error && error.message || error), { status: 502 });
    }
}

async function findControlClient(clientId) {
    if (controlClientId) {
        const savedClient = await self.clients.get(controlClientId);
        if (savedClient) {
            return savedClient;
        }
        controlClientId = '';
    }

    const allClients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window'
    });

    const controlClient = allClients.find(client => {
        try {
            return new URL(client.url).pathname.indexOf(PROXY_MARKER) === -1;
        } catch (error) {
            return false;
        }
    });
    if (controlClient) {
        return controlClient;
    }

    if (clientId) {
        return self.clients.get(clientId);
    }
    return null;
}

function askClient(client, request, type = 'lproxy-ws-fetch', timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => {
            channel.port1.close();
            reject(new Error('Proxy request timeout'));
        }, timeoutMs);

        channel.port1.onmessage = event => {
            clearTimeout(timer);
            channel.port1.close();
            const data = event.data || {};
            if (!data.ok) {
                reject(new Error(data.error || 'Proxy request failed'));
                return;
            }
            resolve(data.response || {});
        };

        const body = request.body || new ArrayBuffer(0);
        client.postMessage({
            type,
            request: {
                method: request.method,
                path: request.path,
                headers: request.headers,
                body
            }
        }, [channel.port2, body]);
    });
}
