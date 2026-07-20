'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import Link from 'next/link';

interface StudentRisk {
  id: string;
  name: string;
  studentId: string;
  attendanceRate: number;
  attended: number;
  total: number;
}

interface TrendData {
  sessionName: string;
  attendanceRate: number;
}

interface CourseDashboardProps {
  data: {
    totalStudents: number;
    totalSessions: number;
    overallAttendanceRate: number;
    attendanceTrend: TrendData[];
    atRiskStudents: StudentRisk[];
    courseId: string;
  }
}

export default function CourseDashboard({ data }: CourseDashboardProps) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="flex-between-responsive" style={{ marginBottom: '1rem' }}>
        <h2 className="heading-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          ภาพรวมรายวิชา (Dashboard)
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a 
            href={`/courses/${data.courseId}/presentation`}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            นำเสนอขึ้นจอ
          </a>
          <a 
            href={`/api/courses/${data.courseId}/export`} 
            download
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#10B981', color: 'white', border: 'none', padding: '0.5rem 1rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export CSV
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-responsive" style={{ gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>นักศึกษาทั้งหมด</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{data.totalStudents} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>คน</span></div>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>คาบเรียนที่สอนไปแล้ว</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{data.totalSessions} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>คาบ</span></div>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>อัตราการเข้าเรียนเฉลี่ยรวม</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: data.overallAttendanceRate >= 80 ? 'var(--success)' : data.overallAttendanceRate >= 60 ? '#F59E0B' : 'var(--danger)' }}>
            {data.overallAttendanceRate}%
          </div>
        </div>
      </div>

      <div className="grid-responsive" style={{ gap: '1.5rem', gridTemplateColumns: '2fr 1fr' }}>
        {/* Chart */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>แนวโน้มการเข้าเรียนแต่ละคาบ</h3>
          <div style={{ width: '100%', height: '250px' }}>
            {data.attendanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.attendanceTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="sessionName" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [`${value}%`, 'เข้าเรียน']}
                    labelStyle={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.25rem' }}
                  />
                  <Line type="monotone" dataKey="attendanceRate" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                ยังไม่มีข้อมูลการเช็คชื่อ
              </div>
            )}
          </div>
        </div>

        {/* At-risk Students */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            นักศึกษาที่ต้องเฝ้าระวัง
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>เวลาเรียนต่ำกว่า 80%</p>
          
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '220px', paddingRight: '0.5rem' }}>
            {data.atRiskStudents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.atRiskStudents.map(student => (
                  <Link 
                    key={student.id} 
                    href={`/courses/${data.courseId}/students/${student.studentId}`}
                    style={{ display: 'block', padding: '0.75rem', background: '#FEF2F2', borderRadius: '8px', textDecoration: 'none', transition: 'background 0.2s', border: '1px solid #FCA5A5' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: '#991B1B', fontSize: '0.95rem' }}>{student.name}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--danger)' }}>{student.attendanceRate}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#B91C1C' }}>
                      <span>รหัส: {student.studentId}</span>
                      <span>มา {student.attended}/{student.total}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', flexDirection: 'column', gap: '0.5rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span>ยอดเยี่ยม! ไม่มีนักศึกษากลุ่มเสี่ยง</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
