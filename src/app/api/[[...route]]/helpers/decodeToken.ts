import { jwtVerify } from 'jose';

export const decodeToken = async (token: string) => {
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
};
