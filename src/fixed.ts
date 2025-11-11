import http from 'http';
import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

class SimpleTTL<T> {
    private store = new Map<string, { v: T; exp: number }>();
    constructor(private ttl = 5000, private maxItems = 1000) {}

    set(k: string, v: T) {
        const now = Date.now();
        this.store.set(k, { v, exp: now + this.ttl });
        if (this.store.size > this.maxItems)
            this.store.delete(<string>this.store.keys().next().value);
    }
    get(k: string) {
        const e = this.store.get(k);
        if (!e) return undefined;
        if (e.exp < Date.now()) {
            this.store.delete(k);
            return undefined;
        }
        return e.v;
    }
    sweep() {
        const now = Date.now();
        for (const [k, e] of this.store)
            if (e.exp < now) this.store.delete(k);
    }
}

const cache = new SimpleTTL<{ when: number }>();

function onceWithAbort(
    signal: AbortSignal | undefined,
    event: string,
    handler: (...args: any[]) => void
) {
    const wrapped = (...args: any[]) => {
        emitter.removeListener(event, wrapped);
        handler(...args);
    };
    emitter.on(event, wrapped);
    signal?.addEventListener('abort', () =>
        emitter.removeListener(event, wrapped)
    );
}

function simulateWork(signal: AbortSignal) {
    onceWithAbort(signal, 'tick', () => {
        const tmp = Buffer.allocUnsafe(1024);
        tmp[0] = 1;
    });
    const key = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    cache.set(key, { when: Date.now() });
}

setInterval(() => {
    emitter.emit('tick', { n: Math.random() });
    cache.sweep();
}, 100);

const server = http.createServer((req, res) => {
    if (req.url === '/work') {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 200);
        for (let i = 0; i < 50; i++) simulateWork(ctrl.signal);
        res.end('did 50 units (no leak)\n');
    } else if (req.url === '/stats') {
        res.end(JSON.stringify(process.memoryUsage()) + '\n');
    } else res.end('OK\n');
});

server.listen(3000, () => {
    console.log('Fixed TS server at http://localhost:3000');
    console.log(`PID ${process.pid} — run: kill -USR2 ${process.pid}`);
});
