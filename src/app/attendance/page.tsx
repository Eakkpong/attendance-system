import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { createCourse } from '@/app/actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import DashboardTabs from '@/components/DashboardTabs';
import CourseListClient from '@/components/CourseListClient';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  const courses = await prisma.course.findMany({
    where: { teacherId: session.user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="glass-container">
      <DashboardTabs 
        courseList={<CourseListClient courses={courses} />}
        createCourseForm={(
          <div style={{ maxWidth: '600px' }}>
            <form action={createCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="code" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>รหัสวิชา (Course Code) <span style={{ color: 'red' }}>*</span></label>
                <input type="text" id="code" name="code" className="input-field" placeholder="e.g. CS101" required />
              </div>
              <div>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อวิชา (Course Name) <span style={{ color: 'red' }}>*</span></label>
                <input type="text" id="name" name="name" className="input-field" placeholder="e.g. Intro to Computer Science" required />
              </div>
              <div>
                <label htmlFor="group" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>กลุ่มเรียน (Group) <span className="text-muted" style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>(ไม่บังคับ)</span></label>
                <input type="text" id="group" name="group" className="input-field" placeholder="e.g. 65/1, วันอาทิตย์" />
              </div>
              <div>
                <label htmlFor="notes" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>หมายเหตุ (Notes) <span className="text-muted" style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>(ไม่บังคับ)</span></label>
                <textarea id="notes" name="notes" className="input-field" placeholder="รายละเอียดเพิ่มเติม..." rows={2} style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                สร้างรายวิชา (Create Course)
              </button>
            </form>
          </div>
        )}
      />
    </div>
  );
}
