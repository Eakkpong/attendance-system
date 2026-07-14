'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteStudentEnrollment, updateStudentName } from '@/app/actions';

type Student = {
  studentId: string;
  name: string;
};

type Enrollment = {
  id: string;
  student: Student;
};

export default function StudentListClient({ enrollments, courseId }: { enrollments: Enrollment[], courseId: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredEnrollments = enrollments.filter(enrollment => {
    const term = searchTerm.toLowerCase();
    const idMatch = enrollment.student.studentId.toLowerCase().includes(term);
    const nameMatch = enrollment.student.name.toLowerCase().includes(term);
    return idMatch || nameMatch;
  });

  const handleDelete = async (e: React.MouseEvent, studentId: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (window.confirm('คุณต้องการลบนักศึกษาคนนี้ออกจากรายวิชาใช่หรือไม่?')) {
      setDeletingId(studentId);
      try {
        await deleteStudentEnrollment(courseId, studentId);
      } catch (error) {
        console.error(error);
        alert('เกิดข้อผิดพลาดในการลบ');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const startEdit = (e: React.MouseEvent, studentId: string, currentName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(studentId);
    setEditName(currentName);
  };

  const saveEdit = async (e: React.MouseEvent | React.FormEvent, studentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!editName.trim()) {
      alert('ชื่อนักศึกษาห้ามเว้นว่าง');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateStudentName(courseId, studentId, editName.trim());
      setEditingId(null);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการแก้ไขชื่อ');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="glass-container" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <div className="flex-between-responsive" style={{ marginBottom: '1rem' }}>
        <h2 className="heading-2" style={{ margin: 0 }}>รายชื่อนักศึกษาทั้งหมด</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.9rem' }}>
            {enrollments.length} คน
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
        <input 
          type="text" 
          placeholder="ค้นหานักศึกษา (รหัส, ชื่อ)..." 
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
      
      {enrollments.length === 0 ? (
        <p className="text-muted">ยังไม่มีรายชื่อนักศึกษาในรายวิชานี้ กรุณาเพิ่มรายชื่อ</p>
      ) : filteredEnrollments.length === 0 ? (
        <p className="text-muted">ไม่พบรายชื่อนักศึกษาที่ค้นหา</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredEnrollments.map((enrollment) => (
            <Link 
              href={`/courses/${courseId}/students/${enrollment.student.studentId}`} 
              key={enrollment.id} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div 
                style={{ 
                  padding: '10px 15px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '8px',
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: deletingId === enrollment.student.studentId ? 0.5 : 1
                }}
                onMouseEnter={e => { 
                  if (editingId !== enrollment.student.studentId) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; 
                    e.currentTarget.style.border = '1px solid var(--primary-color)'; 
                  }
                }}
                onMouseLeave={e => { 
                  if (editingId !== enrollment.student.studentId) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; 
                    e.currentTarget.style.border = '1px solid transparent'; 
                  }
                }}
              >
                {/* Left side: Info or Edit Form */}
                {editingId === enrollment.student.studentId ? (
                  <form 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onSubmit={(e) => saveEdit(e, enrollment.student.studentId)}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, marginRight: '1rem' }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{enrollment.student.studentId}</div>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-field"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                      autoFocus
                      disabled={isSaving}
                    />
                  </form>
                ) : (
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold' }}>{enrollment.student.studentId}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {enrollment.student.name}
                    </div>
                  </div>
                )}

                {/* Right side: Actions */}
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  {editingId === enrollment.student.studentId ? (
                    <>
                      <button
                        onClick={(e) => saveEdit(e, enrollment.student.studentId)}
                        disabled={isSaving}
                        style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '0.5rem' }}
                        title="Save"
                      >
                        {isSaving ? '...' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={isSaving}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}
                        title="Cancel"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => startEdit(e, enrollment.student.studentId, enrollment.student.name)}
                        disabled={deletingId === enrollment.student.studentId}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.background = 'rgba(79,70,229,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                        title="Edit Name"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, enrollment.student.studentId)}
                        disabled={deletingId === enrollment.student.studentId}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                        title="Remove Student"
                      >
                        {deletingId === enrollment.student.studentId ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
