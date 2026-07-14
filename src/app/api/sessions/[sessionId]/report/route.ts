import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const sessionId = resolvedParams.sessionId;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      attendances: true,
      course: {
        include: {
          enrollments: {
            include: {
              student: true
            }
          }
        }
      }
    }
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.course.teacherId !== sessionUser.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate CSV Content
  const BOM = '\uFEFF'; // UTF-8 BOM
  
  // Headers
  const headers = 'รหัสนักศึกษา,ชื่อ-สกุล,สถานะ,เวลาเข้าเรียน';

  // Sort students by studentId
  const students = session.course.enrollments.map(e => e.student).sort((a, b) => a.studentId.localeCompare(b.studentId));
  
  const rows = students.map(student => {
    // Find if student checked in
    const attendance = session.attendances.find(a => a.studentId === student.studentId);
    
    let status = '"ขาด"';
    let timeStr = '"-"';
    
    if (attendance) {
      switch (attendance.status) {
        case 'PRESENT':
          status = '"มาเรียน"';
          break;
        case 'LATE':
          status = '"สาย"';
          break;
        case 'PERSONAL_LEAVE':
        case 'EXCUSED':
          status = '"ลากิจ"';
          break;
        case 'SICK_LEAVE':
          status = '"ลาป่วย"';
          break;
        case 'ABSENT':
          status = '"ขาด"';
          break;
        default:
          status = '"มาเรียน"';
      }
      timeStr = `"${new Date(attendance.timestamp).toLocaleTimeString()}"`;
    }
    const rowData = [
      `"${student.studentId}"`,
      `"${student.name}"`,
      status,
      timeStr
    ];

    return rowData.join(',');
  });

  const csvContent = BOM + [headers, ...rows].join('\n');
  const safeSessionName = (session.name || 'session').replace(/[^a-z0-9]/gi, '_').toLowerCase();

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeSessionName}_attendance.csv"`,
    },
  });
}
