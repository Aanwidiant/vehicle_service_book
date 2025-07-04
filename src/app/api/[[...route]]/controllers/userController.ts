import { Context } from 'hono';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken, validatePassword, validateEmail } from '../helpers';
import { supabase } from '@/lib/supabase'

export const registerUser = async (c: Context) => {
    const { name, email, password } = await c.req.json();

    if (!name || !email || !password) {
        return c.json(
            {
                success: false,
                message: 'All fields must be filled.',
            },
            400
        );
    }

    const existingEmail = await prisma.user.findUnique({
        where: { email },
    });

    if (existingEmail) {
        return c.json(
            {
                success: false,
                message: 'Email is already registered.',
            },
            400
        );
    }

    const existingUsername = await prisma.user.findUnique({
        where: { name },
    });

    if (existingUsername) {
        return c.json(
            {
                success: false,
                message: 'Username is already taken.',
            },
            400
        );
    }

    const emailError = validateEmail(email);
    if (emailError) {
        return c.json({ success: false, message: emailError }, 400);
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        return c.json({ success: false, message: passwordError }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return c.json(
            {
                success: true,
                message: `User ${user.name} created successfully.`,
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
            201
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to create user.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const loginUser = async (c: Context) => {
    const { email, password } = await c.req.json();

    if (!email || !password) {
        return c.json(
            {
                success: false,
                message: 'Email and password is required.',
            },
            400
        );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return c.json(
            {
                success: false,
                message: 'Email not registered',
                error: 'email',
            },
            401
        );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return c.json(
            {
                success: false,
                message: 'Wrong password',
                error: 'password',
            },
            401
        );
    }

    const token = await generateToken(user.id, user.name, user.photo);

    return c.json(
        {
            success: true,
            message: 'Login successfully.',
            data: {
                token,
                user: {
                    name: user.name,
                    email: user.email,
                    photo: user.photo,
                },
            },
        },
        200
    );
};

export const getUser = async (c: Context) => {
    const user = c.get('user');
    const userId = user.id

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                photo: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return c.json(
                {
                    success: false,
                    message: 'User not found.',
                },
                404
            );
        }

        return c.json(
            {
                success: true,
                data: user,
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to retrieve user.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const updateUser = async (c: Context) => {
    const id = parseInt(c.req.param('id'));
    if (!id || isNaN(id)) {
        return c.json(
            {
                success: false,
                message: 'Valid user ID is required.',
            },
            400
        );
    }

    const currentUser = c.get('user');

    if (currentUser.id !== id) {
        return c.json(
            {
                success: false,
                message: 'You can only update your own profile.',
            },
            403
        );
    }

    const { name, email, password } = await c.req.json<{
        name?: string;
        email?: string;
        password?: string;
    }>();

    const updateData: Partial<{
        name: string;
        email: string;
        password: string;
    }> = {};

    const existingUser = await prisma.user.findUnique({
        where: { id },
    });

    if (!existingUser) {
        return c.json({ success: false, message: 'User not found.' }, 404);
    }

    if (name !== undefined && name !== existingUser.name) {
        const nameExists = await prisma.user.findFirst({
            where: { name, NOT: { id } },
        });

        if (nameExists) {
            return c.json({ success: false, message: 'Username is already taken.' }, 400);
        }
        updateData.name = name;
    }

    if (email !== undefined && email !== existingUser.email) {
        const emailError = validateEmail(email);
        if (emailError) {
            return c.json({ success: false, message: emailError }, 400);
        }

        const emailExists = await prisma.user.findFirst({
            where: { email, NOT: { id } },
        });

        if (emailExists) {
            return c.json({ success: false, message: 'Email is already registered.' }, 400);
        }
        updateData.email = email;
    }

    if (password !== undefined) {
        const passwordError = validatePassword(password);
        if (passwordError) {
            return c.json({ success: false, message: passwordError }, 400);
        }

        const isSamePassword = await bcrypt.compare(password, existingUser.password);
        if (!isSamePassword) {
            updateData.password = await bcrypt.hash(password, 10);
        }
    }

    if (Object.keys(updateData).length === 0) {
        return c.json(
            {
                success: false,
                error: 'no_change',
                message: 'No changes detected.',
            },
            400
        );
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        return c.json(
            {
                success: true,
                message: `User ${updatedUser.name} updated successfully`,
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to update User data.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const deleteUser = async (c: Context) => {
    const id = parseInt(c.req.param('id'));
    if (!id || isNaN(id)) {
        return c.json(
            {
                success: false,
                message: 'Valid user ID is required.',
            },
            400
        );
    }

    const currentUser = c.get('user');

    if (currentUser.id !== id) {
        return c.json(
            {
                success: false,
                message: 'You can only delete your own profile.',
            },
            403
        );
    }

    try {
        const existing = await prisma.user.findUnique({ where: { id } });

        if (!existing) {
            return c.json(
                {
                    success: false,
                    message: 'User not found.',
                },
                404
            );
        }

        await prisma.user.delete({ where: { id } });

        return c.json(
            {
                success: true,
                message: 'User successfully deleted.',
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to delete User.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const uploadImage = async (c: Context) => {
    const user = c.get('user');
    const userId = user.id
    const file = await c.req.parseBody().then(body => body['file']);

    if (!file || !(file instanceof File)) {
        return c.json(
            {
                success: false,
                message: 'No file uploaded or invalid file format.',
            },
            400
        );
    }

    if (file.size > 5 * 1024 * 1024) {
        return c.json(
            {
                success: false,
                message: 'File size exceeds 5MB limit.',
            },
            400
        );
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
        return c.json(
            {
                success: false,
                message: 'Only JPEG, PNG, GIF, and WebP images are allowed.',
            },
            400
        );
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { photo: true }
        });

        const fileExt = file.name.split('.').pop();
        const fileName = `user_${userId}_${Date.now()}.${fileExt}`;
        const filePath = `user/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('moto-track')
            .upload(filePath, await file.arrayBuffer(), {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            return c.json(
                {
                    success: false,
                    message: 'Failed to upload image to storage',
                    error: uploadError.message,
                },
                500
            );
        }

        const { data: urlData } = supabase.storage
            .from('moto-track')
            .getPublicUrl(filePath);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { photo: urlData.publicUrl },
            select: {
                name: true,
                photo: true
            }
        });

        if (user?.photo) {
            const oldPhotoPath = user.photo.split('/user/').pop();
            if (oldPhotoPath) {
                await supabase.storage
                    .from('moto-track')
                    .remove([`user/${oldPhotoPath}`])
                    .catch(err => console.error('Error deleting old photo:', err));
            }
        }

        return c.json({
            success: true,
            message: 'Image uploaded successfully',
            data: updatedUser
        });

    } catch (err) {
        console.error('Upload error:', err);
        return c.json(
            {
                success: false,
                message: 'Failed to upload image',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};