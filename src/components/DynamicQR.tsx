'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function DynamicQR({ sessionId, baseUrl }: { sessionId: string; baseUrl: string }) {
  const [token, setToken] = useState<string | null>(null);

  const refreshInterval = 15000; // 15 seconds

  // Poll every 3 seconds to ensure we catch the token change quickly
  // The server token only changes every 15 seconds.
  const pollInterval = 3000; 

  useEffect(() => {
    let isMounted = true;

    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/token?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          setToken(data.token);
        }
      } catch (e) {
        console.error("Failed to fetch token", e);
      }
    };

    fetchToken();
    const intervalId = setInterval(fetchToken, pollInterval);

    // Also fetch immediately when the tab becomes visible again
    // to prevent stuck QR codes if the browser throttled the interval
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchToken();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId]);

  if (!token) return <div style={{ height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading QR Code...</p></div>;

  const checkinUrl = `${baseUrl}/checkin/${sessionId}?token=${token}`;

  return (
    <div style={{ 
      background: 'rgba(255, 255, 255, 0.95)', 
      borderRadius: '32px', 
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      position: 'relative',
      padding: '0.5rem',
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{ padding: '2rem 2rem 1rem 2rem', background: 'white', borderRadius: '28px', width: '100%' }}>
        <QRCodeSVG value={checkinUrl} size={320} level="H" includeMargin={false} />
      </div>
      
      <div style={{ width: '100%', padding: '1.5rem 1rem', textAlign: 'center' }}>
        <p style={{ margin: '0 0 1rem 0', color: '#4B5563', fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
          สแกนเพื่อเช็คชื่อเข้าเรียน
        </p>
        <p style={{ margin: '0 0 1.5rem 0', color: '#9CA3AF', fontSize: '0.85rem' }}>
          ⏳ รหัสจะเปลี่ยนอัตโนมัติใน <span style={{color: 'var(--primary-color)', fontWeight: 600}}>15</span> วินาที
        </p>
        
        {/* Progress Bar Container */}
        <div style={{ 
          width: '90%', 
          margin: '0 auto',
          height: '8px', 
          background: '#E5E7EB', 
          borderRadius: '999px',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
        }}>
          {/* Animated Bar */}
          <div 
            key={token} // Key change forces re-render and restarts animation
            style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, #4F46E5, #60A5FA)',
              width: '100%',
              borderRadius: '999px',
              boxShadow: '0 0 10px rgba(96, 165, 250, 0.5)',
              animation: `shrink ${refreshInterval}ms linear forwards`
            }} 
          />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}} />
    </div>
  );
}
