'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, PracticeItem, TodayClassReview } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button, Tag, Spin, Tooltip, message } from 'antd';
import { FireOutlined, PlayCircleOutlined, SoundOutlined } from '@ant-design/icons';
import { AudioPlayerBar, AudioTrack } from '../components/AudioPlayerBar';
import { PracticeRunnerModal } from '../components/PracticeRunnerModal';
import { AnatomicalCueModal } from '../components/AnatomicalCueModal';

export default function StudentHomePage() {
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<TodayClassReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAudio, setActiveAudio] = useState<AudioTrack | null>(null);
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [selectedItemForCues, setSelectedItemForCues] = useState<PracticeItem | null>(null);

  useEffect(() => {
    fetchTodaySession();
  }, [user?.uid]);

  const fetchTodaySession = async () => {
    setLoading(true);
    try {
      const data = await api.getTodayClassSequence(user?.uid);
      setSessionData(data);
    } catch (err: any) {
      console.warn("Could not fetch today's class sequence:", err);
      setSessionData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    try {
      const result = await api.completeTodaySession(user?.uid);
      if (sessionData) {
        setSessionData({
          ...sessionData,
          userStreakDays: result.newStreak,
          completedClassmatesCount: (sessionData.completedClassmatesCount || 0) + 1,
        });
      }
      message.success('Mindful practice recorded! Your streak has increased.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await api.deleteCurriculumItem(id);
      if (sessionData) {
        setSessionData({
          ...sessionData,
          assignedItems: sessionData.assignedItems.filter((i) => i.id !== id),
        });
      }
      if (selectedItemForCues?.id === id) {
        setSelectedItemForCues(null);
      }
    } catch (e) {
      console.error('Failed to delete practice item:', e);
      throw e;
    }
  };

  const featuredAudioItem = sessionData?.assignedItems.find((i) => i.audioUrl);
  const playClassAudio = () => {
    if (featuredAudioItem) {
      setActiveAudio({
        title: featuredAudioItem.title,
        subtitle: featuredAudioItem.subtitle || 'Studio Alignment Guide',
        durationSeconds: 195,
        audioUrl: featuredAudioItem.audioUrl,
      });
    }
  };

  const poses = sessionData?.assignedItems.filter((i) => i.pillarType === 'asana') || [];
  const mudras = sessionData?.assignedItems.filter((i) => i.pillarType === 'mudra') || [];
  const mantras = sessionData?.assignedItems.filter((i) => i.pillarType === 'mantra') || [];

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF8F0', paddingBottom: 100 }}>
      {/* Ambient background glows */}
      <div className="ambient-glow-amber" style={{ top: -100, right: 20 }} />
      <div className="ambient-glow-terracotta" style={{ top: 400, left: -50 }} />

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '32px 24px' }}>
        {/* SECTION 1: HERO / DAILY INTENT BANNER */}
        <section
          style={{
            position: 'relative',
            backgroundColor: '#F5F1E4',
            borderRadius: 24,
            padding: '36px 32px',
            border: '1px solid #EAE4D2',
            boxShadow: '0 4px 24px rgba(28, 24, 18, 0.05)',
            overflow: 'hidden',
            marginBottom: 36,
          }}
        >
          {/* Decorative geometric sacred mandala SVG */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 380,
              height: '100%',
              opacity: 0.15,
              pointerEvents: 'none',
            }}
          >
            <svg viewBox="0 0 400 400" fill="none" stroke="#A8751E" strokeWidth="1">
              <circle cx="200" cy="200" r="160" strokeDasharray="4 6" />
              <circle cx="200" cy="200" r="120" />
              <circle cx="200" cy="200" r="80" strokeDasharray="2 4" />
              <circle cx="200" cy="200" r="40" />
              <path d="M200 40 L200 360 M40 200 L360 200" strokeWidth="0.75" />
            </svg>
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 24,
              }}
            >
              {/* Left Column: Intent Details */}
              <div style={{ maxWidth: 680 }}>
                {/* Header Tag */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 9999,
                      backgroundColor: '#FDF3D0',
                      color: '#A8751E',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#D9A74A',
                      }}
                    />
                    {sessionData?.sessionTime || 'Today\'s Studio Class'}
                  </span>
                  <span style={{ fontSize: 13, color: '#5C5E62' }}>• {sessionData?.studioRoom || 'Studio'}</span>
                </div>

                <h1
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(28px, 4vw, 42px)',
                    color: '#111213',
                    margin: '0 0 8px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Namaste, {user?.displayName || 'Practitioner'}
                </h1>

                <p
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(18px, 2.5vw, 24px)',
                    color: '#2A2D30',
                    fontStyle: 'italic',
                    margin: '0 0 16px',
                  }}
                >
                  {sessionData?.intent || 'Mindful Practice & Equilibrium'} —{' '}
                  <span style={{ fontStyle: 'normal', color: '#5C5E62' }}>
                    {sessionData?.title || 'Daily Studio Sequence'}
                  </span>
                </p>

                {/* Session breakdown pill list */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 14,
                    color: '#5C5E62',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, color: '#A8751E' }}
                    >
                      schedule
                    </span>
                    <strong style={{ color: '#111213' }}>
                      {sessionData?.estimatedDurationMinutes || (poses.length * 5 || 15)} mins
                    </strong>
                  </div>
                  <span>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, color: '#A8751E' }}
                    >
                      self_improvement
                    </span>
                    <span>
                      <strong style={{ color: '#111213' }}>{poses.length}</strong> {poses.length === 1 ? 'Pose' : 'Poses'}
                    </span>
                  </div>
                  <span>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, color: '#A8751E' }}
                    >
                      sign_language
                    </span>
                    <span>
                      <strong style={{ color: '#111213' }}>{mudras.length}</strong> {mudras.length === 1 ? 'Mudra' : 'Mudras'}
                    </span>
                  </div>
                  <span>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, color: '#A8751E' }}
                    >
                      graphic_eq
                    </span>
                    <span>
                      <strong style={{ color: '#111213' }}>{mantras.length}</strong> {mantras.length === 1 ? 'Mantra' : 'Mantras'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Main CTAs */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setRunnerOpen(true)}
                  icon={
                    <span className="material-symbols-outlined filled" style={{ fontSize: 20 }}>
                      play_arrow
                    </span>
                  }
                  style={{
                    backgroundColor: '#121314',
                    height: 48,
                    padding: '0 24px',
                    borderRadius: 9999,
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 4px 14px rgba(18, 19, 20, 0.2)',
                  }}
                >
                  Begin Today&apos;s Practice
                </Button>

                {featuredAudioItem && (
                  <Button
                    size="large"
                    onClick={playClassAudio}
                    icon={
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 20, color: '#A8751E' }}
                      >
                        mic_external_on
                      </span>
                    }
                    style={{
                      backgroundColor: '#FDF3D0',
                      border: '1px solid #EAE4D2',
                      color: '#111213',
                      height: 48,
                      padding: '0 20px',
                      borderRadius: 9999,
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    Play Audio Guide
                  </Button>
                )}
              </div>
            </div>

            {/* Instructor Curation Strip */}
            <div
              style={{
                paddingTop: 16,
                borderTop: '1px solid rgba(223, 214, 195, 0.6)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                fontSize: 13,
                color: '#5C5E62',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="material-symbols-outlined filled"
                  style={{ fontSize: 18, color: '#D9A74A' }}
                >
                  verified
                </span>
                <span>
                  Curated by <strong style={{ color: '#111213' }}>{sessionData?.curatedBy || 'Studio Instructor'}</strong>
                  {sessionData?.curatorNote ? ` — ${sessionData.curatorNote}` : ' — Replicate today\'s alignments to deepen stability and equilibrium.'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#111213',
                  fontWeight: 600,
                }}
              >
                <span>Completed by {sessionData?.completedClassmatesCount || 0} classmates today</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: ASSIGNED FROM TODAY'S CLASS */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#A8751E',
                }}
              >
                In-Studio Follow-Up
              </span>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28,
                  color: '#111213',
                  margin: '4px 0 0',
                }}
              >
                Assigned From Today&apos;s Class
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#5C5E62', maxWidth: 440 }}>
              {sessionData?.focusSummary || 'Integrate physical alignment, subtle hand mudras, and resonant mantras into your home practice.'}
            </p>
          </div>

          {/* 3 Pillars Grid: Poses (Left 7 Cols), Mudras & Mantras (Right 5 Cols) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: 24,
            }}
          >
            {/* COLUMN 1: Key Asanas (Poses) - 7 cols on desktop */}
            <div
              style={{
                gridColumn: 'span 12',
              }}
              className="asana-column"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 22, color: '#D9A74A' }}
                  >
                    accessibility_new
                  </span>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 20,
                      color: '#111213',
                      margin: 0,
                    }}
                  >
                    Key Asanas (Poses)
                  </h3>
                </div>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 9999,
                    backgroundColor: '#EDE7D7',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#2A2D30',
                  }}
                >
                  {poses.length} Postures
                </span>
              </div>

              {/* Asana Cards Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {poses.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      padding: '36px 24px',
                      border: '1px solid #EAE4D2',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: '0 0 12px', color: '#5C5E62', fontSize: 14 }}>
                      No postures currently assigned for today&apos;s sequence.
                    </p>
                    <Link href="/admin/curriculum">
                      <Button size="middle">Browse Practice Library</Button>
                    </Link>
                  </div>
                ) : (
                  poses.map((pose) => (
                    <div
                      key={pose.id}
                      onClick={() => setSelectedItemForCues(pose)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        padding: 20,
                        border: '1px solid #EAE4D2',
                        boxShadow: '0 2px 12px rgba(28, 24, 18, 0.04)',
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 20,
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(28, 24, 18, 0.08)';
                        e.currentTarget.style.borderColor = '#D9A74A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(28, 24, 18, 0.04)';
                        e.currentTarget.style.borderColor = '#EAE4D2';
                      }}
                    >
                      {/* Image preview with photo guide badge */}
                      <div
                        style={{
                          width: 170,
                          height: 180,
                          borderRadius: 12,
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: '#EDE7D7',
                          flexShrink: 0,
                        }}
                        className="pose-card-thumb"
                      >
                        {pose.imageUrl ? (
                          <img
                            src={pose.imageUrl}
                            alt={pose.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#A8751E',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 44 }}>
                              self_improvement
                            </span>
                          </div>
                        )}
                        {pose.imageUrl && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              backgroundColor: 'rgba(18, 19, 20, 0.82)',
                              backdropFilter: 'blur(6px)',
                              color: '#FFFFFF',
                              padding: '2px 8px',
                              borderRadius: 9999,
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              photo_camera
                            </span>
                            <span>Photo guide</span>
                          </div>
                        )}
                      </div>

                    {/* Details */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 260,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 6,
                          }}
                        >
                          <Tag color="gold" style={{ textTransform: 'capitalize' }}>
                            {pose.difficulty}
                          </Tag>
                          <span style={{ fontSize: 12, color: '#5C5E62' }}>
                            {pose.holdBreaths || 'Hold 5 breaths / side'}
                          </span>
                        </div>

                        <h4
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 19,
                            color: '#111213',
                            margin: '0 0 4px',
                          }}
                        >
                          {pose.title}
                        </h4>

                        {pose.sanskritTitle && (
                          <p
                            style={{
                              margin: '0 0 10px',
                              fontSize: 13,
                              color: '#5C5E62',
                              fontStyle: 'italic',
                            }}
                          >
                            {pose.sanskritTitle} — {pose.subtitle || 'Foundational alignment vector'}
                          </p>
                        )}

                        {/* Teacher Alignment Cue Box */}
                        <div
                          style={{
                            backgroundColor: '#FAF8F0',
                            borderRadius: 10,
                            padding: '10px 14px',
                            border: '1px solid #EAE4D2',
                            marginBottom: 12,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#A8751E',
                              display: 'block',
                              marginBottom: 2,
                            }}
                          >
                            Teacher Alignment Cue:
                          </span>
                          <p style={{ margin: 0, fontSize: 13, color: '#2A2D30', lineHeight: 1.4 }}>
                            {pose.alignmentCues?.[0] || pose.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid #EAE4D2',
                          paddingTop: 10,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                            color: '#5C5E62',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            timer
                          </span>
                          <span>{pose.durationMinutes || 3} mins practice</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItemForCues(pose);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#121314',
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#A8751E')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#121314')}
                        >
                          <span>Review Anatomical Breakdown</span>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            chevron_right
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>

            {/* COLUMN 2: Mudras & Mantras - 5 cols on desktop */}
            <div
              style={{
                gridColumn: 'span 12',
              }}
              className="mudra-mantra-column"
            >
              {/* Mudra Section */}
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 22, color: '#A8751E' }}
                    >
                      sign_language
                    </span>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 20,
                        color: '#111213',
                        margin: 0,
                      }}
                    >
                      Sacred Mudras
                    </h3>
                  </div>
                  <Tag color="orange">Subtle Energy</Tag>
                </div>

                {mudras.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      padding: '24px 20px',
                      border: '1px solid #EAE4D2',
                      textAlign: 'center',
                      color: '#5C5E62',
                      fontSize: 13,
                    }}
                  >
                    No sacred mudras assigned in today&apos;s sequence.
                  </div>
                ) : (
                  mudras.map((mudra) => (
                    <div
                      key={mudra.id}
                      onClick={() => setSelectedItemForCues(mudra)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        padding: 20,
                        border: '1px solid #EAE4D2',
                        boxShadow: '0 2px 12px rgba(28, 24, 18, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(28, 24, 18, 0.08)';
                        e.currentTarget.style.borderColor = '#D9A74A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(28, 24, 18, 0.04)';
                        e.currentTarget.style.borderColor = '#EAE4D2';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 12,
                            overflow: 'hidden',
                            backgroundColor: '#EDE7D7',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {mudra.imageUrl ? (
                            <img
                              src={mudra.imageUrl}
                              alt={mudra.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 28, color: '#A8751E' }}
                            >
                              sign_language
                            </span>
                          )}
                        </div>
                        <div>
                          <h4
                            style={{
                              fontFamily: "'Playfair Display', serif",
                              fontSize: 17,
                              color: '#111213',
                              margin: '0 0 2px',
                            }}
                          >
                            {mudra.title}
                          </h4>
                          <span style={{ fontSize: 12, color: '#A8751E', fontWeight: 600 }}>
                            {mudra.targetChakra || 'Manipura (Solar Plexus) Current'}
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: 13, color: '#5C5E62', lineHeight: 1.5 }}>
                        {mudra.description}
                      </p>

                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          backgroundColor: '#FAF8F0',
                          border: '1px solid #EAE4D2',
                          fontSize: 12,
                          color: '#111213',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Breath Vector: {mudra.breathPacing || '5 deep breaths'}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItemForCues(mudra);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#A8751E',
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          View Cues
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Mantra & Audio Player Section */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 22, color: '#121314' }}
                    >
                      graphic_eq
                    </span>
                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 20,
                        color: '#111213',
                        margin: 0,
                      }}
                    >
                      Pranic Mantra & Chants
                    </h3>
                  </div>
                  <Tag color="cyan">Lossless Audio</Tag>
                </div>

                {mantras.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      padding: '24px 20px',
                      border: '1px solid #EAE4D2',
                      textAlign: 'center',
                      color: '#5C5E62',
                      fontSize: 13,
                    }}
                  >
                    No sacred mantras assigned in today&apos;s sequence.
                  </div>
                ) : (
                  mantras.map((mantra) => (
                    <div
                      key={mantra.id}
                      onClick={() => setSelectedItemForCues(mantra)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        padding: 20,
                        border: '1px solid #EAE4D2',
                        boxShadow: '0 2px 12px rgba(28, 24, 18, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(28, 24, 18, 0.08)';
                        e.currentTarget.style.borderColor = '#D9A74A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(28, 24, 18, 0.04)';
                        e.currentTarget.style.borderColor = '#EAE4D2';
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 17,
                            color: '#111213',
                            margin: '0 0 2px',
                          }}
                        >
                          {mantra.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: 13, color: '#5C5E62' }}>
                          {mantra.subtitle || 'Sacred sound vibrations, phonetics & pranic pacing'}
                        </p>
                      </div>

                      {/* Interactive Audio Console Card */}
                      {mantra.audioUrl ? (
                        <div
                          style={{
                            padding: 14,
                            borderRadius: 14,
                            backgroundColor: '#F5F1E4',
                            border: '1px solid #EAE4D2',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAudio({
                                title: mantra.title,
                                subtitle: mantra.audioDetails || 'Studio Audio Guide',
                                durationSeconds: 252,
                                audioUrl: mantra.audioUrl,
                              });
                            }}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              backgroundColor: '#121314',
                              color: '#FFFFFF',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(18, 19, 20, 0.2)',
                              flexShrink: 0,
                              transition: 'transform 0.15s ease',
                            }}
                            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                              play_arrow
                            </span>
                          </button>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 4,
                              }}
                            >
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#111213' }}>
                                {mantra.audioFileName || mantra.title}
                              </span>
                              <span
                                style={{ fontSize: 11, fontFamily: 'monospace', color: '#5C5E62' }}
                              >
                                {mantra.audioDuration || 'Studio Audio'}
                              </span>
                            </div>
                            <div
                              style={{
                                height: 4,
                                borderRadius: 9999,
                                backgroundColor: '#EDE7D7',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: '45%',
                                  height: '100%',
                                  backgroundColor: '#A8751E',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: '#5C5E62',
                          fontStyle: 'italic',
                          lineHeight: 1.4,
                        }}
                      >
                        {mantra.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Audio Player Console */}
      <AudioPlayerBar track={activeAudio} onClose={() => setActiveAudio(null)} />

      {/* Fullscreen Step-by-Step Practice Runner */}
      <PracticeRunnerModal
        open={runnerOpen}
        onClose={() => setRunnerOpen(false)}
        items={sessionData?.assignedItems || []}
        onCompleteSession={handleCompleteSession}
      />

      {/* Anatomical Cues Modal */}
      <AnatomicalCueModal
        item={selectedItemForCues}
        open={!!selectedItemForCues}
        onClose={() => setSelectedItemForCues(null)}
        onPlayAudio={(item) =>
          setActiveAudio({
            title: item.title,
            subtitle: item.audioDetails || 'Studio Alignment Guide',
            durationSeconds: 180,
            audioUrl: item.audioUrl,
          })
        }
        onDelete={handleDeleteItem}
      />

      <style jsx global>{`
        @media (min-width: 992px) {
          .asana-column {
            grid-column: span 7 !important;
          }
          .mudra-mantra-column {
            grid-column: span 5 !important;
          }
        }
        @media (max-width: 640px) {
          .pose-card-thumb {
            width: 100% !important;
            height: 200px !important;
          }
        }
      `}</style>
    </main>
  );
}
