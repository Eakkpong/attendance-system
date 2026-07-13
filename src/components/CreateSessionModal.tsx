'use client';

import { useState } from 'react';
import { createSession } from '@/app/actions';

export default function CreateSessionModal({ courseId }: { courseId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(`Session on ${new Date().toLocaleDateString()}`);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSession(courseId, name, notes);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary">
        + Create New Session
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-container" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
            <h2 className="heading-2" style={{ marginTop: 0 }}>สร้างคาบเรียนใหม่</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  ชื่อคาบเรียน (Name)
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
                  หมายเหตุ / คำอธิบาย (Notes) - ทางเลือก
                </label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="เช่น การสอนครั้งที่ 1, เน้นบทที่ 3, ติวสอบ..."
                  rows={3}
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
                  onClick={() => setIsOpen(false)} 
                  className="btn" 
                  style={{ background: 'transparent', color: '#666' }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
