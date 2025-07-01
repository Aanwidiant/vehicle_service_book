import { SignJWT } from 'jose';

export const generateToken = async (userId: number, username: string, role: string) => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    return await new SignJWT({ id: userId, username, role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1d')
        .sign(secret);
};
