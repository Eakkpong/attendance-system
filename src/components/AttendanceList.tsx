'use client';

import { useEffect, useState, useTransition } from 'react';
import type { Attendance, Enrollment, Student } from '@prisma/client';
import { upsertAttendance } from '@/app/actions';

type EnrollmentWithStudent = Enrollment & { student: Student };

export default function AttendanceList({ 
  sessionId, 
  initialAttendances,
  isActive,
  enrollments = []
}: { 
  sessionId: string; 
  initialAttendances: Attendance[];
  isActive: boolean;
  enrollments?: EnrollmentWithStudent[];
}) {
  const [attendances, setAttendances] = useState<Attendance[]>(initialAttendances);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isActive) return;

    const fetchAttendances = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/attendance`);
        const data = await res.json();
        setAttendances(data.attendances);
      } catch (e) {
        console.error("Failed to fetch attendances", e);
      }
    };

    fetchAttendances();
    const intervalId = setInterval(fetchAttendances, 10000); // Poll every 10s

    return () => clearInterval(intervalId);
  }, [sessionId, isActive]);

  const handleStatusChange = (studentId: string, status: string) => {
    startTransition(async () => {
      // Optimistic update
      setAttendances(prev => {
        if (status === 'ABSENT') {
          return prev.filter(a => a.studentId !== studentId);
        }
        
        const existing = prev.find(a => a.studentId === studentId);
        if (existing) {
          return prev.map(a => a.studentId === studentId ? { ...a, status } : a);
        } else {
          return [...prev, { id: 'temp', sessionId, studentId, studentName: null, status, timestamp: new Date() }];
        }
      });
      
      try {
        await upsertAttendance(sessionId, studentId, status);
      } catch (e) {
        console.error(e);
        // Silently fail for now, real app should toast
      }
    });
  };

  const getStatusColor = (status: string, isActive: boolean, hasRecord: boolean) => {
    if (!hasRecord && isActive) {
      return { bg: 'rgba(0, 0, 0, 0.05)', border: '#9ca3af', text: '#6b7280' };
    }
    switch (status) {
      case 'PRESENT': return { bg: 'rgba(16, 185, 129, 0.1)', border: '#10B981', text: '#059669' };
      case 'LATE': return { bg: 'rgba(245, 158, 11, 0.1)', border: '#F59E0B', text: '#D97706' };
      case 'PERSONAL_LEAVE': return { bg: 'rgba(59, 130, 246, 0.1)', border: '#3B82F6', text: '#2563EB' };
      case 'SICK_LEAVE': return { bg: 'rgba(168, 85, 247, 0.1)', border: '#A855F7', text: '#9333EA' };
      case 'ABSENT': return { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444', text: '#DC2626' };
      default: return { bg: '#f1f5f9', border: '#cbd5e1', text: '#64748b' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'มาเรียน';
      case 'LATE': return 'มาสาย';
      case 'PERSONAL_LEAVE': return 'ลากิจ';
      case 'SICK_LEAVE': return 'ลาป่วย';
      case 'ABSENT': return 'ขาดเรียน';
    }
  };

  return (
    <div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {enrollments.map(enrollment => {
          const record = attendances.find(a => a.studentId === enrollment.student.studentId);
          const hasRecord = !!record;
          const currentStatus = record ? (record.status || 'PRESENT') : 'ABSENT';
          const colors = getStatusColor(currentStatus, isActive, hasRecord);
          const isPending = !hasRecord && isActive;

          return (
            <li key={enrollment.id} style={{ 
              padding: '1rem 1.5rem', 
              background: isPending ? 'rgba(255,255,255,0.7)' : (currentStatus === 'ABSENT' ? 'rgba(255,255,255,0.5)' : 'white'), 
              borderRadius: '12px',
              border: isPending ? '1px dashed #ccc' : (currentStatus === 'ABSENT' ? '1px dashed #ddd' : '1px solid transparent'),
              boxShadow: (isPending || currentStatus === 'ABSENT') ? 'none' : '0 2px 4px rgba(0,0,0,0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: `4px solid ${colors.border}`
            }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--text-main)' }}>
                  {enrollment.student.studentId}
                </p>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                  {enrollment.student.name}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <select 
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(enrollment.student.studentId, e.target.value)}
                  disabled={isPending && false} // Just false, allow change
                  style={{
                    padding: '0.3rem 0.5rem',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.bg,
                    color: colors.text,
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="PRESENT">✅ มาเรียน (Present)</option>
                  <option value="LATE">⏰ มาสาย (Late)</option>
                  <option value="PERSONAL_LEAVE">📝 ลากิจ (Personal Leave)</option>
                  <option value="SICK_LEAVE">🤒 ลาป่วย (Sick Leave)</option>
                  <option value="ABSENT">
                    {isPending ? "⏳ รอเช็คชื่อ (Pending)" : "❌ ขาดเรียน (Absent)"}
                  </option>
                </select>
                
                {record && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </li>
          );
        })}

        {enrollments.length === 0 && attendances.map(record => {
          const currentStatus = record.status || 'PRESENT';
          const colors = getStatusColor(currentStatus, isActive, true);

          return (
            <li key={record.id} style={{ 
              padding: '1rem 1.5rem', 
              background: 'white', 
              borderRadius: '12px',
              borderLeft: `4px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
               <div>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--text-main)' }}>{record.studentId}</p>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{record.studentName}</p>
              </div>
              <span style={{ fontSize: '0.85rem', padding: '4px 10px', background: colors.bg, color: colors.text, borderRadius: '999px', fontWeight: 600 }}>
                {getStatusLabel(currentStatus)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
