import { studentSchema, studentArraySchema } from '../src/lib/validations';

describe('Student Validations', () => {
  // Arrange
  const validStudent = { studentId: '65001', name: 'John Doe' };
  const invalidStudentNoId = { studentId: '', name: 'John Doe' };
  const invalidStudentNoName = { studentId: '65001', name: '' };

  it('should pass valid student data', () => {
    // Act
    const result = studentSchema.safeParse(validStudent);
    
    // Assert
    expect(result.success).toBe(true);
  });

  it('should fail when studentId is empty', () => {
    // Act
    const result = studentSchema.safeParse(invalidStudentNoId);
    
    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('รหัสนักศึกษาต้องไม่เป็นค่าว่าง');
    }
  });

  it('should fail when name is empty', () => {
    // Act
    const result = studentSchema.safeParse(invalidStudentNoName);
    
    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ชื่อ-สกุลต้องไม่เป็นค่าว่าง');
    }
  });

  it('should validate array of students', () => {
    // Act
    const result = studentArraySchema.safeParse([validStudent]);
    
    // Assert
    expect(result.success).toBe(true);
  });

  it('should fail when array is empty', () => {
    // Act
    const result = studentArraySchema.safeParse([]);
    
    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ต้องมีข้อมูลนักศึกษาอย่างน้อย 1 คน');
    }
  });
});
