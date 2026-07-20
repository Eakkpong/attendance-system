import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function PresentationPage({ params }: { params: Promise<{ id: string }> }) {
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
  
  const studentStats = new Map<string, { attended: number, student: { id: string, name: string | null, studentId: string } }>();
  course.enrollments.forEach(e => {
    studentStats.set(e.student.studentId, { attended: 0, student: e.student });
  });

  let totalAttendances = 0;

  course.sessions.forEach(session => {
    session.attendances.forEach(a => {
      // Count only PRESENT and LATE as attended
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

  const allStudents = Array.from(studentStats.values()).map(s => {
    const percentage = totalSessions === 0 ? 0 : Math.round((s.attended / totalSessions) * 100);
    return {
      ...s.student,
      percentage
    };
  });

  // Sort: At risk first (lowest percentage), then by studentId
  allStudents.sort((a, b) => {
    if (a.percentage !== b.percentage) {
      return a.percentage - b.percentage;
    }
    return a.studentId.localeCompare(b.studentId);
  });

  const atRiskStudents = allStudents.filter(s => s.percentage < 80);
  const normalStudents = allStudents.filter(s => s.percentage >= 80);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: 'var(--background)',
      overflowY: 'auto',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--foreground)' }}>
              {course.code} {course.name}
            </h1>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)', margin: 0 }}>
              ภาพรวมการเข้าเรียน (Presentation Mode)
            </p>
          </div>
          <Link href={`/courses/${course.id}`} className="btn" style={{ fontSize: '1.2rem', padding: '0.75rem 1.5rem', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--foreground)', border: 'none' }}>
            ✕ ปิดโหมดนำเสนอ
          </Link>
        </div>

        {/* Big KPI */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '3rem', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>อัตราการเข้าเรียนเฉลี่ย</h2>
            <div style={{ fontSize: '6rem', fontWeight: 'bold', color: 'var(--primary-color)', lineHeight: 1 }}>
              {overallAttendanceRate}%
            </div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#fef2f2', padding: '3rem', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '2px solid #fecaca' }}>
            <h2 style={{ fontSize: '2rem', color: '#dc2626', margin: '0 0 1rem 0' }}>นักศึกษากลุ่มเสี่ยง (&lt;80%)</h2>
            <div style={{ fontSize: '6rem', fontWeight: 'bold', color: '#dc2626', lineHeight: 1 }}>
              {atRiskStudents.length} <span style={{ fontSize: '2rem', fontWeight: 'normal' }}>คน</span>
            </div>
          </div>
        </div>

        {/* At Risk List (Only show if there are any) */}
        {atRiskStudents.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#dc2626', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              ⚠️ รายชื่อกลุ่มเสี่ยง (ต้องติดตาม)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {atRiskStudents.map(student => (
                <div key={student.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', borderLeft: '8px solid #dc2626', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{student.studentId}</div>
                  <div style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{student.name || 'ไม่มีชื่อ'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, height: '12px', backgroundColor: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${student.percentage}%`, height: '100%', backgroundColor: '#dc2626' }}></div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{student.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Normal List */}
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>✅ รายชื่อนักศึกษาทั้งหมด</h2>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.2rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>รหัสนักศึกษา</th>
                  <th style={{ padding: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ชื่อ-สกุล</th>
                  <th style={{ padding: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)', textAlign: 'right' }}>เปอร์เซ็นต์</th>
                </tr>
              </thead>
              <tbody>
                {normalStudents.map((student, idx) => (
                  <tr key={student.id} style={{ borderBottom: idx === normalStudents.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1.5rem', fontWeight: '500' }}>{student.studentId}</td>
                    <td style={{ padding: '1.5rem' }}>{student.name || '-'}</td>
                    <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '0.5rem 1rem', 
                        backgroundColor: student.percentage >= 90 ? '#d1fae5' : '#fef3c7',
                        color: student.percentage >= 90 ? '#065f46' : '#92400e',
                        borderRadius: '999px',
                        fontWeight: 'bold'
                      }}>
                        {student.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
                {normalStudents.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มีข้อมูล</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
