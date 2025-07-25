import { Context } from 'hono';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { supabase } from '@/lib/supabase';

export const createVehicle = async (c: Context) => {
    const body = await c.req.json();

    const user = c.get('user');

    const { brand, model, plateNumber, year, currentKm } = body;

    const requiredFields = ['brand', 'model', 'plateNumber', 'year', 'currentKm'];

    const missingField = requiredFields.find((field) => {
        const value = body[field];
        return value === undefined || value === null || value === '';
    });

    if (missingField) {
        return c.json({ success: false, message: `Field ${missingField} is required` }, 400);
    }

    if (isNaN(Number(year)) || isNaN(Number(currentKm))) {
        return c.json({ success: false, message: 'Year and currentKm must be numbers' }, 400);
    }

    const existingPlateNumber = await prisma.vehicle.findFirst({
        where: { plateNumber },
    });

    if (existingPlateNumber) {
        return c.json(
            {
                success: false,
                message: 'PlateNumber already registered, Please check again.',
            },
            400
        );
    }

    try {
        await prisma.vehicle.create({
            data: {
                userId: user.id,
                brand,
                model,
                plateNumber,
                year,
                currentKm,
            },
        });

        return c.json(
            {
                success: true,
                message: 'Vehicle created successfully.',
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

export const updateVehicle = async (c: Context) => {
    const vehicleId = Number(c.req.param('id'));
    const user = c.get('user');
    const body = await c.req.json();

    const allowedFields = ['brand', 'model', 'plateNumber', 'year', 'currentKm'] as const;

    const updateData: Partial<Prisma.VehicleUpdateInput> = {};

    for (const field of allowedFields) {
        if (field in body) {
            updateData[field] = body[field];
        }
    }

    if (Object.keys(updateData).length === 0) {
        return c.json(
            {
                success: false,
                message: 'No fields provided to update.',
            },
            400
        );
    }

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
        });

        if (!vehicle) {
            return c.json(
                {
                    success: false,
                    message: 'Vehicle not found.',
                },
                404
            );
        }

        if (vehicle.userId !== user.id) {
            return c.json(
                {
                    success: false,
                    message: 'You are not authorized to update this vehicle.',
                },
                403
            );
        }

        if (
            updateData.plateNumber &&
            typeof updateData.plateNumber === 'string' &&
            updateData.plateNumber !== vehicle.plateNumber
        ) {
            const existing = await prisma.vehicle.findFirst({
                where: {
                    plateNumber: updateData.plateNumber,
                    NOT: { id: vehicleId },
                },
            });

            if (existing) {
                return c.json(
                    {
                        success: false,
                        message: 'PlateNumber already used by another vehicle.',
                    },
                    400
                );
            }
        }

        let isChanged = false;
        for (const field of allowedFields) {
            if (field in updateData && updateData[field] !== vehicle[field]) {
                isChanged = true;
                break;
            }
        }

        if (!isChanged) {
            return c.json(
                {
                    success: false,
                    message: 'No changes detected. Vehicle data remains the same.',
                },
                400
            );
        }

        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: updateData,
        });

        return c.json(
            {
                success: true,
                message: 'Vehicle updated successfully.',
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to update vehicle.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const getAllVehicles = async (c: Context) => {
    const user = c.get('user');

    try {
        const vehicles = await prisma.vehicle.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        return c.json(
            {
                success: true,
                data: vehicles,
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to fetch vehicles.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const getVehicle = async (c: Context) => {
    const vehicleId = Number(c.req.param('id'));
    const user = c.get('user');

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
        });

        if (!vehicle) {
            return c.json(
                {
                    success: false,
                    message: 'Vehicle not found.',
                },
                404
            );
        }

        if (vehicle.userId !== user.id) {
            return c.json(
                {
                    success: false,
                    message: 'You are not authorized to view this vehicle.',
                },
                403
            );
        }

        return c.json(
            {
                success: true,
                data: vehicle,
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to retrieve vehicle.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const deleteVehicle = async (c: Context) => {
    const vehicleId = Number(c.req.param('id'));
    const user = c.get('user');

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
        });

        if (!vehicle) {
            return c.json(
                {
                    success: false,
                    message: 'Vehicle not found.',
                },
                404
            );
        }

        if (vehicle.userId !== user.id) {
            return c.json(
                {
                    success: false,
                    message: 'You are not authorized to delete this vehicle.',
                },
                403
            );
        }

        if (vehicle.photo) {
            await supabase.storage
                .from('moto-track')
                .remove([vehicle.photo])
                .catch((err) => console.error('Error deleting old photo vehicle:', err));
        }

        await prisma.vehicle.delete({
            where: { id: vehicleId },
        });

        return c.json(
            {
                success: true,
                message: 'Vehicle deleted successfully.',
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to delete vehicle.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const uploadImage = async (c: Context) => {
    const vehicleId = Number(c.req.param('id'));
    const user = c.get('user');

    const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
    });

    if (!vehicle) {
        return c.json(
            {
                success: false,
                message: 'Vehicle not found.',
            },
            404
        );
    }

    if (vehicle.userId !== user.id) {
        return c.json(
            {
                success: false,
                message: 'You are not authorized to update image this vehicle.',
            },
            403
        );
    }

    const file = await c.req.parseBody().then((body) => body['file']);

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
        const existingVehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { photo: true },
        });

        const fileExt = file.name.split('.').pop();
        const fileName = `vehicle_${vehicleId}_${Date.now()}.${fileExt}`;
        const filePath = `vehicle/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('moto-track')
            .upload(filePath, await file.arrayBuffer(), {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            return c.json(
                {
                    success: false,
                    message: 'Failed to upload image vehicle to storage',
                    error: uploadError.message,
                },
                500
            );
        }

        if (existingVehicle?.photo) {
            await supabase.storage
                .from('moto-track')
                .remove([existingVehicle.photo])
                .catch((err) => console.error('Error deleting old photo vehicle:', err));
        }

        const updatedVehicle = await prisma.vehicle.update({
            where: { id: vehicleId },
            data: { photo: filePath },
            select: {
                plateNumber: true,
                photo: true,
            },
        });

        return c.json({
            success: true,
            message: 'Image vehicle uploaded successfully',
            data: updatedVehicle,
        });
    } catch (err) {
        console.error('Upload error:', err);
        return c.json(
            {
                success: false,
                message: 'Failed to upload image vehicle',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};
