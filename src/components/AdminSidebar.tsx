'use client';

import React from 'react';
import Link from 'next/link';

interface AdminSidebarProps {
  activePillar?: string;
  onSelectPillar?: (pillar: string) => void;
  counts?: Record<string, number>;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activePillar = 'all',
  onSelectPillar,
  counts,
}) => {
  const navItems = [
    { key: 'all', label: 'All Items', icon: 'all_inclusive' },
    { key: 'asana', label: 'Poses (Asanas)', icon: 'self_improvement' },
    { key: 'mudra', label: 'Mudras (Gestures)', icon: 'sign_language' },
    { key: 'mantra', label: 'Mantras (Chants)', icon: 'graphic_eq' },
  ];

  return (
    <aside
      className="admin-sidebar"
      style={{
        width: 256,
        backgroundColor: '#F5F1E4',
        borderRight: '1px solid #EAE4D2',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 0',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Repository Header */}
        <div style={{ padding: '0 24px' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#5C5E62',
            }}
          >
            Repository
          </span>
        </div>

        {/* Menu Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {navItems.map((item) => {
            const isActive = activePillar === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectPillar && onSelectPillar(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderRadius: 10,
                  backgroundColor: isActive ? '#121314' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#5C5E62',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 1px 4px rgba(28, 24, 18, 0.08)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#EDE7D7';
                    e.currentTarget.style.color = '#111213';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#5C5E62';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {counts && typeof counts[item.key] === 'number' && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 9999,
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#EDE7D7',
                      color: isActive ? '#FFFFFF' : '#75777A',
                      fontWeight: 600,
                    }}
                  >
                    {counts[item.key]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Studio Flow Widget */}
      <div style={{ padding: '0 16px' }}>
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: '#EDE7D7',
            border: '1px solid #EAE4D2',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#121314',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <span
              className="material-symbols-outlined filled"
              style={{ fontSize: 18, color: '#A8751E' }}
            >
              spa
            </span>
            <span>Studio Flow</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#5C5E62', lineHeight: 1.4 }}>
            Active curriculum synchronized to cloud repository.
          </p>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 992px) {
          .admin-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </aside>
  );
};
