import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getServerSession(authOptions);
    if (!sessionUser || !sessionUser.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const courseId = resolvedParams.id;

    // Fetch the course and verify ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sessions: {
          where: { deletedAt: null },
          orderBy: { date: 'asc' }, // Chronological order
          include: { attendances: true }
        },
        enrollments: {
          include: { student: true },
          orderBy: { student: { studentId: 'asc' } }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.teacherId !== sessionUser.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build CSV data structure
    const dataRows = [];
    const totalSessions = course.sessions.length;

    for (const enrollment of course.enrollments) {
      const student = enrollment.student;
      const row: Record<string, string | number> = {
        'รหัสนักศึกษา': `\u200B${student.studentId}`, // Zero-width space forces Excel to treat as text
        'ชื่อ-สกุล': student.name,
      };

      let presentCount = 0;
      let lateCount = 0;
      let personalLeaveCount = 0;
      let sickLeaveCount = 0;
      let absentCount = 0;

      course.sessions.forEach((session, index) => {
        const sessionName = session.name || `คาบที่ ${index + 1}`;
        const attendanceRecord = session.attendances.find(a => a.studentId === student.studentId);
        
        let statusDisplay = 'ขาดเรียน';
        if (attendanceRecord) {
          // Fix timezone issue for reliable Bangkok time in all Node environments
          const d = new Date(attendanceRecord.timestamp);
          const bkkTime = new Date(d.getTime() + (7 * 60 * 60 * 1000));
          const hh = bkkTime.getUTCHours().toString().padStart(2, '0');
          const mm = bkkTime.getUTCMinutes().toString().padStart(2, '0');
          const timeStr = `${hh}:${mm}`;

          switch (attendanceRecord.status) {
            case 'PRESENT':
              statusDisplay = `มาเรียน (${timeStr})`;
              presentCount++;
              break;
            case 'LATE':
              statusDisplay = `มาสาย (${timeStr})`;
              lateCount++;
              break;
            case 'PERSONAL_LEAVE':
            case 'EXCUSED': // Legacy support
              statusDisplay = `ลากิจ (${timeStr})`;
              personalLeaveCount++;
              break;
            case 'SICK_LEAVE':
              statusDisplay = `ลาป่วย (${timeStr})`;
              sickLeaveCount++;
              break;
            case 'ABSENT':
              statusDisplay = `ขาดเรียน (${timeStr})`;
              absentCount++;
              break;
            default:
              statusDisplay = `มาเรียน (${timeStr})`; // Fallback for old records without explicit status
              presentCount++;
          }
        } else {
          absentCount++;
        }

        row[sessionName] = statusDisplay;
      });

      row['มาเรียนรวม (ครั้ง)'] = presentCount;
      row['มาสายรวม (ครั้ง)'] = lateCount;
      row['ลากิจรวม (ครั้ง)'] = personalLeaveCount;
      row['ลาป่วยรวม (ครั้ง)'] = sickLeaveCount;
      row['ขาดเรียนรวม (ครั้ง)'] = absentCount;
      
      const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 100;
      row['อัตราการเข้าเรียน (%)'] = attendanceRate + '%';

      dataRows.push(row);
    }

    // Convert to CSV
    const csv = Papa.unparse(dataRows, {
      quotes: true, // Wrap everything in quotes to handle Thai characters safely
    });

    // Add BOM for Excel to properly recognize UTF-8
    const bom = '\uFEFF';
    const csvWithBom = bom + csv;

    // Return as a downloadable file
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="attendance.csv"; filename*=UTF-8''attendance_${encodeURIComponent(course.code)}.csv`);

    return new NextResponse(csvWithBom, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
