export default function CourseLoading() {
  return (
    <div className="loading-container glass-container" style={{ minHeight: '50vh' }}>
      <div className="spinner"></div>
      <p className="loading-text">กำลังประมวลผลข้อมูลรายวิชา...</p>
    </div>
  );
}
