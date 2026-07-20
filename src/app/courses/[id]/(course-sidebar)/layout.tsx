import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SidebarNavigation from '@/components/SidebarNavigation';

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) {
    redirect('/api/auth/signin');
  }

  const resolvedParams = await params;

  const course = await prisma.course.findUnique({
    where: { id: resolvedParams.id, deletedAt: null },
    select: { id: true, code: true, name: true, group: true, notes: true, teacherId: true }
  });

  if (!course) {
    notFound();
  }

  if (course.teacherId !== sessionUser.user.id) {
    redirect('/');
  }

  return (
    <div className="course-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 64px)' }}>
      {/* Top Header for Course */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div className="flex-between-responsive" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <div>
            <h1 className="heading-2" style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </Link>
              {course.code} - {course.name}
              {course.group && <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>กลุ่ม {course.group}</span>}
            </h1>
            {course.notes && <p className="text-muted" style={{ margin: 0, paddingLeft: '2.5rem' }}>{course.notes}</p>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link 
              href={`/courses/${course.id}/presentation`}
              title="นำเสนอขึ้นจอ (Presentation Mode)"
              className="btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', padding: 0, transition: 'all 0.2s' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </Link>
            <a 
              href={`/api/courses/${course.id}/export`} 
              download
              title="ดาวน์โหลดรายงาน (Export CSV)"
              className="btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'none', width: '40px', height: '40px', borderRadius: '50%', padding: 0, transition: 'all 0.2s' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div style={{ display: 'flex', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '2rem 0' }}>
        {/* Sidebar */}
        <SidebarNavigation courseId={course.id} />
        
        {/* Content */}
        <div style={{ flex: 1, padding: '0 2rem', minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
