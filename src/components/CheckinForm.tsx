'use client';

import { useState, useEffect } from 'react';
import { submitAttendance } from '@/app/checkin/actions';

export default function CheckinForm({ sessionId, token }: { sessionId: string; token: string }) {
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const [deviceId, setDeviceId] = useState('');
  const [isBound, setIsBound] = useState(false);

  useEffect(() => {
    // Auto-fill from localStorage if available
    const savedId = localStorage.getItem('studentId');
    if (savedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStudentId(savedId);
    }
    
    // Get or generate deviceId
    let savedDeviceId = localStorage.getItem('deviceId');
    if (!savedDeviceId) {
      savedDeviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', savedDeviceId);
    }
    setDeviceId(savedDeviceId);
    
    if (savedId && savedDeviceId) {
      setIsBound(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    // Save to local storage for future checkins
    localStorage.setItem('studentId', studentId);
    
    setStatus('submitting');
    
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('token', token);
    formData.append('studentId', studentId);
    if (deviceId) {
      formData.append('deviceId', deviceId);
    }

    try {
      let lat = '';
      let lng = '';

      // Try to get geolocation. We will send it to the server and let the server decide if it's required.
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          lat = pos.coords.latitude.toString();
          lng = pos.coords.longitude.toString();
          formData.append('latitude', lat);
          formData.append('longitude', lng);
        } catch (geoError: any) {
          // We don't fail here immediately. The server will reject it if requireLocation is true.
          console.warn('Geolocation error:', geoError);
          formData.append('geoError', geoError.message || 'Unknown error');
        }
      } else {
        formData.append('geoError', 'Browser does not support GPS');
      }

      const result = await submitAttendance(formData);

      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else if (result.success) {
        localStorage.setItem(`checkedIn_${sessionId}`, 'true');
        setStatus('success');
        setMessage('Attendance recorded successfully!');
      }
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setMessage('เครือข่ายขัดข้อง หรือ เซิร์ฟเวอร์ปฏิเสธการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    }
  };

  useEffect(() => {
    if (localStorage.getItem(`checkedIn_${sessionId}`)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('success');
      setMessage('You have already checked in from this device.');
    }
  }, [sessionId]);

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '12px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Success!</h2>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {status === 'error' && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {message}
        </div>
      )}
      
      <div>
        <label htmlFor="studentId" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
          รหัสนักศึกษา (Student ID)
        </label>
        <input 
          type="text" 
          id="studentId" 
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="input-field" 
          placeholder="กรอกรหัสนักศึกษา..." 
          required 
          disabled={status === 'submitting'}
          style={{ 
            fontSize: '1.25rem', 
            padding: '1rem',
            backgroundColor: status === 'submitting' ? '#f3f4f6' : 'white'
          }}
        />
        {isBound && (
          <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            อุปกรณ์นี้ถูกผูกบัญชีแล้ว
          </p>
        )}
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={status === 'submitting' || !studentId}
        style={{ padding: '1rem', fontSize: '1.125rem' }}
      >
        {status === 'submitting' ? 'Checking in...' : 'Check In'}
      </button>
    </form>
  );
}
