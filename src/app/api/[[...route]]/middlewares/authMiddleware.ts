import { Context } from 'hono';
import { decodeToken } from '../helpers';

export const protect = async (c: Context, next: () => Promise<void>) => {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return c.json(
            {
                success: false,
                error: 'No token, access denied',
            },
            401
        );
    }

    try {
        const decoded = await decodeToken(token);
        c.set('user', decoded);
        await next();
    } catch {
        return c.json(
            {
                success: false,
                error: 'Invalid token',
            },
            401
        );
    }
};
