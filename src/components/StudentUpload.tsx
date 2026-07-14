'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { addStudentsToCourse } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function StudentUpload({ courseId }: { courseId: string }) {
  const [activeTab, setActiveTab] = useState<'csv' | 'manual' | 'paste'>('paste');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Manual Add State
  const [manualId, setManualId] = useState('');
  const [manualName, setManualName] = useState('');

  // Paste State
  const [pasteData, setPasteData] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    clearMessages();

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const students = results.data.map((row: any) => {
            const id = row['รหัสนักศึกษา'] || row['studentId'] || row['id'] || row['รหัส'];
            const name = row['ชื่อ-สกุล'] || row['ชื่อ'] || row['name'] || row['fullname'];
            
            if (!id || !name) {
              throw new Error('รูปแบบไฟล์ไม่ถูกต้อง ต้องมีคอลัมน์ "รหัสนักศึกษา" และ "ชื่อ-สกุล"');
            }
            return { studentId: String(id).trim(), name: String(name).trim() };
          });

          if (students.length === 0) throw new Error('ไม่พบข้อมูลนักศึกษาในไฟล์');

          await addStudentsToCourse(courseId, students);
          setSuccess(`เพิ่มรายชื่อสำเร็จ จำนวน ${students.length} คน`);
          router.refresh();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
          e.target.value = '';
        }
      },
      error: (err) => {
        setError('เกิดข้อผิดพลาดในการอ่านไฟล์');
        setLoading(false);
      }
    });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim() || !manualName.trim()) {
      setError('กรุณากรอกรหัสและชื่อให้ครบถ้วน');
      return;
    }
    
    setLoading(true);
    clearMessages();
    try {
      await addStudentsToCourse(courseId, [{ studentId: manualId.trim(), name: manualName.trim() }]);
      setSuccess(`เพิ่มนักศึกษา ${manualName} สำเร็จ`);
      setManualId('');
      setManualName('');
      router.refresh();
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteData.trim()) {
      setError('กรุณาวางข้อมูลก่อนกดนำเข้า');
      return;
    }

    setLoading(true);
    clearMessages();
    try {
      // Parse TSV (Tab Separated Values) typically coming from Excel/Google Sheets
      const lines = pasteData.split('\\n').filter(line => line.trim() !== '');
      const students = [];

      for (const line of lines) {
        // Excel paste uses tabs. Fallback to space if tab is not found but there are spaces.
        let parts = line.split('\\t');
        if (parts.length < 2) {
           // If no tabs, try to split by multiple spaces or single space (less reliable but better than failing)
           // Regex: split by 1 or more spaces, taking the first as ID and the rest as Name
           const match = line.trim().match(/^(\\S+)\\s+(.+)$/);
           if (match) {
             parts = [match[1], match[2]];
           }
        }

        if (parts.length >= 2) {
          const id = parts[0].trim();
          // Join the rest in case name had tabs/spaces
          const name = parts.slice(1).join(' ').trim();
          
          // Skip header rows if user accidentally copied them
          if (id.includes('รหัส') || id.includes('studentId') || name.includes('ชื่อ')) {
            continue;
          }

          if (id && name) {
            students.push({ studentId: id, name });
          }
        }
      }

      if (students.length === 0) {
        throw new Error('ไม่พบข้อมูลที่สามารถอ่านได้ กรุณาตรวจสอบว่ามี 2 คอลัมน์ (รหัส และ ชื่อ)');
      }

      await addStudentsToCourse(courseId, students);
      setSuccess(`นำเข้ารายชื่อสำเร็จ จำนวน ${students.length} คน`);
      setPasteData('');
      router.refresh();
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-container" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <h2 className="heading-2" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>จัดการรายชื่อนักศึกษา</h2>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => { setActiveTab('paste'); clearMessages(); }}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            borderBottom: activeTab === 'paste' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'paste' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'paste' ? 600 : 400
          }}
        >
          📝 วางจาก Excel
        </button>
        <button 
          onClick={() => { setActiveTab('manual'); clearMessages(); }}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            borderBottom: activeTab === 'manual' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'manual' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'manual' ? 600 : 400
          }}
        >
          ➕ เพิ่มทีละคน
        </button>
        <button 
          onClick={() => { setActiveTab('csv'); clearMessages(); }}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            borderBottom: activeTab === 'csv' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'csv' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'csv' ? 600 : 400
          }}
        >
          📁 อัปโหลด CSV
        </button>
      </div>

      {error && <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
      {success && <div style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}

      {/* Tab Content: Paste from Excel */}
      {activeTab === 'paste' && (
        <div>
          <p className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            คัดลอกข้อมูล 2 คอลัมน์ (รหัสนักศึกษา และ ชื่อ-สกุล) จากโปรแกรม Excel / Google Sheets แล้วนำมาวางในกล่องด้านล่างนี้ได้เลย
          </p>
          <textarea
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            placeholder="ตัวอย่างการวาง:&#10;650001    สมชาย ใจดี&#10;650002    สมหญิง รักเรียน"
            className="input-field"
            style={{ width: '100%', height: '120px', resize: 'vertical', fontFamily: 'monospace', marginBottom: '1rem' }}
            disabled={loading}
          />
          <button onClick={handlePasteSubmit} disabled={loading || !pasteData.trim()} className="btn" style={{ width: '100%' }}>
            {loading ? 'กำลังนำเข้าข้อมูล...' : 'นำเข้ารายชื่อ'}
          </button>
        </div>
      )}

      {/* Tab Content: Manual Add */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>รหัสนักศึกษา</label>
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="เช่น 650001"
                className="input-field"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>ชื่อ-สกุล</label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className="input-field"
                required
                disabled={loading}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn" style={{ width: '100%' }}>
            {loading ? 'กำลังเพิ่มข้อมูล...' : 'เพิ่มรายชื่อ'}
          </button>
        </form>
      )}

      {/* Tab Content: CSV */}
      {activeTab === 'csv' && (
        <div>
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            อัปโหลดไฟล์ CSV ที่มีคอลัมน์ "รหัสนักศึกษา" และ "ชื่อ-สกุล"
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label className="btn" style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์ CSV'}
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
                disabled={loading}
              />
            </label>
            <a 
              href="data:text/csv;charset=utf-8,รหัสนักศึกษา,ชื่อ-สกุล%0A650001,สมชาย ใจดี%0A650002,สมหญิง รักเรียน" 
              download="template.csv"
              className="text-muted"
              style={{ fontSize: '0.9rem', textDecoration: 'underline' }}
            >
              ดาวน์โหลดไฟล์ตัวอย่าง
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
