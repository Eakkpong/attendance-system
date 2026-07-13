import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const resolvedParams = await params;
  const attendances = await prisma.attendance.findMany({
    where: { sessionId: resolvedParams.sessionId },
    orderBy: { timestamp: 'desc' }
  });
  
  return NextResponse.json({ attendances });
}
