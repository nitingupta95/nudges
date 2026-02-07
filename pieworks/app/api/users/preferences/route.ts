import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
    const { preferences } = await request.json();
    
    // Assuming preferences is an object containing user preferences
    const userId = 'mockUserId'; // Replace with actual user ID from session/auth context

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { preferences },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.error();
    }
}

export async function GET() {
    const userId = 'mockUserId'; // Replace with actual user ID from session/auth context

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { preferences: true },
        });

        return NextResponse.json(user?.preferences || {});
    } catch (error) {
        return NextResponse.error();
    }
}