import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CourseDashboard from '@/components/CourseDashboard';

export default async function CourseDashboardPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Dashboard Data Calculation
  const totalStudents = course.enrollments.length;
  const totalSessions = course.sessions.length;
  
  let overallAttendanceRate = 0;
  const chronologicalSessions = [...course.sessions].reverse();
  const attendanceTrend = chronologicalSessions.map(session => {
    const presentCount = session.attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    return {
      sessionName: session.name || new Date(session.createdAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
      attendanceRate: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0
    };
  });

  const studentStats = new Map<string, { attended: number, student: { id: string, name: string | null, studentId: string } }>();
  course.enrollments.forEach(e => {
    studentStats.set(e.student.studentId, { attended: 0, student: e.student });
  });

  let totalAttendances = 0;

  course.sessions.forEach(session => {
    session.attendances.forEach(a => {
      // Count ONLY 'PRESENT' and 'LATE' as attended. Ignore 'ABSENT' and 'LEAVE'.
      if (a.status === 'PRESENT' || a.status === 'LATE') {
        const stats = studentStats.get(a.studentId);
        if (stats) {
          stats.attended += 1;
          totalAttendances += 1;
        }
      }
    });
  });

  if (totalStudents > 0 && totalSessions > 0) {
    overallAttendanceRate = Math.round((totalAttendances / (totalStudents * totalSessions)) * 100);
  }

  const atRiskStudents = Array.from(studentStats.values())
    .map(s => ({
      ...s.student,
      name: s.student.name || '',
      attendanceRate: totalSessions === 0 ? 0 : Math.round((s.attended / totalSessions) * 100),
      attended: s.attended,
      total: totalSessions
    }))
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
    <div style={{ paddingBottom: '2rem' }}>
      <CourseDashboard data={dashboardData} />
    </div>
  );
}
