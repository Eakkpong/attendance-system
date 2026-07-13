import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const courseId = resolvedParams.id;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      enrollments: {
        include: {
          student: true
        }
      },
      sessions: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: {
          attendances: true
        }
      }
    }
  });

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  if (course.teacherId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate CSV Content
  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  
  // Headers
  const sessionHeaders = course.sessions.map((s, index) => `"${s.name || `คาบที่ ${index + 1}`}"`).join(',');
  const headers = `รหัสนักศึกษา,ชื่อ-สกุล,${sessionHeaders ? sessionHeaders + ',' : ''}รวมมาเรียน,รวมขาดเรียน`;

  // Rows
  // Sort students by studentId
  const students = course.enrollments.map(e => e.student).sort((a, b) => a.studentId.localeCompare(b.studentId));
  
  const rows = students.map(student => {
    let presentCount = 0;
    let absentCount = 0;

    const sessionData = course.sessions.map(session => {
      // Find if student checked in
      const didAttend = session.attendances.some(a => a.studentId === student.studentId);
      if (didAttend) {
        presentCount++;
        return '"มา"';
      } else {
        absentCount++;
        return '"ขาด"';
      }
    });

    const rowData = [
      `"${student.studentId}"`,
      `"${student.name}"`,
      ...sessionData,
      presentCount,
      absentCount
    ];

    return rowData.join(',');
  });

  const csvContent = BOM + [headers, ...rows].join('\n');

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="course_${course.code}_attendance_report.csv"`,
    },
  });
}
