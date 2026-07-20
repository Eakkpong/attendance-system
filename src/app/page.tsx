import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function PortalPage() {
  const sessionUser = await getServerSession(authOptions);
  
  if (!sessionUser) {
    redirect('/login');
  }

  const apps = [
    {
      id: 'attendance',
      name: 'ระบบเช็คชื่อเข้าเรียน',
      description: 'จัดการรายวิชา เช็คชื่อ และดูสถิติการเข้าเรียนของนักศึกษา',
      icon: '📝',
      href: '/attendance',
      active: true,
      color: 'rgba(99, 102, 241, 0.1)',
      textColor: 'var(--primary-color)'
    },
    {
      id: 'grading',
      name: 'ระบบส่งเกรด (Coming Soon)',
      description: 'บันทึกคะแนนเก็บ ประมวลผลเกรด และส่งออกรายงานผลการเรียน',
      icon: '📊',
      href: '#',
      active: false,
      color: 'rgba(156, 163, 175, 0.1)',
      textColor: '#9CA3AF'
    },
    {
      id: 'scheduling',
      name: 'ระบบจัดตารางสอน (Coming Soon)',
      description: 'ตรวจสอบตารางสอนประจำสัปดาห์ และจัดการวันหยุดชดเชย',
      icon: '🗓️',
      href: '#',
      active: false,
      color: 'rgba(156, 163, 175, 0.1)',
      textColor: '#9CA3AF'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="heading-1" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          ยินดีต้อนรับสู่ <span style={{ color: 'var(--primary-color)' }}>SMKCC Portal</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          ศูนย์รวมระบบสารสนเทศสำหรับบุคลากร วิทยาลัยชุมชนสมุทรสาคร
          กรุณาเลือกระบบที่คุณต้องการใช้งานด้านล่างนี้
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '2rem' 
      }}>
        {apps.map((app) => {
          const content = (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '2rem',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--glass-border)',
              boxShadow: app.active ? '0 10px 30px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.3s ease',
              opacity: app.active ? 1 : 0.6,
              cursor: app.active ? 'pointer' : 'not-allowed',
            }}
            className={app.active ? 'portal-card-active' : ''}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: app.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1.5rem'
              }}>
                {app.icon}
              </div>
              <h3 className="heading-3" style={{ color: app.textColor, marginBottom: '0.75rem', fontSize: '1.25rem' }}>
                {app.name}
              </h3>
              <p className="text-muted" style={{ lineHeight: 1.6, flexGrow: 1 }}>
                {app.description}
              </p>
              
              <div style={{ marginTop: '1.5rem' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: app.active ? 'var(--primary-color)' : '#9CA3AF',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>
                  {app.active ? 'เข้าสู่ระบบ ➔' : 'ยังไม่เปิดให้บริการ'}
                </span>
              </div>
            </div>
          );

          if (app.active) {
            return (
              <Link href={app.href} key={app.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                {content}
              </Link>
            );
          }

          return (
            <div key={app.id} style={{ display: 'block' }}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
