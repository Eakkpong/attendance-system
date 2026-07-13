'use client';

import { useState } from 'react';
import Link from 'next/link';
import SessionActions from '@/components/SessionActions';

type Session = {
  id: string;
  name: string;
  notes: string | null;
  createdAt: Date;
  isActive: boolean;
};

export default function SessionListClient({ sessions, courseId }: { sessions: Session[], courseId: string }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(session => {
    const term = searchTerm.toLowerCase();
    const nameMatch = session.name.toLowerCase().includes(term);
    const notesMatch = session.notes?.toLowerCase().includes(term) ?? false;
    return nameMatch || notesMatch;
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
        <input 
          type="text" 
          placeholder="ค้นหาคาบเรียน (ชื่อ, หมายเหตุ)..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '2.5rem', padding: '0.5rem 0.5rem 0.5rem 2.5rem', fontSize: '0.95rem' }}
        />
        <svg 
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      {sessions.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
          <p className="text-muted">No sessions created yet. Create one to start taking attendance!</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
          <p className="text-muted">ไม่พบคาบเรียนที่ค้นหา</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ชื่อคาบเรียน (Name)</th>
                <th>หมายเหตุ (Notes)</th>
                <th>สร้างเมื่อ (Date)</th>
                <th>จัดการ (Actions)</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map(session => (
                <tr key={session.id}>
                  <td style={{ fontWeight: 500 }}>
                    <Link href={`/sessions/${session.id}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                      {session.name}
                    </Link>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.9rem' }}>
                    {session.notes || '-'}
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.9rem' }} suppressHydrationWarning>
                    {new Date(session.createdAt).toLocaleDateString()} {new Date(session.createdAt).toLocaleTimeString()}
                  </td>
                  <td>
                    <SessionActions 
                      sessionId={session.id} 
                      courseId={courseId} 
                      initialName={session.name} 
                      initialNotes={session.notes || ''} 
                    />
                  </td>
                  <td>
                    {session.isActive ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.35rem 0.65rem', borderRadius: '999px' }}>ACTIVE</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', background: 'rgba(0, 0, 0, 0.05)', padding: '0.35rem 0.65rem', borderRadius: '999px' }}>CLOSED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
