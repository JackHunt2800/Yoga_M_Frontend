'use client';

import React, { useState } from 'react';
import { Modal, Tag, Button, Popconfirm, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { PracticeItem } from '../lib/api';

interface AnatomicalCueModalProps {
  item: PracticeItem | null;
  open: boolean;
  onClose: () => void;
  onPlayAudio?: (item: PracticeItem) => void;
  onDelete?: (id: string) => Promise<void> | void;
}

export const AnatomicalCueModal: React.FC<AnatomicalCueModalProps> = ({
  item,
  open,
  onClose,
  onPlayAudio,
  onDelete,
}) => {
  const [deleting, setDeleting] = useState(false);

  if (!item) return null;

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(item.id);
      message.success(`"${item.title}" deleted successfully`);
      onClose();
    } catch {
      message.error('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      styles={{
        content: {
          backgroundColor: '#FAF8F0',
          border: '1px solid #EAE4D2',
          borderRadius: 24,
          padding: 28,
        },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #EAE4D2', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Tag color="#121314">{item.pillarType.toUpperCase()}</Tag>
            <Tag color="#A8751E">{item.difficulty.toUpperCase()}</Tag>
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              color: '#111213',
              margin: '4px 0',
            }}
          >
            {item.title}
          </h2>
          {item.sanskritTitle && (
            <span style={{ fontSize: 14, color: '#A8751E', fontStyle: 'italic', fontWeight: 500 }}>
              {item.sanskritTitle}
            </span>
          )}
        </div>

        {/* Media Preview if available — full image, no cropping */}
        {item.imageUrl && (
          <div
            style={{
              position: 'relative',
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: '#F5F1E4',
              border: '1px solid #EAE4D2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
              maxHeight: 460,
            }}
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              style={{
                maxWidth: '100%',
                maxHeight: 436,
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 10,
                display: 'block',
              }}
            />
          </div>
        )}

        {/* Description */}
        <p style={{ fontSize: 15, color: '#5C5E62', lineHeight: 1.6, margin: 0 }}>
          {item.description}
        </p>

        {/* Alignment Vectors */}
        {item.alignmentCues && item.alignmentCues.length > 0 && (
          <div
            style={{
              backgroundColor: '#F5F1E4',
              borderRadius: 16,
              padding: 18,
              border: '1px solid #EAE4D2',
            }}
          >
            <h4
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#111213',
                margin: '0 0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined text-amber filled" style={{ fontSize: 18 }}>
                verified
              </span>
              Key Biomechanical Alignment Vectors
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {item.alignmentCues.map((cue, idx) => (
                <li key={idx} style={{ fontSize: 13, color: '#2A2D30', lineHeight: 1.5 }}>
                  {cue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Breath & Pranic Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAE4D2',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5C5E62', textTransform: 'uppercase' }}>
              Breath Pacing
            </span>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111213', marginTop: 2 }}>
              {item.breathPacing || item.holdBreaths || '5 steady breaths'}
            </div>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAE4D2',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5C5E62', textTransform: 'uppercase' }}>
              Target Chakra / Energy
            </span>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111213', marginTop: 2 }}>
              {item.targetChakra || item.pranicCurrent || 'Solar & Core Vitality'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #EAE4D2' }}>
          {/* Delete Button (left side) */}
          <div>
            {onDelete && (
              <Popconfirm
                title="Delete this item?"
                description="This action cannot be undone. The item will be removed from the curriculum."
                onConfirm={handleDelete}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true, loading: deleting }}
              >
                <Button
                  danger
                  type="default"
                  icon={<DeleteOutlined />}
                  loading={deleting}
                  style={{
                    borderRadius: 10,
                  }}
                >
                  Delete
                </Button>
              </Popconfirm>
            )}
          </div>

          {/* Right side buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {item.audioUrl && (
              <Button
                type="default"
                icon={
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    graphic_eq
                  </span>
                }
                onClick={() => {
                  if (onPlayAudio) onPlayAudio(item);
                }}
              >
                Play Audio Guide
              </Button>
            )}
            <Button type="primary" onClick={onClose}>
              Close Breakdown
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
