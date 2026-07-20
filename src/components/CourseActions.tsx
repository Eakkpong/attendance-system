'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateCourse, deleteCourse } from '@/app/actions';

export default function CourseActions({ 
  courseId, 
  initialCode, 
  initialName,
  initialGroup,
  initialNotes
}: { 
  courseId: string, 
  initialCode: string, 
  initialName: string,
  initialGroup?: string,
  initialNotes?: string
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(initialName);
  const [group, setGroup] = useState(initialGroup || '');
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateCourse(courseId, code, name, group, notes);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "คำเตือน: คุณต้องการลบรายวิชานี้ใช่หรือไม่?\n\nการลบจะทำให้ข้อมูลคาบเรียน รายชื่อนักศึกษา และประวัติการเข้าเรียนทั้งหมดหายไปอย่างถาวร!"
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteCourse(courseId);
    } catch (error) {
      console.error(error);
      setIsDeleting(false); // only reset if error, since success will redirect
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
        <button 
          onClick={(e) => { e.preventDefault(); setIsEditModalOpen(true); }}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.4rem', borderRadius: '50%', color: 'var(--text-muted)',
            transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = 'var(--primary-color)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title="Edit Course"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); handleDelete(); }}
          disabled={isDeleting}
          style={{ 
            background: 'none', border: 'none', cursor: isDeleting ? 'wait' : 'pointer',
            padding: '0.4rem', borderRadius: '50%', color: 'var(--text-muted)',
            transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isDeleting ? 0.5 : 1
          }}
          onMouseEnter={e => { if(!isDeleting) { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; } }}
          onMouseLeave={e => { if(!isDeleting) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
          title="Delete Course"
        >
          {isDeleting ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          )}
        </button>
      </div>

      {isEditModalOpen && mounted && createPortal(
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out',
          }} 
          onClick={(e) => { 
            if (e.target === e.currentTarget) {
              setIsEditModalOpen(false);
            }
          }}
        >
          <div className="glass-container" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
            <h2 className="heading-2" style={{ marginTop: 0 }}>แก้ไขรายวิชา</h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  รหัสวิชา (Course Code) <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                    border: '1px solid #ccc', fontSize: '1rem',
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = '#ccc'}
                />
              </div>

              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  ชื่อวิชา (Course Name) <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                    border: '1px solid #ccc', fontSize: '1rem',
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = '#ccc'}
                />
              </div>

              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  กลุ่มเรียน (Group) <span style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>(ไม่บังคับ)</span>
                </label>
                <input 
                  type="text" 
                  value={group}
                  onChange={e => setGroup(e.target.value)}
                  placeholder="e.g. 65/1, วันอาทิตย์"
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                    border: '1px solid #ccc', fontSize: '1rem',
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = '#ccc'}
                />
              </div>

              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  หมายเหตุ (Notes) <span style={{ fontWeight: 'normal', fontSize: '0.85rem' }}>(ไม่บังคับ)</span>
                </label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                    border: '1px solid #ccc', fontSize: '1rem', resize: 'vertical',
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = '#ccc'}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="btn" 
                  style={{ background: 'transparent', color: '#666' }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
