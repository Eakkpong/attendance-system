'use client';

import { useState } from 'react';
import Link from 'next/link';
import CourseActions from '@/components/CourseActions';

type Course = {
  id: string;
  code: string;
  name: string;
  group: string | null;
  notes: string | null;
};

export default function CourseListClient({ courses }: { courses: Course[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courses.filter(course => {
    const term = searchTerm.toLowerCase();
    const codeMatch = course.code.toLowerCase().includes(term);
    const nameMatch = course.name.toLowerCase().includes(term);
    const groupMatch = course.group?.toLowerCase().includes(term) ?? false;
    return codeMatch || nameMatch || groupMatch;
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <input 
          type="text" 
          placeholder="ค้นหารายวิชา (รหัส, ชื่อ, กลุ่มเรียน)..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '2.5rem' }}
        />
        <svg 
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      {courses.length === 0 ? (
        <p className="text-muted">ยังไม่มีรายวิชา กรุณาสร้างรายวิชาใหม่เพื่อเริ่มต้น!</p>
      ) : filteredCourses.length === 0 ? (
        <p className="text-muted">ไม่พบรายวิชาที่ค้นหา</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredCourses.map((course) => (
            <li key={course.id} style={{ marginBottom: '1rem' }}>
              <div className="course-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <Link href={`/courses/${course.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
                    {course.code} - {course.name}
                    {course.group && <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '0.5rem', backgroundColor: 'rgba(0,0,0,0.05)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>กลุ่ม {course.group}</span>}
                  </h3>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>จัดการคาบเรียนและเวลาเรียน &rarr;</p>
                </Link>
                <CourseActions 
                  courseId={course.id} 
                  initialCode={course.code} 
                  initialName={course.name} 
                  initialGroup={course.group || ''}
                  initialNotes={course.notes || ''}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
