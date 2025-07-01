import { Context } from 'hono';
import { prisma } from '@/lib/prisma';
import { ReminderType } from '@prisma/client';

export const createReminderSetting = async (c: Context) => {
    const user = c.get('user');
    const body = await c.req.json();

    const { vehicleId, type, thresholdKm, thresholdDays, lastServiceDate, lastServiceKm, nextDueKm } = body;

    if (!Object.values(ReminderType).includes(type)) {
        return c.json(
            {
                success: false,
                message: `Invalid type. Must be one of: ${Object.values(ReminderType).join(', ')}`,
            },
            400
        );
    }

    const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
    });

    if (!vehicle || vehicle.userId !== user.id) {
        return c.json(
            {
                success: false,
                message: 'You are not authorized to set a reminder for this vehicle.',
            },
            403
        );
    }

    const existing = await prisma.reminderSetting.findUnique({
        where: {
            vehicleId_type: {
                vehicleId,
                type,
            },
        },
    });

    if (existing) {
        return c.json(
            {
                success: false,
                message: `A reminder with type "${type}" already exists for this vehicle.`,
            },
            400
        );
    }

    try {
        const newReminder = await prisma.reminderSetting.create({
            data: {
                vehicleId,
                type,
                thresholdKm,
                thresholdDays,
                lastServiceDate,
                lastServiceKm,
                nextDueKm,
            },
        });

        return c.json(
            {
                success: true,
                message: 'Reminder setting created successfully.',
                data: newReminder,
            },
            201
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to create reminder setting.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const getReminderSettingsByUser = async (c: Context) => {
    const user = c.get('user');

    try {
        const reminders = await prisma.reminderSetting.findMany({
            where: {
                vehicle: {
                    userId: user.id,
                },
            },
            include: {
                vehicle: {
                    select: {
                        model: true,
                        plateNumber: true,
                    },
                },
            },
        });

        return c.json(
            {
                success: true,
                message: 'Reminder settings fetched successfully.',
                data: reminders,
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to fetch reminder settings.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};

export const deleteReminderSetting = async (c: Context) => {
    const reminderSettingId = Number(c.req.param('id'));
    const user = c.get('user');

    try {
        const reminderSetting = await prisma.reminderSetting.findUnique({
            where: { id: reminderSettingId },
            include: {
                vehicle: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!reminderSetting) {
            return c.json(
                {
                    success: false,
                    message: 'Reminder setting not found.',
                },
                404
            );
        }

        if (reminderSetting.vehicle.userId !== user.id) {
            return c.json(
                {
                    success: false,
                    message: 'You are not authorized to delete this reminder setting.',
                },
                403
            );
        }

        await prisma.reminderSetting.delete({
            where: { id: reminderSettingId },
        });

        return c.json(
            {
                success: true,
                message: 'Reminder setting deleted successfully.',
            },
            200
        );
    } catch (err) {
        return c.json(
            {
                success: false,
                message: 'Failed to delete reminder setting.',
                error: err instanceof Error ? err.message : String(err),
            },
            500
        );
    }
};
