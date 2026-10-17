'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api, PracticeItem } from '../../../lib/api';
import { AdminSidebar } from '../../../components/AdminSidebar';
import { AnatomicalCueModal } from '../../../components/AnatomicalCueModal';
import { Button, Input, Radio, Switch, Checkbox, message, Spin, Tooltip, Tag, Card } from 'antd';
import {
  CloudUploadOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  EyeOutlined,
  SoundOutlined,
  PictureOutlined,
  LockOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

function UploadContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialPillar = (searchParams.get('pillar') as 'asana' | 'mudra' | 'mantra') || 'asana';

  // Form State
  const [pillar, setPillar] = useState<'asana' | 'mudra' | 'mantra'>(initialPillar);
  const [title, setTitle] = useState('');
  const [sanskritTitle, setSanskritTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'foundations' | 'intermediate' | 'deepening'>('foundations');
  const [cues, setCues] = useState<string[]>([]);
  const [newCue, setNewCue] = useState('');
  const [breathPacing, setBreathPacing] = useState('');
  const [targetChakra, setTargetChakra] = useState('');

  // Media state
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFileName, setAudioFileName] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Distribution State
  const [publishImmediate, setPublishImmediate] = useState(true);
  const [featureInToday, setFeatureInToday] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE_BYTES) {
      message.error(
        `File "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB, which exceeds the 5MB limit. Please select a file under 5MB.`,
      );
      e.target.value = '';
      return;
    }

    setUploadingMedia(true);
    try {
      const uploaded = await api.uploadMedia(file);
      if (uploaded.isAudio) {
        setAudioUrl(uploaded.url);
        setAudioFileName(uploaded.fileName);
        message.success(`Audio uploaded to Storage: ${uploaded.fileName}`);
      } else {
        setImageUrl(uploaded.url);
        setImageFileName(uploaded.fileName);
        message.success(`Image uploaded to Storage: ${uploaded.fileName}`);
      }
    } catch (err: any) {
      message.error(err.message || 'Upload failed. File must be under 5MB.');
    } finally {
      setUploadingMedia(false);
    }
  };


  const handleAddCue = () => {
    if (newCue.trim()) {
      setCues([...cues, newCue.trim()]);
      setNewCue('');
    }
  };

  const handleRemoveCue = (idx: number) => {
    setCues(cues.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (isDraft = false) => {
    if (!title.trim()) {
      message.error('Please enter a practice title');
      return;
    }

    setIsSubmitting(true);
    try {
      const newItem: Partial<PracticeItem> = {
        pillarType: pillar,
        title: title.trim(),
        difficulty,
        isPublishedToHomeHub: isDraft ? false : publishImmediate,
        featureInTodayClass: featureInToday,
      };

      if (sanskritTitle.trim()) {
        newItem.sanskritTitle = sanskritTitle.trim();
      }
      if (description.trim()) {
        newItem.description = description.trim();
      }
      if (imageUrl) {
        newItem.imageUrl = imageUrl;
        if (imageFileName) newItem.imageFileName = imageFileName;
      }
      if (audioUrl) {
        newItem.audioUrl = audioUrl;
        if (audioFileName) newItem.audioFileName = audioFileName;
      }
      if (cues.length > 0) {
        newItem.alignmentCues = cues;
      }
      if (breathPacing.trim()) {
        newItem.breathPacing = breathPacing.trim();
      }
      if (targetChakra.trim()) {
        newItem.targetChakra = targetChakra.trim();
      }

      await api.createCurriculumItem(newItem);
      message.success(isDraft ? 'Saved to drafts!' : 'Published to Student Home Practice Hub!');
      setTimeout(() => {
        router.push('/admin/curriculum');
      }, 1000);
    } catch (err: any) {
      message.error('Failed to publish item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewItem: PracticeItem = {
    id: 'preview',
    pillarType: pillar,
    title,
    sanskritTitle,
    description,
    difficulty,
    imageUrl,
    audioUrl,
    alignmentCues: cues,
    breathPacing,
    targetChakra,
    isPublishedToHomeHub: publishImmediate,
    featureInTodayClass: featureInToday,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const attachedFilesCount = (imageUrl ? 1 : 0) + (audioUrl ? 1 : 0);

  if (!authLoading && (!user || user.role !== 'teacher')) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#FAF8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}
      >
        <Card
          style={{
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
            borderRadius: 24,
            border: '1px solid #EAE4D2',
            boxShadow: '0 8px 32px rgba(28, 24, 18, 0.08)',
            padding: '24px 16px',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: '#FDF3D0',
              border: '1px solid #EAE4D2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A8751E',
              margin: '0 auto 16px',
            }}
          >
            <LockOutlined style={{ fontSize: 28 }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#111213', margin: '0 0 8px' }}>
            Teacher Access Required
          </h2>
          <p style={{ fontSize: 14, color: '#5C5E62', margin: '0 0 24px', lineHeight: 1.6 }}>
            Teacher accounts are provisioned exclusively through administrative API calls.
            Please sign in with an authorized teacher account to upload curriculum content.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button type="default" onClick={() => router.push('/')}>
              Return to Home Practice
            </Button>
            {!user && (
              <Button type="primary" onClick={() => router.push('/login')} style={{ backgroundColor: '#121314' }}>
                Sign In
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FAF8F0' }}>

      <AdminSidebar activePillar={pillar} />

      <main
        className="admin-main-content"
        style={{
          flex: 1,
          padding: '36px 32px 100px',
          marginLeft: 256,
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Editorial Header & Breadcrumb Sanctuary */}
          <section
            style={{
              position: 'relative',
              backgroundColor: '#F5F1E4',
              borderRadius: 20,
              padding: '32px 36px',
              border: '1px solid #EAE4D2',
              boxShadow: '0 2px 12px rgba(28, 24, 18, 0.04)',
              overflow: 'hidden',
            }}
          >
            <div className="ambient-glow-amber" style={{ top: -90, right: -60 }} />

            <div style={{ position: 'relative', zIndex: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: '#5C5E62',
                  marginBottom: 8,
                }}
              >
                <Link
                  href="/admin/curriculum"
                  style={{ color: '#5C5E62', textDecoration: 'none', fontWeight: 500 }}
                >
                  Curriculum Library
                </Link>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  chevron_right
                </span>
                <span style={{ color: '#A8751E', fontWeight: 600 }}>Upload New Content</span>
              </div>

              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(26px, 3.5vw, 36px)',
                  color: '#111213',
                  margin: '0 0 8px',
                  letterSpacing: '-0.02em',
                }}
              >
                Add Practice Item for Home Review
              </h1>

              <p style={{ margin: 0, fontSize: 15, color: '#5C5E62', maxWidth: 720, lineHeight: 1.5 }}>
                Upload alignment guidelines, media, and cues from today’s class so students can practice
                safely and mindfully at home.
              </p>
            </div>
          </section>

          {/* Form Grid */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(false);
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: 28,
              alignItems: 'start',
            }}
          >
            {/* Left Column: Core Fields & Media (7 Columns) */}
            <div style={{ gridColumn: 'span 12' }} className="upload-left-column">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Section 1: The Three Core Pillars */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 24,
                    border: '1px solid #EAE4D2',
                    boxShadow: '0 2px 10px rgba(28, 24, 18, 0.04)',
                  }}
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
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#A8751E',
                        }}
                      >
                        01 — Pillar
                      </span>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111213' }}>
                        Select Practice Foundation
                      </h3>
                    </div>
                    <span style={{ fontSize: 12, color: '#5C5E62' }}>Sets media defaults & metadata</span>
                  </div>

                  {/* Radio Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {[
                      {
                        key: 'asana',
                        title: 'Pose (Asana)',
                        desc: 'Physical Posture & Alignment vectors for body awareness.',
                        tag: 'Physical Form',
                        icon: 'self_improvement',
                      },
                      {
                        key: 'mudra',
                        title: 'Mudra (Gesture)',
                        desc: 'Hand seals & subtle energetic current channel directing.',
                        tag: 'Subtle Energy',
                        icon: 'sign_language',
                      },
                      {
                        key: 'mantra',
                        title: 'Mantra (Chant)',
                        desc: 'Sacred sound vibrations, phonetics & pranic pacing.',
                        tag: 'Sound Current',
                        icon: 'record_voice_over',
                      },
                    ].map((card) => {
                      const isActive = pillar === card.key;
                      return (
                        <div
                          key={card.key}
                          onClick={() => setPillar(card.key as any)}
                          style={{
                            padding: 18,
                            borderRadius: 16,
                            backgroundColor: isActive ? '#FFFFFF' : '#FAF8F0',
                            border: isActive ? '2px solid #121314' : '1px solid #EAE4D2',
                            boxShadow: isActive ? '0 4px 16px rgba(18, 19, 20, 0.08)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 12,
                              }}
                            >
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 10,
                                  backgroundColor: '#FDF3D0',
                                  border: '1px solid #EAE4D2',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#121314',
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                                  {card.icon}
                                </span>
                              </div>
                              <span
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: '50%',
                                  backgroundColor: isActive ? '#121314' : '#EDE7D7',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {isActive && (
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      backgroundColor: '#FAF8F0',
                                    }}
                                  />
                                )}
                              </span>
                            </div>

                            <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#111213' }}>
                              {card.title}
                            </h4>
                            <p style={{ margin: 0, fontSize: 12, color: '#5C5E62', lineHeight: 1.4 }}>
                              {card.desc}
                            </p>
                          </div>

                          <div style={{ marginTop: 14 }}>
                            <Tag color={isActive ? 'gold' : 'default'}>{card.tag}</Tag>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Core Details Form */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 24,
                    border: '1px solid #EAE4D2',
                    boxShadow: '0 2px 10px rgba(28, 24, 18, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #EAE4D2',
                      paddingBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#A8751E',
                        }}
                      >
                        02 — Taxonomy
                      </span>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111213' }}>
                        Core Identification
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-amber filled" style={{ fontSize: 18 }}>
                      spa
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      Practice Title / Name
                    </label>
                    <Input
                      size="large"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Virabhadrasana II — Warrior II"
                    />
                    <span style={{ fontSize: 12, color: '#5C5E62', marginTop: 4, display: 'block' }}>
                      Primary name shown across student practice dashboards and home review sessions.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      Sanskrit Title / Translation
                    </label>
                    <Input
                      size="large"
                      value={sanskritTitle}
                      onChange={(e) => setSanskritTitle(e.target.value)}
                      placeholder="e.g. Virabhadrasana II (वीरभद्रासन)"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      Description & Practice Overview
                    </label>
                    <TextArea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the practice intentions, foundational alignment cues, and breath pacing for home study..."
                    />
                    <span style={{ fontSize: 12, color: '#5C5E62', marginTop: 4, display: 'block' }}>
                      Guiding intentions and essential mindfulness notes for student home practice.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                      Difficulty Tier & Experience Level
                    </label>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        backgroundColor: '#F5F1E4',
                        padding: 4,
                        borderRadius: 12,
                        border: '1px solid #EAE4D2',
                      }}
                    >
                      {[
                        { key: 'foundations', label: 'Beginner / Foundations' },
                        { key: 'intermediate', label: 'Intermediate Practice' },
                        { key: 'deepening', label: 'Advanced / Deepening' },
                      ].map((tier) => {
                        const active = difficulty === tier.key;
                        return (
                          <button
                            key={tier.key}
                            type="button"
                            onClick={() => setDifficulty(tier.key as any)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: active ? '1px solid #EAE4D2' : 'none',
                              backgroundColor: active ? '#FFFFFF' : 'transparent',
                              color: active ? '#121314' : '#5C5E62',
                              fontWeight: active ? 700 : 500,
                              fontSize: 12,
                              cursor: 'pointer',
                              boxShadow: active ? '0 1px 4px rgba(28, 24, 18, 0.06)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {tier.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 3: Multi-Media Upload Zone & Staged Preview */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 24,
                    border: '1px solid #EAE4D2',
                    boxShadow: '0 2px 10px rgba(28, 24, 18, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #EAE4D2',
                      paddingBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#A8751E',
                        }}
                      >
                        03 — Media Assets
                      </span>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111213' }}>
                        Demonstration & Audio Reference
                      </h3>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        color: attachedFilesCount > 0 ? '#121314' : '#5C5E62',
                      }}
                    >
                      {attachedFilesCount > 0 && <CheckCircleFilled style={{ color: '#D9A74A' }} />}
                      {attachedFilesCount} {attachedFilesCount === 1 ? 'File' : 'Files'} Attached
                    </span>
                  </div>

                  {/* Drop Zone Box with File Input */}
                  <label
                    style={{
                      position: 'relative',
                      borderRadius: 16,
                      padding: '36px 20px',
                      backgroundColor: '#FAF8F0',
                      border: '2px dashed #D9A74A',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FDF3D0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FAF8F0')}
                  >
                    <input
                      type="file"
                      accept="image/*,audio/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        backgroundColor: '#FDF3D0',
                        border: '1px solid #EAE4D2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#121314',
                        marginBottom: 12,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                        upload_file
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#111213' }}>
                      {uploadingMedia ? 'Uploading to Cloud Storage...' : 'Drop reference photos or MP3 chanting audio here'}
                    </h4>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: '#5C5E62', maxWidth: 420 }}>
                      Supports JPG, PNG, WEBP and MP3 audio up to 5MB. Files are synced to Cloud Storage &
                      auto-optimized.
                    </p>

                    <Button type="default" icon={<CloudUploadOutlined />} loading={uploadingMedia}>
                      Browse Files (Images & MP3, max 5MB)
                    </Button>

                  </label>

                  {/* Staged Uploaded Media Previews */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Image Preview Card */}
                    {imageUrl && (
                      <div
                        style={{
                          borderRadius: 14,
                          backgroundColor: '#FAF8F0',
                          border: '1px solid #EAE4D2',
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <PictureOutlined style={{ fontSize: 20, color: '#121314' }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <strong style={{ fontSize: 13, color: '#111213' }}>
                                  {imageFileName}
                                </strong>
                                <Tag color="#121314">IMAGE</Tag>
                              </div>
                              <span style={{ fontSize: 12, color: '#5C5E62' }}>
                                Uploaded Demonstration Image
                              </span>
                            </div>
                          </div>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              setImageUrl('');
                              setImageFileName('');
                            }}
                          />
                        </div>

                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '16/9',
                            borderRadius: 10,
                            overflow: 'hidden',
                            backgroundColor: '#121314',
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt="Uploaded preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              padding: '8px 12px',
                              background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: 12,
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircleFilled style={{ color: '#D9A74A' }} /> Verified Alignment Vector Frame
                            </span>
                            <span style={{ opacity: 0.8 }}>Primary Thumbnail</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Audio Preview Card */}
                    {audioUrl && (
                      <div
                        style={{
                          borderRadius: 14,
                          backgroundColor: '#FAF8F0',
                          border: '1px solid #EAE4D2',
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <SoundOutlined style={{ fontSize: 20, color: '#A8751E' }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <strong style={{ fontSize: 13, color: '#111213' }}>
                                  {audioFileName}
                                </strong>
                                <Tag color="gold">MP3</Tag>
                              </div>
                              <span style={{ fontSize: 12, color: '#5C5E62' }}>
                                Uploaded Chanting & Alignment Audio
                              </span>
                            </div>
                          </div>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              setAudioUrl('');
                              setAudioFileName('');
                            }}
                          />
                        </div>

                        {/* Player preview rail */}
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #EAE4D2',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: '#121314',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                              play_arrow
                            </span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 11,
                                color: '#5C5E62',
                                marginBottom: 4,
                              }}
                            >
                              <span>Chanting & Pranayama Companion</span>
                              <span style={{ fontFamily: 'monospace' }}>01:15 / 03:45</span>
                            </div>
                            <div
                              style={{
                                height: 5,
                                borderRadius: 9999,
                                backgroundColor: '#F5F1E4',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: '33%',
                                  height: '100%',
                                  backgroundColor: '#121314',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Alignment Cues & Publishing Control (5 Columns) */}
            <div style={{ gridColumn: 'span 12' }} className="upload-right-column">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Section 4: Practice Guidance & Home Study Instructions */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 24,
                    border: '1px solid #EAE4D2',
                    boxShadow: '0 2px 10px rgba(28, 24, 18, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #EAE4D2',
                      paddingBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#A8751E',
                        }}
                      >
                        04 — Cues
                      </span>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111213' }}>
                        Alignment & Breath Vectors
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-amber filled" style={{ fontSize: 18 }}>
                      draw
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      Biomechanical Alignment Cues
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                      {cues.map((cue, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: '#FAF8F0',
                            borderRadius: 8,
                            border: '1px solid #EAE4D2',
                            fontSize: 13,
                          }}
                        >
                          <span>{cue}</span>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveCue(idx)}
                          />
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input
                        value={newCue}
                        onChange={(e) => setNewCue(e.target.value)}
                        placeholder="Add new alignment vector cue..."
                        onPressEnter={handleAddCue}
                      />
                      <Button onClick={handleAddCue}>Add</Button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      Breath Pacing & Hold Duration
                    </label>
                    <Input
                      value={breathPacing}
                      onChange={(e) => setBreathPacing(e.target.value)}
                      placeholder="e.g. 5 deep Ujjayi breaths per side"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      Target Chakra / Pranic Current
                    </label>
                    <Input
                      value={targetChakra}
                      onChange={(e) => setTargetChakra(e.target.value)}
                      placeholder="e.g. Manipura (Solar Plexus)"
                    />
                  </div>
                </div>

                {/* Section 5: Studio Class Integration & Publishing Controls */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 24,
                    border: '1px solid #EAE4D2',
                    boxShadow: '0 2px 10px rgba(28, 24, 18, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #EAE4D2',
                      paddingBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#A8751E',
                        }}
                      >
                        05 — Distribution
                      </span>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111213' }}>
                        Studio Flow Association
                      </h3>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#A8751E' }}>
                      podcasts
                    </span>
                  </div>

                  {/* Toggle: Immediate Hub Publication */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: '#FAF8F0',
                      border: '1px solid #EAE4D2',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: 13, color: '#111213' }}>
                        Publish immediately to Home Hub
                      </strong>
                      <span style={{ fontSize: 12, color: '#5C5E62' }}>
                        Makes accessible right away to enrolled students via app
                      </span>
                    </div>
                    <Switch checked={publishImmediate} onChange={(val) => setPublishImmediate(val)} />
                  </div>

                  {/* Checkbox: Feature in Today's Class */}
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: '#FDF3D0',
                      border: '1px solid #EAE4D2',
                    }}
                  >
                    <Checkbox
                      checked={featureInToday}
                      onChange={(e) => setFeatureInToday(e.target.checked)}
                    >
                      <div>
                        <strong style={{ fontSize: 13, color: '#111213' }}>
                          Feature in “Today’s Class Sequence”
                        </strong>
                        <span style={{ display: 'block', fontSize: 12, color: '#5C5E62' }}>
                          Evening Restorative Flow • Studio Loft A (6:00 PM – 7:15 PM)
                        </span>
                      </div>
                    </Checkbox>
                  </div>

                  {/* Class Roster Count */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      backgroundColor: '#FAF8F0',
                      border: '1px solid #EAE4D2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#5C5E62' }}>Class Roster Recipient Count:</span>
                    <strong style={{ fontSize: 13, color: '#111213' }}>24 Active Practitioners</strong>
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      paddingTop: 8,
                      borderTop: '1px solid #EAE4D2',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Button
                        style={{ flex: 1 }}
                        onClick={() => handleSubmit(true)}
                        disabled={isSubmitting}
                      >
                        Save as Draft
                      </Button>
                      <Button
                        style={{ flex: 1 }}
                        icon={<EyeOutlined />}
                        onClick={() => setPreviewOpen(true)}
                      >
                        Preview View
                      </Button>
                    </div>

                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      loading={isSubmitting}
                      icon={<CloudUploadOutlined />}
                      style={{
                        backgroundColor: '#121314',
                        height: 48,
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      Publish to Student Library
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Preview Modal */}
      <AnatomicalCueModal
        item={previewItem}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      <style jsx global>{`
        @media (min-width: 1080px) {
          .upload-left-column {
            grid-column: span 7 !important;
          }
          .upload-right-column {
            grid-column: span 5 !important;
          }
        }
        @media (max-width: 992px) {
          .admin-main-content {
            margin-left: 0 !important;
            padding: 24px 16px 100px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function UploadPracticeItemPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '100px 0', backgroundColor: '#FAF8F0', minHeight: '100vh' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: '#5C5E62' }}>Loading upload portal...</p>
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}

