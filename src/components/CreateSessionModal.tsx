'use client';

import { useState } from 'react';
import { createSession } from '@/app/actions';

export default function CreateSessionModal({ courseId }: { courseId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(`Session on ${new Date().toLocaleDateString()}`);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requireLocation, setRequireLocation] = useState(false);
  const [radius, setRadius] = useState(100);
  const [locationError, setLocationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocationError('');

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      if (requireLocation) {
        if (!navigator.geolocation) {
          throw new Error('เบราว์เซอร์ของคุณไม่รองรับ GPS');
        }

        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      await createSession(courseId, name, notes, requireLocation, lat, lng, requireLocation ? radius : undefined);
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
      if (error instanceof GeolocationPositionError) {
        setLocationError('กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้ง (GPS) เพื่อสอนแบบ Onsite หรือเลือกสอนแบบ Online');
      } else {
        setLocationError(error.message || 'เกิดข้อผิดพลาดในการสร้างคาบเรียน');
      }
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
          <div className="glass-container" style={{ width: '90%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="heading-2" style={{ marginTop: 0 }}>สร้างคาบเรียนใหม่</h2>
            {locationError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {locationError}
              </div>
            )}
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
                  rows={2}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '8px',
                    border: '1px solid #ccc', fontSize: '1rem', resize: 'vertical',
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = '#ccc'}
                />
              </div>

              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', border: '1px solid #eee', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                  <input 
                    type="checkbox" 
                    checked={requireLocation} 
                    onChange={e => setRequireLocation(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  บังคับเช็คพิกัด GPS (สอนแบบ Onsite ในห้องเรียน)
                </label>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem', marginLeft: '1.8rem' }}>
                  หากเปิดใช้งาน ระบบจะบันทึกพิกัดของคุณตอนนี้เป็นจุดศูนย์กลางห้องเรียน และนักศึกษาต้องอยู่ในรัศมีที่กำหนดจึงจะเช็คชื่อได้ (สำหรับสอนออนไลน์ให้ปิดตัวเลือกนี้)
                </p>
                
                {requireLocation && (
                  <div style={{ marginTop: '1rem', marginLeft: '1.8rem' }}>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                      ระยะทางที่อนุญาต (เมตร)
                    </label>
                    <input 
                      type="number" 
                      value={radius}
                      onChange={e => setRadius(Number(e.target.value))}
                      min="10"
                      max="1000"
                      required
                      style={{
                        width: '120px', padding: '0.5rem', borderRadius: '6px',
                        border: '1px solid #ccc', fontSize: '0.9rem'
                      }}
                    />
                  </div>
                )}
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
