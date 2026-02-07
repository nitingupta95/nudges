import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logEvent = async (eventType: string, metadata: object) => {
    try {
        const event = await prisma.event.create({
            data: {
                type: eventType,
                metadata: JSON.stringify(metadata),
            },
        });
        return event;
    } catch (error) {
        console.error('Error logging event:', error);
        throw new Error('Failed to log event');
    }
};

export const getEvents = async (userId: string) => {
    try {
        const events = await prisma.event.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return events;
    } catch (error) {
        console.error('Error retrieving events:', error);
        throw new Error('Failed to retrieve events');
    }
};