import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Mock user data for demonstration purposes
    const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'testuser@example.com',
        // Add more user fields as necessary
    };

    // Simulate login logic (this will be replaced with real authentication logic later)
    const { username, password } = await request.json();

    // For now, we will just return the mock user if the username and password are provided
    if (username && password) {
        return NextResponse.json(mockUser);
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
}