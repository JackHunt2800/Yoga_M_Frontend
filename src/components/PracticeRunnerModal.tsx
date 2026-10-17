'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Tag, Progress } from 'antd';
import { PracticeItem } from '../lib/api';
import confetti from 'canvas-confetti';
import { soundSynthesizer } from '../lib/AudioSynthesizer';
import { useAuth } from '../context/AuthContext';

interface PracticeRunnerModalProps {
  open: boolean;
  onClose: () => void;
  items: PracticeItem[];
  onCompleteSession: () => void;
}

export const PracticeRunnerModal: React.FC<PracticeRunnerModalProps> = ({
  open,
  onClose,
  items,
  onCompleteSession,
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  const currentItem = items[currentIndex] || items[0];

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setIsCompleted(false);
      setSecondsLeft((items[0]?.durationMinutes || 3) * 60);
      setIsTimerRunning(true);
      soundSynthesizer.playDrone(432, 60);
    } else {
      soundSynthesizer.stop();
    }
  }, [open, items]);

  useEffect(() => {
    let interval: any;
    if (open && isTimerRunning && secondsLeft > 0 && !isCompleted) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && !isCompleted) {
      handleNext();
    }
    return () => clearInterval(interval);
  }, [open, isTimerRunning, secondsLeft, isCompleted]);

  // Breathing guide cycle (4s Inhale, 4s Hold, 4s Exhale)
  useEffect(() => {
    if (!open) return;
    const cycle = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 4000);
    return () => clearInterval(cycle);
  }, [open]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSecondsLeft((items[nextIdx]?.durationMinutes || 3) * 60);
    } else {
      // Completed all items!
      setIsCompleted(true);
      setIsTimerRunning(false);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#A8751E', '#3D5A4C', '#D9A74A', '#C87D55'],
      });
      onCompleteSession();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setSecondsLeft((items[prevIdx]?.durationMinutes || 3) * 60);
    }
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentItem) return null;

  return (
    <Modal
      open={open}
      onCancel={() => {
        soundSynthesizer.stop();
        onClose();
      }}
      footer={null}
      width={780}
      centered
      styles={{
        content: {
          backgroundColor: '#FAF8F0',
          border: '1px solid #EAE4D2',
          borderRadius: 24,
          padding: 32,
        },
      }}
    >
      {isCompleted ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: '#FDF3D0',
              border: '2px solid #EAE4D2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#A8751E',
            }}
          >
            <span className="material-symbols-outlined filled" style={{ fontSize: 36 }}>
              workspace_premium
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 32,
              color: '#111213',
              marginBottom: 8,
            }}
          >
            Namaste, {user?.displayName || 'Practitioner'}
          </h2>
          <p style={{ fontSize: 16, color: '#5C5E62', maxWidth: 440, margin: '0 auto 24px' }}>
            You have successfully completed today&apos;s guided practice sequence. Your consistency deepens
            your inner equilibrium.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 9999,
              backgroundColor: '#FDF3D0',
              color: '#A8751E',
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 32,
            }}
          >
            <span className="material-symbols-outlined filled">local_fire_department</span>
            <span>Practice Session Completed!</span>
          </div>
          <div>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                soundSynthesizer.stop();
                onClose();
              }}
              style={{ minWidth: 160 }}
            >
              Return to Practice Hub
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Progress Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #EAE4D2',
              paddingBottom: 16,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#A8751E',
                }}
              >
                Posture {currentIndex + 1} of {items.length}
              </span>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  margin: '4px 0 0',
                  color: '#111213',
                }}
              >
                {currentItem.title}
              </h3>
            </div>
            <Tag color="#121314" style={{ padding: '4px 12px', fontSize: 12 }}>
              {currentItem.pillarType.toUpperCase()}
            </Tag>
          </div>

          {/* Main Visual & Breathing Area */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
              alignItems: 'center',
            }}
          >
            {/* Visual Photo Card */}
            <div
              style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#EDE7D7',
                aspectRatio: '4/3',
                boxShadow: '0 4px 16px rgba(28, 24, 18, 0.08)',
              }}
            >
              {currentItem.imageUrl ? (
                <img
                  src={currentItem.imageUrl}
                  alt={currentItem.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#A8751E',
                  }}
                >
                  <span className="material-symbols-outlined filled" style={{ fontSize: 48 }}>
                    spa
                  </span>
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(18, 19, 20, 0.8)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: 9999,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  verified
                </span>
                <span>Alignment Vector Verified</span>
              </div>
            </div>

            {/* Breathing Ring & Timer */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 16,
              }}
            >
              {/* Animated breath ring */}
              <div
                className="animate-breath"
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  border: '3px solid #D9A74A',
                  backgroundColor: '#FDF3D0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 24px rgba(217, 167, 74, 0.25)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#A8751E' }}>
                  {breathPhase}
                </span>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#111213' }}>
                  {formatTimer(secondsLeft)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  icon={
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {isTimerRunning ? 'pause' : 'play_arrow'}
                    </span>
                  }
                >
                  {isTimerRunning ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  onClick={() => setSecondsLeft((currentItem.durationMinutes || 3) * 60)}
                  icon={
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      restart_alt
                    </span>
                  }
                >
                  Reset
                </Button>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: '#5C5E62', fontStyle: 'italic' }}>
                {currentItem.holdBreaths || 'Sync breath with the expanding gold ring'}
              </p>
            </div>
          </div>

          {/* Teacher Alignment Cue Box */}
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              backgroundColor: '#F5F1E4',
              border: '1px solid #EAE4D2',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#A8751E',
                fontWeight: 700,
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                record_voice_over
              </span>
              <span>Teacher Alignment Guidance:</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#2A2D30', lineHeight: 1.5 }}>
              {currentItem.alignmentCues?.[0] || currentItem.description}
            </p>
          </div>

          {/* Stepper Footer Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 8,
            }}
          >
            <Button disabled={currentIndex === 0} onClick={handlePrev}>
              Previous Posture
            </Button>

            <div style={{ display: 'flex', gap: 6 }}>
              {items.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: idx === currentIndex ? 24 : 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: idx === currentIndex ? '#121314' : '#EDE7D7',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>

            <Button type="primary" onClick={handleNext}>
              {currentIndex === items.length - 1 ? 'Finish Practice' : 'Next Posture'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
