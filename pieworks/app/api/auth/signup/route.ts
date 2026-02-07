import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Mock user creation logic
    const { username, email, password } = await request.json();

    // Here you would typically validate the input and create a user in the database
    const mockUser = {
        id: '1',
        username,
        email,
        // Password should be hashed in a real implementation
        password, 
    };

    // Return the mock user object
    return NextResponse.json(mockUser, { status: 201 });
}