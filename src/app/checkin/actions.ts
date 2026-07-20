'use server';

import { prisma } from '@/lib/prisma';
import { validateToken } from '@/lib/token';
import { revalidatePath } from 'next/cache';

export async function submitAttendance(formData: FormData) {
  const sessionId = formData.get('sessionId') as string;
  const token = formData.get('token') as string;
  const studentId = formData.get('studentId') as string;

  if (!sessionId || !token || !studentId) {
    return { error: 'Missing fields' };
  }

  if (!validateToken(sessionId, token)) {
    return { error: 'QR Code expired. Please scan again.' };
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { course: true }
    });

    if (!session) return { error: 'Session not found' };
    if (!session.isActive) return { error: 'เซสชันนี้ถูกปิดรับการเช็คชื่อแล้ว' };

    // Check if course has any enrollments. If yes, strictly validate student.
    const enrollmentsCount = await prisma.enrollment.count({
      where: { courseId: session.courseId }
    });

    const incomingDeviceId = formData.get('deviceId') as string;

    // Check if incoming deviceId is used by someone else
    if (incomingDeviceId) {
      const otherStudent = await prisma.student.findFirst({
        where: { deviceId: incomingDeviceId, studentId: { not: studentId } }
      });
      if (otherStudent) {
        return { error: 'โทรศัพท์เครื่องนี้ถูกผูกกับรหัสนักศึกษาอื่นแล้ว ไม่สามารถเช็คชื่อให้เพื่อนได้' };
      }
    }

    const studentRecord = await prisma.student.findUnique({ where: { studentId } });

    if (enrollmentsCount > 0) {
      if (!studentRecord) {
        return { error: 'ไม่พบรหัสนักศึกษานี้ในระบบ' };
      }
      
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { courseId: session.courseId, studentId: studentRecord.id } }
      });

      if (!enrollment) {
        return { error: 'ไม่พบรหัสนักศึกษานี้ในรายวิชา กรุณาตรวจสอบอีกครั้ง' };
      }
    }

    // Auto-Device Binding Logic
    if (studentRecord) {
      if (studentRecord.deviceId) {
        if (studentRecord.deviceId !== incomingDeviceId) {
          return { error: 'รหัสนักศึกษานี้ถูกผูกกับโทรศัพท์เครื่องอื่นแล้ว หากต้องการเปลี่ยนเครื่องกรุณาติดต่ออาจารย์' };
        }
      } else if (incomingDeviceId) {
        // First time binding
        await prisma.student.update({
          where: { id: studentRecord.id },
          data: { deviceId: incomingDeviceId }
        });
      }
    } else if (enrollmentsCount === 0) {
      // Create unknown student if no enrollments exist for course
      await prisma.student.create({
        data: { 
          studentId, 
          name: 'Unknown Student', 
          deviceId: incomingDeviceId || undefined 
        }
      });
    }

    // Geolocation Anti-Cheat Validation
    const latStr = formData.get('latitude') as string;
    const lngStr = formData.get('longitude') as string;
    const geoError = formData.get('geoError') as string;
    
    let studentLat: number | null = null;
    let studentLng: number | null = null;

    if (latStr && lngStr) {
      studentLat = parseFloat(latStr);
      studentLng = parseFloat(lngStr);
    }

    if (session.requireLocation) {
      if (!studentLat || !studentLng) {
        return { error: 'คาบเรียนนี้บังคับเช็คพิกัด กรุณาอนุญาตให้เบราว์เซอร์เข้าถึงตำแหน่ง (GPS) ของคุณ' };
      }

      if (session.latitude && session.longitude) {
        const { calculateDistance } = require('@/lib/geo');
        const distance = calculateDistance(
          studentLat, studentLng, 
          session.latitude, session.longitude
        );

        if (distance > session.radius) {
          return { error: `คุณอยู่นอกพื้นที่ห้องเรียน (ระยะห่าง ${Math.round(distance)} เมตร จากที่อนุญาต ${session.radius} เมตร)` };
        }
      }
    }

    await prisma.attendance.create({
      data: {
        sessionId,
        studentId,
        latitude: studentLat,
        longitude: studentLng
      }
    });
    
    // Attempt to update the teacher's session page if they are looking at it
    // Though we are polling, revalidating cache might help if using SSR
    revalidatePath(`/sessions/${sessionId}`);
    
    return { success: true };
  } catch (e: unknown) {
    // Unique constraint violation means already checked in
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      return { error: 'You have already checked in to this session.' };
    }
    return { error: 'Failed to record attendance. Please try again.' };
  }
}
