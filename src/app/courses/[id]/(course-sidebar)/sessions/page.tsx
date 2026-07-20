import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SessionListClient from '@/components/SessionListClient';
import CreateSessionModal from '@/components/CreateSessionModal';

export default async function CourseSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) {
    redirect('/api/auth/signin');
  }

  const resolvedParams = await params;
  
  const course = await prisma.course.findUnique({
    where: { id: resolvedParams.id, deletedAt: null },
    include: {
      sessions: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { 
          attendances: { 
            select: { studentId: true, status: true } 
          } 
        }
      },
      enrollments: true
    }
  });

  if (!course) {
    notFound();
  }

  if (course.teacherId !== sessionUser.user.id) {
    redirect('/');
  }

  const totalStudents = course.enrollments.length;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="flex-between-responsive" style={{ marginBottom: '1.5rem' }}>
        <h2 className="heading-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          จัดการคาบเรียน (Sessions)
        </h2>
        <CreateSessionModal courseId={course.id} />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', padding: '1.5rem' }}>
        <SessionListClient sessions={course.sessions} courseId={course.id} />
      </div>
    </div>
  );
}
