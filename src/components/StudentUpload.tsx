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

  const [previewStudents, setPreviewStudents] = useState<{id: string, name: string}[]>([]);

  // Update preview whenever pasteData changes
  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPasteData(text);
    
    if (!text.trim()) {
      setPreviewStudents([]);
      return;
    }

    const lines = text.split('\n').filter(line => line.trim() !== '');
    const students = [];
    for (const line of lines) {
      let parts = line.split('\t');
      if (parts.length < 2) {
         const match = line.trim().match(/^(\S+)\s+(.+)$/);
         if (match) parts = [match[1], match[2]];
      }

      if (parts.length >= 2) {
        const id = parts[0].trim();
        const name = parts.slice(1).join(' ').trim();
        if (id && name && !id.includes('รหัส') && !id.includes('studentId') && !name.includes('ชื่อ')) {
          students.push({ id, name });
        }
      }
    }
    setPreviewStudents(students);
  };

  const handlePasteSubmit = async () => {
    if (previewStudents.length === 0) {
      setError('ไม่พบข้อมูลที่สามารถอ่านได้ กรุณาตรวจสอบว่ามี 2 คอลัมน์ (รหัส และ ชื่อ)');
      return;
    }

    setLoading(true);
    clearMessages();
    try {
      const studentsToSubmit = previewStudents.map(s => ({ studentId: s.id, name: s.name }));
      await addStudentsToCourse(courseId, studentsToSubmit);
      setSuccess(`นำเข้ารายชื่อสำเร็จ จำนวน ${studentsToSubmit.length} คน`);
      setPasteData('');
      setPreviewStudents([]);
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
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.95rem', color: '#334155' }}>ตัวอย่างการคัดลอกคอลัมน์จาก Excel:</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: 'white' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.4rem', background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>รหัสนักศึกษา</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '0.4rem', background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>ชื่อ-สกุล</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.4rem' }}>650001</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.4rem' }}>สมชาย ใจดี</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.4rem' }}>650002</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '0.4rem' }}>สมหญิง รักเรียน</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <textarea
              value={pasteData}
              onChange={handlePasteChange}
              placeholder="วางข้อมูล (Paste) ลงในช่องนี้..."
              className="input-field"
              style={{ width: '100%', height: '150px', resize: 'vertical', fontFamily: 'monospace', marginBottom: '1rem' }}
              disabled={loading}
            />
            <button onClick={handlePasteSubmit} disabled={loading || previewStudents.length === 0} className="btn" style={{ width: '100%' }}>
              {loading ? 'กำลังนำเข้าข้อมูล...' : `นำเข้ารายชื่อ (${previewStudents.length} คน)`}
            </button>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', maxHeight: '400px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--primary-dark)' }}>
              🔎 พรีวิวข้อมูลที่อ่านได้: <span style={{ background: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{previewStudents.length} คน</span>
            </h3>
            
            {previewStudents.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                ยังไม่มีข้อมูลให้แสดง<br/>กรุณาวางข้อมูลลงในช่องด้านซ้าย
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: '2px solid #e2e8f0', padding: '0.5rem', textAlign: 'left' }}>รหัส</th>
                    <th style={{ borderBottom: '2px solid #e2e8f0', padding: '0.5rem', textAlign: 'left' }}>ชื่อ-สกุล</th>
                  </tr>
                </thead>
                <tbody>
                  {previewStudents.map((student, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{student.id}</td>
                      <td style={{ padding: '0.5rem' }}>{student.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
