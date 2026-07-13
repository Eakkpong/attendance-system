'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-container" style={{ textAlign: 'center', padding: '3rem', maxWidth: '400px', width: '100%' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '120px', height: 'auto', marginBottom: '1.5rem', objectFit: 'contain' }} />
        <h1 className="heading-1" style={{ marginBottom: '1rem', fontSize: '1.5rem', lineHeight: '1.4', color: 'var(--primary-color)' }}>ระบบเช็คชื่อ<br/>วิทยาลัยชุมชนสมุทรสาคร</h1>
        <p className="text-muted" style={{ marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
          กรุณาเข้าสู่ระบบ เพื่อจัดการรายวิชา<br />
          และบันทึกเวลาเรียนของนักศึกษา
        </p>

        <button 
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="btn" 
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px',
            backgroundColor: 'white',
            color: '#333',
            border: '1px solid #ddd',
            fontSize: '1rem',
            padding: '12px'
          }}
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google Logo" 
            style={{ width: '24px', height: '24px' }} 
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
