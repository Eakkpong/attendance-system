'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarNavigation({ courseId }: { courseId: string }) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'ภาพรวม (Dashboard)',
      href: `/courses/${courseId}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
      ),
      exact: true
    },
    {
      name: 'คาบเรียน (Sessions)',
      href: `/courses/${courseId}/sessions`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      ),
      exact: false
    },
    {
      name: 'รายชื่อนักศึกษา (Students)',
      href: `/courses/${courseId}/students`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
      ),
      exact: false
    }
  ];

  return (
    <div style={{ width: '250px', flexShrink: 0, paddingRight: '1rem', borderRight: '1px solid var(--glass-border)' }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
