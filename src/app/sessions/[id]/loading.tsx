export default function SessionLoading() {
  return (
    <div className="loading-container glass-container" style={{ minHeight: '50vh' }}>
      <div className="spinner"></div>
      <p className="loading-text">กำลังโหลดข้อมูลคาบเรียน...</p>
    </div>
  );
}
