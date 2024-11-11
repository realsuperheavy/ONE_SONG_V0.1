import { NextResponse } from 'next/server';
import { UserService } from '@/lib/firebase/services/user';

const userService = new UserService();

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const profile = await userService.getUserProfile(params.userId);
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const preferences = await request.json();
    await userService.updateUserPreferences(params.userId, preferences);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
} 