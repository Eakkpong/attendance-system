'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { addStudentsToCourse } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function StudentUpload({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Expecting headers: studentId, name (or similar)
          const students = results.data.map((row: any) => {
            // Flexible matching for headers
            const id = row['รหัสนักศึกษา'] || row['studentId'] || row['id'] || row['รหัส'];
            const name = row['ชื่อ-สกุล'] || row['ชื่อ'] || row['name'] || row['fullname'];
            
            if (!id || !name) {
              throw new Error('รูปแบบไฟล์ไม่ถูกต้อง ต้องมีคอลัมน์ "รหัสนักศึกษา" และ "ชื่อ-สกุล"');
            }
            return { studentId: String(id).trim(), name: String(name).trim() };
          });

          if (students.length === 0) throw new Error('ไม่พบข้อมูลนักศึกษาในไฟล์');

          await addStudentsToCourse(courseId, students);
          alert(`อัปโหลดรายชื่อสำเร็จ จำนวน ${students.length} คน`);
          router.refresh();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
          // Reset file input
          e.target.value = '';
        }
      },
      error: (err) => {
        setError('เกิดข้อผิดพลาดในการอ่านไฟล์');
        setLoading(false);
      }
    });
  };

  return (
    <div className="glass-container" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <h2 className="heading-2" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>จัดการรายชื่อนักศึกษา</h2>
      <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
        อัปโหลดไฟล์ Excel / CSV ที่มีคอลัมน์ "รหัสนักศึกษา" และ "ชื่อ-สกุล"
      </p>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
      
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
  );
}
