'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Do not show Navbar on the login page, if not authenticated, or in presentation mode
  if (status !== 'authenticated' || pathname === '/login' || pathname.includes('/presentation')) {
    return null;
  }

  return (
    <nav className="navbar-glass">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <Link href="/" className="navbar-brand">
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <span className="brand-text" style={{ background: 'var(--primary-color)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SMKCC Portal</span>
        </Link>

        {/* Navigation Links */}
        <div className="navbar-links">
          <Link 
            href="/" 
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
          >
            🏠 ศูนย์กลาง
          </Link>
          <Link 
            href="/attendance" 
            className={`nav-link ${pathname.startsWith('/attendance') || pathname.startsWith('/courses') ? 'active' : ''}`}
          >
            📝 ระบบเช็คชื่อ
          </Link>
          <Link 
            href="/trash" 
            className={`nav-link ${pathname === '/trash' ? 'active' : ''}`}
          >
            🗑️ ถังขยะ
          </Link>
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{session.user?.name || session.user?.email}</span>
            <span className="user-role">Teacher</span>
          </div>
          <Link href="/api/auth/signout" className="btn btn-danger btn-sm" style={{ textDecoration: 'none' }}>
            ออกจากระบบ
          </Link>
        </div>
      </div>
    </nav>
  );
}
