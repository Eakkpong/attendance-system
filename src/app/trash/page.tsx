import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { restoreCourse, permanentlyDeleteCourse, restoreSession, permanentlyDeleteSession } from '@/app/actions';

export default async function TrashPage() {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) redirect('/api/auth/signin');

  // Fetch soft-deleted courses
  const deletedCourses = await prisma.course.findMany({
    where: { 
      teacherId: sessionUser.user.id,
      deletedAt: { not: null } 
    },
    orderBy: { deletedAt: 'desc' }
  });

  // Fetch soft-deleted sessions (only for courses that are NOT deleted)
  // If a course is deleted, its sessions are effectively deleted, but we only show the Course in the trash.
  const deletedSessions = await prisma.session.findMany({
    where: {
      deletedAt: { not: null },
      course: {
        teacherId: sessionUser.user.id,
        deletedAt: null // Only show sessions if the parent course still exists
      }
    },
    include: { course: true },
    orderBy: { deletedAt: 'desc' }
  });

  return (
    <main className="glass-container">
      <h1 className="heading-1">🗑️ ถังขยะ (Trash)</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        ข้อมูลที่ถูกลบจะแสดงอยู่ที่นี่ คุณสามารถกู้คืนหรือลบทิ้งอย่างถาวรได้
      </p>

      <section style={{ marginBottom: '3rem' }}>
        <h2 className="heading-2">รายวิชาที่ถูกลบ ({deletedCourses.length})</h2>
        {deletedCourses.length === 0 ? (
          <p className="text-muted">ไม่มีรายวิชาในถังขยะ</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {deletedCourses.map(course => (
              <li key={course.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{course.code} - {course.name}</h3>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                    ลบเมื่อ: {course.deletedAt?.toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <form action={restoreCourse.bind(null, course.id)}>
                    <button type="submit" className="btn btn-primary">♻️ กู้คืน</button>
                  </form>
                  <form action={permanentlyDeleteCourse.bind(null, course.id)}>
                    <button type="submit" className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }}>
                      ❌ ลบถาวร
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="heading-2">คาบเรียนที่ถูกลบ ({deletedSessions.length})</h2>
        {deletedSessions.length === 0 ? (
          <p className="text-muted">ไม่มีคาบเรียนในถังขยะ</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {deletedSessions.map(session => (
              <li key={session.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0' }}>{session.name}</h3>
                  <p className="text-muted" style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>
                    จากวิชา: {session.course.code}
                  </p>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                    ลบเมื่อ: {session.deletedAt?.toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <form action={restoreSession.bind(null, session.id)}>
                    <button type="submit" className="btn btn-primary">♻️ กู้คืน</button>
                  </form>
                  <form action={permanentlyDeleteSession.bind(null, session.id)}>
                    <button type="submit" className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }}>
                      ❌ ลบถาวร
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
