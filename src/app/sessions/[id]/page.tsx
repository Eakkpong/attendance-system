import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import DynamicQR from '@/components/DynamicQR';
import AttendanceList from '@/components/AttendanceList';
import { closeSession } from '@/app/actions';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import os from 'os';
import { Suspense } from 'react';

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

async function SessionDetailsServer({ sessionId, baseUrl }: { sessionId: string, baseUrl: string }) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      course: {
        include: {
          enrollments: {
            include: { student: true },
            orderBy: { student: { studentId: 'asc' } }
          }
        }
      },
      attendances: {
        orderBy: { timestamp: 'desc' }
      }
    }
  });

  if (!session) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="heading-2">Attendance QR</h2>
        {session.isActive ? (
          <DynamicQR sessionId={session.id} baseUrl={baseUrl} />
        ) : (
          <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p style={{ color: 'var(--danger)', fontWeight: 600 }}>This session is closed.</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="heading-2">Attendance Dashboard</h2>
        <AttendanceList 
          sessionId={session.id} 
          initialAttendances={session.attendances} 
          isActive={session.isActive} 
          enrollments={session.course.enrollments}
        />
      </div>
    </div>
  );
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) {
    redirect('/api/auth/signin');
  }

  const resolvedParams = await params;
  
  // Fetch ONLY basic session info for instant rendering
  const session = await prisma.session.findUnique({
    where: { id: resolvedParams.id },
    select: { 
      id: true, 
      name: true, 
      notes: true, 
      isActive: true, 
      courseId: true,
      course: {
        select: { code: true, name: true, teacherId: true }
      }
    }
  });

  if (!session) {
    notFound();
  }

  if (session.course.teacherId !== sessionUser.user.id) {
    redirect('/'); // Unauthorized
  }

  // Figure out the base URL for the QR code
  const headersList = await headers();
  let host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const localIp = getLocalIpAddress();
    const port = host.split(':')[1] || '3000';
    host = `${localIp}:${port}`;
  }

  const baseUrl = `${protocol}://${host}`;
  const closeSessionWithId = closeSession.bind(null, session.id, session.courseId);

  return (
    <div className="glass-container">
      <Link href={`/courses/${session.courseId}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block', fontWeight: 500 }}>
        &larr; Back to Course
      </Link>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: '0.25rem' }}>{session.name}</h1>
          {session.notes && (
            <p style={{ color: '#666', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
              📝 {session.notes}
            </p>
          )}
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            {session.course.code} - {session.course.name}
          </p>
        </div>
        {session.isActive && (
          <form action={closeSessionWithId}>
            <button type="submit" className="btn" style={{ backgroundColor: 'var(--danger)', color: 'white' }}>
              Close Session
            </button>
          </form>
        )}
      </div>

      <Suspense fallback={
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p className="text-muted" style={{ marginTop: '1rem' }}>กำลังประมวลผลข้อมูลการเช็คชื่อ...</p>
        </div>
      }>
        <SessionDetailsServer sessionId={session.id} baseUrl={baseUrl} />
      </Suspense>
    </div>
  );
}
