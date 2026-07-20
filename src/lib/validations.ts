import { z } from 'zod';

export const studentSchema = z.object({
  studentId: z.string().min(1, 'รหัสนักศึกษาต้องไม่เป็นค่าว่าง'),
  name: z.string().min(1, 'ชื่อ-สกุลต้องไม่เป็นค่าว่าง'),
});

export const studentArraySchema = z.array(studentSchema).min(1, 'ต้องมีข้อมูลนักศึกษาอย่างน้อย 1 คน');

export type StudentData = z.infer<typeof studentSchema>;
