import { Context } from 'hono';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const createServiceRecord = async (c: Context) => {
    const user = c.get('user');
    const body = await c.req.json();

    const { vehicleId, serviceDate, odometerKm, workshop, serviceTitle, cost, notes } = body;

    // Validasi field wajib
    if (!vehicleId || !serviceDate || !odometerKm || !workshop || !serviceTitle || !cost) {
        return c.json(
            {
                success: false,
                message: 'All fields except notes are required.',
            },
            400
        );
    }

    try {
        // Pastikan vehicle milik user
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
                    message: 'You are not authorized to add a service record to this vehicle.',
                },
                403
            );
        }

        const newRecord = await prisma.serviceRecord.create({
            data: {
                vehicleId,
                serviceDate: new Date(serviceDate),
                odometerKm,
                workshop,
                serviceTitle,
                cost,
                notes,
            },
        });

        return c.json(
            {
                success: true,
                message: 'Service record created successfully.',
                data: newRecord,
            },
            201
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to create service record.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

type ServiceRecordWithVehicle = Prisma.ServiceRecordGetPayload<{
    include: { vehicle: true };
}>;

export const updateServiceRecord = async (c: Context) => {
    const id = Number(c.req.param('id'));
    const user = c.get('user');
    const body = await c.req.json();

    const allowedFields = ['serviceDate', 'odometerKm', 'workshop', 'serviceTitle', 'cost', 'notes'] as const;
    const updateData: Partial<Prisma.ServiceRecordUpdateInput> = {};

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
        const existing = await prisma.serviceRecord.findUnique({
            where: { id },
            include: { vehicle: true },
        });

        if (!existing) {
            return c.json(
                {
                    success: false,
                    message: 'Service record not found.',
                },
                404
            );
        }

        if (existing.vehicle.userId !== user.id) {
            return c.json(
                {
                    success: false,
                    message: 'You are not authorized to update this service record.',
                },
                403
            );
        }

        const isChanged = allowedFields.some((field) => {
            const newValue = updateData[field];
            const oldValue = (existing as ServiceRecordWithVehicle)[field];

            if (field === 'serviceDate') {
                const newDate = new Date(newValue as Date);
                return newDate.getTime() !== (oldValue as Date).getTime();
            }

            return newValue !== undefined && newValue !== oldValue;
        });

        if (!isChanged) {
            return c.json(
                {
                    success: false,
                    message: 'No changes detected in update.',
                },
                400
            );
        }

        await prisma.serviceRecord.update({
            where: { id },
            data: updateData,
        });

        return c.json(
            {
                success: true,
                message: 'Service record updated successfully.',
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to update service record.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const getServiceRecordsByVehicleId = async (c: Context) => {
    const vehicleId = Number(c.req.param('vehicleId'));
    const user = c.get('user');

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { userId: true },
        });

        if (!vehicle) {
            return c.json(
                {
                    success: false,
                    message: 'Service record not found.',
                },
                404
            );
        }

        if (vehicle.userId !== user.id) {
            return c.json(
                {
                    success: false,
                    message: "You are not authorized to access this vehicle's service records.",
                },
                403
            );
        }

        const records = await prisma.serviceRecord.findMany({
            where: { vehicleId },
            orderBy: { serviceDate: 'desc' },
        });

        return c.json(
            {
                success: true,
                message: 'Service records fetched successfully.',
                data: records,
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to fetch service records.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const getServiceRecordById = async (c: Context) => {
    const id = Number(c.req.param('id'));
    const user = c.get('user');

    try {
        const record = await prisma.serviceRecord.findUnique({
            where: { id },
            include: { vehicle: true },
        });

        if (!record) {
            return c.json(
                {
                    success: false,
                    message: 'Service record not found.',
                },
                404
            );
        }

        if (record.vehicle.userId !== user.id) {
            return c.json(
                {
                    success: false,
                    message: 'You are not authorized to access this service record.',
                },
                403
            );
        }

        return c.json(
            {
                success: true,
                message: 'Service record fetched successfully.',
                data: record,
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to fetch service record.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const deleteServiceRecord = async (c: Context) => {
    const serviceRecordId = Number(c.req.param('id'));
    const user = c.get('user');

    try {
        const serviceRecord = await prisma.serviceRecord.findUnique({
            where: { id: serviceRecordId },
            include: {
                vehicle: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!serviceRecord) {
            return c.json(
                {
                    success: false,
                    message: 'Service record not found.',
                },
                404
            );
        }

        if (serviceRecord.vehicle.userId !== user.id) {
            return c.json(
                {
                    success: false,
                    message: 'You are not authorized to delete this service record.',
                },
                403
            );
        }

        await prisma.serviceRecord.delete({
            where: { id: serviceRecordId },
        });

        return c.json(
            {
                success: true,
                message: 'Service record deleted successfully.',
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to delete Service record.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};
