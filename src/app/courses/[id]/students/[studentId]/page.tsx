import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { resetDevice } from '@/app/actions';

export default async function StudentDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string, studentId: string }> 
}) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) {
    redirect('/api/auth/signin');
  }

  const resolvedParams = await params;
  const courseId = resolvedParams.id;
  const studentIdentifier = resolvedParams.studentId;

  const course = await prisma.course.findUnique({
    where: { id: courseId, deletedAt: null },
    include: {
      sessions: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!course) {
    notFound();
  }

  if (course.teacherId !== sessionUser.user.id) {
    redirect('/'); // Redirect if they don't own it
  }

  const student = await prisma.student.findUnique({
    where: { studentId: studentIdentifier }
  });

  if (!student) {
    notFound();
  }

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: student.id, // note: enrollment uses student's UUID
        courseId: course.id
      }
    }
  });

  if (!enrollment) {
    notFound();
  }

  // Fetch all attendances for this student in this course's sessions
  const sessionIds = course.sessions.map(s => s.id);
  const attendances = await prisma.attendance.findMany({
    where: {
      sessionId: { in: sessionIds },
      studentId: studentIdentifier // attendance uses studentId string
    }
  });

  // Create a map for quick lookup
  const attendanceMap = new Map();
  attendances.forEach(a => {
    attendanceMap.set(a.sessionId, a);
  });

  const totalSessions = course.sessions.length;
  const attendedSessions = attendances.length;
  const attendancePercentage = totalSessions === 0 ? 0 : Math.round((attendedSessions / totalSessions) * 100);
  
  const resetDeviceAction = resetDevice.bind(null, course.id, student.studentId);

  return (
    <main className="glass-container">
      <Link href={`/courses/${courseId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', textDecoration: 'none', marginBottom: '1.5rem', fontWeight: 500 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        กลับไปที่รายวิชา
      </Link>

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="heading-1" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {student.name}
            <span style={{ fontSize: '1.25rem', fontWeight: 'normal', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.1)', padding: '0.2rem 0.8rem', borderRadius: '999px' }}>{student.studentId}</span>
          </h1>
          <p className="text-muted" style={{ margin: 0, fontSize: '1.1rem', marginBottom: '1rem' }}>วิชา: {course.code} {course.name}</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>อุปกรณ์ (มือถือ):</div>
            {student.deviceId ? (
              <>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                  ผูกบัญชีแล้ว
                </span>
                <form action={resetDeviceAction}>
                  <button type="submit" className="btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                    ปลดล็อกเครื่อง
                  </button>
                </form>
              </>
            ) : (
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9CA3AF', background: '#F3F4F6', padding: '0.35rem 0.75rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                ยังไม่ผูกบัญชี
              </span>
            )}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.05)', padding: '1rem 2rem', borderRadius: '12px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>สถิติการเข้าเรียน</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: attendancePercentage >= 80 ? 'var(--success)' : attendancePercentage >= 50 ? '#F59E0B' : '#EF4444' }}>
            {attendedSessions} / {totalSessions}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            คิดเป็น {attendancePercentage}%
          </div>
        </div>
      </div>

      <h2 className="heading-2" style={{ marginBottom: '1rem' }}>ประวัติการเข้าเรียนรายคาบ</h2>
      
      {course.sessions.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
          <p className="text-muted">ยังไม่มีคาบเรียนในรายวิชานี้</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ครั้งที่ / ชื่อคาบเรียน</th>
                <th>วันที่สร้างคาบเรียน</th>
                <th>สถานะการเข้าเรียน</th>
                <th>เวลาที่เช็คชื่อ</th>
              </tr>
            </thead>
            <tbody>
              {course.sessions.map((session, index) => {
                const attendance = attendanceMap.get(session.id);
                const isPresent = !!attendance;
                
                return (
                  <tr key={session.id} style={{ background: isPresent ? 'transparent' : 'rgba(239, 68, 68, 0.05)' }}>
                    <td style={{ fontWeight: 500 }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>#{index + 1}</span>
                      {session.name}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.9rem' }}>
                      {new Date(session.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td>
                      {isPresent ? (
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          เข้าเรียน
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          ขาดเรียน
                        </span>
                      )}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.9rem' }}>
                      {isPresent ? (
                        `${new Date(attendance.timestamp).toLocaleDateString('th-TH')} ${new Date(attendance.timestamp).toLocaleTimeString('th-TH')}`
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
