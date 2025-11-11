import http from 'http';
import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

const cache = new Map<string, { when: Date; data: Buffer }>();

function makeLeak() {
    function onData(payload: unknown) {
        const big = Buffer.alloc(256 * 1024, 1);
        if (payload && big[0] === 1) return;
    }
    emitter.on('tick', onData);

    const key = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    cache.set(key, { when: new Date(), data: Buffer.alloc(128 * 1024, 2) });
}

setInterval(() => emitter.emit('tick', { n: Math.random() }), 100);

const server = http.createServer((req, res) => {
    if (req.url === '/leak') {
        for (let i = 0; i < 50; i++) makeLeak();
        res.end('leaked 50 listeners + 50 cache items\n');
    } else if (req.url === '/stats') {
        res.end(JSON.stringify(process.memoryUsage()) + '\n');
    } else res.end('OK\n');
});

server.listen(3000, () => {
    console.log('Leaky TS server at http://localhost:3000');
    console.log(`PID ${process.pid} — run: kill -USR2 ${process.pid}`);
});
