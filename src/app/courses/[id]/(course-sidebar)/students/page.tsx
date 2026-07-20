import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import StudentListClient from '@/components/StudentListClient';
import StudentUpload from '@/components/StudentUpload';

export default async function CourseStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) {
    redirect('/api/auth/signin');
  }

  const resolvedParams = await params;
  
  const course = await prisma.course.findUnique({
    where: { id: resolvedParams.id, deletedAt: null },
    include: {
      enrollments: {
        include: { student: true },
        orderBy: { student: { studentId: 'asc' } }
      }
    }
  });

  if (!course) {
    notFound();
  }

  if (course.teacherId !== sessionUser.user.id) {
    redirect('/');
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="flex-between-responsive" style={{ marginBottom: '1.5rem' }}>
        <h2 className="heading-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          รายชื่อนักศึกษา (Students)
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>เพิ่มนักศึกษา</h3>
          <StudentUpload courseId={course.id} />
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', padding: '1.5rem' }}>
          <StudentListClient enrollments={course.enrollments} courseId={course.id} />
        </div>
      </div>
    </div>
  );
}
