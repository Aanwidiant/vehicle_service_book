import { SignJWT } from 'jose';

export const generateToken = async (id: number, name: string, photo?: string | null) => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    return await new SignJWT({ id: id, name, photo })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1d')
        .sign(secret);
};
