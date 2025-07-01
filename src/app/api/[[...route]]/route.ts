import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { User, Vehicle, ServiceRecord, Reminder } from './routes';

const app = new Hono().basePath('/api');

app.use(
    '*',
    cors({
        origin: '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowHeaders: ['Content-Type'],
        exposeHeaders: ['Content-Length'],
        maxAge: 600,
        credentials: true,
    })
);

app.get('/', (c) => {
    return c.json({ message: 'Welcome to Vehicle Service Book API' });
});

app.get('/healthcheck', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.route('/user', User);
app.route('/vehicle', Vehicle);
app.route('/service-record', ServiceRecord);
app.route('/reminder', Reminder);

export const GET = (request: Request) => app.fetch(request);
export const POST = (request: Request) => app.fetch(request);
export const PUT = (request: Request) => app.fetch(request);
export const DELETE = (request: Request) => app.fetch(request);
export const PATCH = (request: Request) => app.fetch(request);
export const OPTIONS = (request: Request) => app.fetch(request);
