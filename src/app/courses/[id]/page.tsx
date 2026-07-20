import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import StudentUpload from '@/components/StudentUpload';
import CreateSessionModal from '@/components/CreateSessionModal';
import SessionListClient from '@/components/SessionListClient';
import StudentListClient from '@/components/StudentListClient';
import CourseDashboard from '@/components/CourseDashboard';
import { Suspense } from 'react';

async function CourseDetailsServer({ courseId }: { courseId: string }) {
  const course = await prisma.course.findUnique({
    where: { id: courseId, deletedAt: null },
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
      enrollments: {
        include: { student: true },
        orderBy: { student: { studentId: 'asc' } }
      }
    }
  });

  if (!course) return null;

  // Dashboard Data Calculation
  const totalStudents = course.enrollments.length;
  const totalSessions = course.sessions.length;
  
  let overallAttendanceRate = 0;
  const chronologicalSessions = [...course.sessions].reverse();
  const attendanceTrend = chronologicalSessions.map((session, index) => {
    const sessionAttendances = session.attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    return {
      sessionName: session.name || `คาบที่ ${index + 1}`,
      attendanceRate: totalStudents > 0 ? Math.round((sessionAttendances / totalStudents) * 100) : 0,
      sessionAttendances
    };
  });
  
  const totalAttendances = attendanceTrend.reduce((acc, curr) => acc + curr.sessionAttendances, 0);

  if (totalStudents > 0 && totalSessions > 0) {
    overallAttendanceRate = Math.round((totalAttendances / (totalStudents * totalSessions)) * 100);
  }

  const studentStats = new Map<string, { attended: number, student: { id: string, name: string | null, studentId: string } }>();
  course.enrollments.forEach(e => {
    studentStats.set(e.student.studentId, { attended: 0, student: e.student });
  });

  course.sessions.forEach(session => {
    session.attendances.forEach(a => {
      if (a.status === 'PRESENT' || a.status === 'LATE') {
        const stats = studentStats.get(a.studentId);
        if (stats) {
          stats.attended += 1;
        }
      }
    });
  });

  const atRiskStudents = Array.from(studentStats.values())
    .map(stats => {
      const rate = totalSessions > 0 ? Math.round((stats.attended / totalSessions) * 100) : 100;
      return {
        id: stats.student.id,
        name: stats.student.name || 'Unknown',
        studentId: stats.student.studentId,
        attendanceRate: rate,
        attended: stats.attended,
        total: totalSessions
      };
    })
    .filter(s => s.attendanceRate < 80 && totalSessions > 0)
    .sort((a, b) => a.attendanceRate - b.attendanceRate);

  const dashboardData = {
    totalStudents,
    totalSessions,
    overallAttendanceRate,
    attendanceTrend,
    atRiskStudents,
    courseId: course.id
  };

  return (
    <>
      <CourseDashboard data={dashboardData} />

      <div className="flex-between-responsive" style={{ marginBottom: '1.5rem', marginTop: '2rem' }}>
        <h2 className="heading-2" style={{ margin: 0 }}>คาบเรียน (Sessions)</h2>
        <CreateSessionModal courseId={course.id} />
      </div>

      <SessionListClient sessions={course.sessions} courseId={course.id} />

      <div style={{ marginTop: '3rem' }}>
        <StudentUpload courseId={course.id} />
        
        <StudentListClient enrollments={course.enrollments} courseId={course.id} />
      </div>
    </>
  );
}

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) {
    redirect('/api/auth/signin');
  }

  const resolvedParams = await params;
  
  // Fetch ONLY basic course details for instant rendering of the page shell
  const course = await prisma.course.findUnique({
    where: { id: resolvedParams.id, deletedAt: null },
    select: { id: true, code: true, name: true, group: true, notes: true, teacherId: true }
  });

  if (!course) {
    notFound();
  }

  if (course.teacherId !== sessionUser.user.id) {
    redirect('/'); // Redirect if they don't own it
  }

  return (
    <main className="glass-container">
      <h1 className="heading-1" style={{ marginBottom: '0.5rem' }}>
        {course.code} - {course.name}
        {course.group && <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '0.75rem', backgroundColor: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.6rem', borderRadius: '999px', verticalAlign: 'middle' }}>กลุ่ม {course.group}</span>}
      </h1>
      
      {course.notes && (
        <p className="text-muted" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
          <strong>หมายเหตุ:</strong> {course.notes}
        </p>
      )}

      <Suspense fallback={
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p className="text-muted" style={{ marginTop: '1rem' }}>กำลังประมวลผลข้อมูลและสถิติรายวิชา...</p>
        </div>
      }>
        <CourseDetailsServer courseId={course.id} />
      </Suspense>
    </main>
  );
}
