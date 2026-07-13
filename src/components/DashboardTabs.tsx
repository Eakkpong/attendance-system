'use client';

import { useState } from 'react';

export default function DashboardTabs({ 
  courseList, 
  createCourseForm 
}: { 
  courseList: React.ReactNode, 
  createCourseForm: React.ReactNode 
}) {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        borderBottom: '2px solid rgba(255,255,255,0.1)', 
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => setActiveTab('list')}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '1.2rem', 
            fontWeight: 600, 
            cursor: 'pointer',
            color: activeTab === 'list' ? 'var(--primary-color)' : 'var(--text-muted)',
            borderBottom: activeTab === 'list' ? '3px solid var(--primary-color)' : '3px solid transparent',
            padding: '0.5rem 1rem', 
            transition: 'all 0.2s',
            marginBottom: '-10px' // to overlap with the container's borderBottom
          }}
        >
          📚 รายวิชาของคุณ (Your Courses)
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '1.2rem', 
            fontWeight: 600, 
            cursor: 'pointer',
            color: activeTab === 'create' ? 'var(--primary-color)' : 'var(--text-muted)',
            borderBottom: activeTab === 'create' ? '3px solid var(--primary-color)' : '3px solid transparent',
            padding: '0.5rem 1rem', 
            transition: 'all 0.2s',
            marginBottom: '-10px'
          }}
        >
          ➕ สร้างรายวิชาใหม่ (Create New Course)
        </button>
      </div>

      <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {activeTab === 'list' && courseList}
        {activeTab === 'create' && createCourseForm}
      </div>
    </div>
  );
}
