'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function createCourse(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error('Unauthorized');
  }

  const code = formData.get('code') as string;
  const name = formData.get('name') as string;
  const group = formData.get('group') as string;
  const notes = formData.get('notes') as string;

  if (!code || !name) return;

  const course = await prisma.course.create({
    data: {
      code,
      name,
      group: group || null,
      notes: notes || null,
      teacherId: session.user.id
    },
  });

  revalidatePath('/');
  redirect(`/courses/${course.id}`);
}

export async function updateCourse(courseId: string, code: string, name: string, group?: string, notes?: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.teacherId !== sessionUser.user.id) {
    throw new Error('Unauthorized');
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { 
      code, 
      name,
      group: group || null,
      notes: notes || null
    }
  });

  revalidatePath('/');
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteCourse(courseId: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.teacherId !== sessionUser.user.id) {
    throw new Error('Unauthorized');
  }

  // Soft delete by setting deletedAt
  await prisma.course.update({
    where: { id: courseId },
    data: { deletedAt: new Date() }
  });

  revalidatePath('/');
  redirect('/');
}

export async function restoreCourse(courseId: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  await prisma.course.update({
    where: { id: courseId },
    data: { deletedAt: null }
  });
  revalidatePath('/');
  revalidatePath('/trash');
}

export async function permanentlyDeleteCourse(courseId: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.teacherId !== sessionUser.user.id) {
    throw new Error('Unauthorized');
  }

  await prisma.course.delete({
    where: { id: courseId }
  });
  revalidatePath('/trash');
}

export async function createSession(
  courseId: string, 
  name: string, 
  notes?: string, 
  requireLocation: boolean = false, 
  latitude?: number | null, 
  longitude?: number | null, 
  radius?: number
) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.teacherId !== sessionUser.user.id) {
    throw new Error('Unauthorized');
  }

  const session = await prisma.session.create({
    data: {
      courseId,
      name,
      notes: notes || null,
      requireLocation,
      latitude,
      longitude,
      radius: radius || 100,
    }
  });

  revalidatePath(`/courses/${courseId}`);
  redirect(`/sessions/${session.id}`);
}

export async function closeSession(sessionId: string, courseId: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { course: true }
  });

  if (!session || session.course.teacherId !== sessionUser.user.id) {
    throw new Error('Unauthorized');
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { isActive: false }
  });

  revalidatePath(`/courses/${courseId}`);
}

export async function updateSession(sessionId: string, courseId: string, name: string, notes?: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  await prisma.session.update({
    where: { id: sessionId },
    data: { name, notes: notes || null }
  });

  revalidatePath(`/courses/${courseId}`);
}

export async function deleteSession(sessionId: string, courseId: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  // Soft delete
  await prisma.session.update({
    where: { id: sessionId },
    data: { deletedAt: new Date() }
  });

  revalidatePath(`/courses/${courseId}`);
}

export async function restoreSession(sessionId: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  await prisma.session.update({
    where: { id: sessionId },
    data: { deletedAt: null }
  });
  revalidatePath('/trash');
}

export async function permanentlyDeleteSession(sessionId: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  await prisma.session.delete({
    where: { id: sessionId }
  });
  revalidatePath('/trash');
}

export async function addStudentsToCourse(courseId: string, students: { studentId: string; name: string }[]) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.teacherId !== sessionUser.user.id) {
    throw new Error('Unauthorized');
  }

  // Ensure students exist in the Student table, then create Enrollments
  // This is best done in a transaction, but since SQLite has some limits on nested writes,
  // we can do upsert for each student or bulk create.

  for (const student of students) {
    // Upsert student (create if not exists, otherwise update name)
    const savedStudent = await prisma.student.upsert({
      where: { studentId: student.studentId },
      update: { name: student.name },
      create: { studentId: student.studentId, name: student.name }
    });

    // Create enrollment if not exists
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId: savedStudent.id,
          courseId: courseId
        }
      },
      update: {},
      create: {
        studentId: savedStudent.id,
        courseId: courseId
      }
    });
  }

  revalidatePath(`/courses/${courseId}`);
}

export async function resetDevice(courseId: string, studentId: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  await prisma.student.update({
    where: { studentId },
    data: { deviceId: null }
  });

  revalidatePath(`/courses/${courseId}/students/${studentId}`);
}

export async function updateStudentName(courseId: string, studentId: string, newName: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  // Verify course ownership
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.teacherId !== sessionUser.user.id) {
    throw new Error('Unauthorized');
  }

  await prisma.student.update({
    where: { studentId },
    data: { name: newName }
  });

  revalidatePath(`/courses/${courseId}`);
}

export async function upsertAttendance(sessionId: string, studentId: string, status: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { course: true }
  });
  
  if (!session || session.course.teacherId !== sessionUser.user.id) {
    throw new Error('Unauthorized');
  }

  if (status === 'ABSENT') {
    // If they are absent, delete any existing attendance record
    await prisma.attendance.deleteMany({
      where: { sessionId, studentId }
    });
  } else {
    // Upsert the record with the new status
    await prisma.attendance.upsert({
      where: {
        sessionId_studentId: { sessionId, studentId }
      },
      update: {
        status
      },
      create: {
        sessionId,
        studentId,
        status
      }
    });
  }

  revalidatePath(`/sessions/${sessionId}`);
}

export async function deleteStudentEnrollment(courseId: string, studentId: string) {
  const sessionUser = await getServerSession(authOptions);
  if (!sessionUser || !sessionUser.user?.id) throw new Error('Unauthorized');

  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course || course.teacherId !== sessionUser.user.id) {
    throw new Error('Unauthorized');
  }

  const student = await prisma.student.findUnique({
    where: { studentId }
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Delete enrollment
  await prisma.enrollment.delete({
    where: {
      studentId_courseId: {
        studentId: student.id,
        courseId
      }
    }
  });

  // Revalidate cache
  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}/students/${studentId}`);
}
