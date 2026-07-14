export default function Loading() {
  return (
    <div className="loading-container glass-container" style={{ minHeight: 'calc(100vh - 200px)', border: 'none', background: 'transparent', boxShadow: 'none' }}>
      <div className="spinner"></div>
      <p className="loading-text">กำลังโหลดข้อมูล...</p>
    </div>
  );
}
