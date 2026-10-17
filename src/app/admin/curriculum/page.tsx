'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api, PracticeItem, StudioMetrics } from '../../../lib/api';
import { AdminSidebar } from '../../../components/AdminSidebar';
import { AudioPlayerBar, AudioTrack } from '../../../components/AudioPlayerBar';
import { AnatomicalCueModal } from '../../../components/AnatomicalCueModal';
import { Button, Input, Select, Tag, Dropdown, MenuProps, message, Spin, Empty, Popconfirm, Card } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DownOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  LockOutlined,
} from '@ant-design/icons';

export default function CurriculumLibraryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<StudioMetrics | null>(null);
  const [allItems, setAllItems] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePillar, setActivePillar] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [activeAudio, setActiveAudio] = useState<AudioTrack | null>(null);
  const [selectedItemForCues, setSelectedItemForCues] = useState<PracticeItem | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [metricsData, itemsData] = await Promise.all([
        api.getMetrics().catch(() => null),
        api.getCurriculum({ pillar: 'all' }),
      ]);

      if (metricsData) setMetrics(metricsData);
      setAllItems(itemsData || []);
    } catch (err: any) {
      console.error('Error fetching curriculum data:', err);
    } finally {
      setLoading(false);
    }
  };

  const items = React.useMemo(() => {
    let result = [...allItems];

    if (activePillar && activePillar !== 'all') {
      result = result.filter((item) => item.pillarType === activePillar);
    }

    if (difficultyFilter && difficultyFilter !== 'all') {
      result = result.filter((item) => item.difficulty === difficultyFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.sanskritTitle?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q),
      );
    }

    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'difficulty') {
      const order: Record<string, number> = { foundations: 1, intermediate: 2, deepening: 3 };
      result.sort((a, b) => (order[a.difficulty] || 2) - (order[b.difficulty] || 2));
    }

    return result;
  }, [allItems, activePillar, difficultyFilter, searchQuery, sortBy]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCurriculumItem(id);
      setAllItems((prev) => prev.filter((i) => i.id !== id));
      if (selectedItemForCues?.id === id) {
        setSelectedItemForCues(null);
      }
    } catch (e: any) {
      message.error('Failed to delete item');
      throw e;
    }
  };

  const uploadMenuItems: MenuProps['items'] = [
    {
      key: 'asana',
      label: (
        <div style={{ padding: '6px 4px' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#111213' }}>Pose (Asana)</p>
          <span style={{ fontSize: 12, color: '#5C5E62' }}>
            Photo sequence, cues & adjustments
          </span>
        </div>
      ),
      icon: (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: '#121314', verticalAlign: 'middle' }}
        >
          self_improvement
        </span>
      ),
      onClick: () => router.push('/admin/upload?pillar=asana'),
    },
    {
      key: 'mudra',
      label: (
        <div style={{ padding: '6px 4px' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#111213' }}>Sacred Mudra</p>
          <span style={{ fontSize: 12, color: '#5C5E62' }}>
            Breath cues & energetic locks
          </span>
        </div>
      ),
      icon: (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: '#A8751E', verticalAlign: 'middle' }}
        >
          sign_language
        </span>
      ),
      onClick: () => router.push('/admin/upload?pillar=mudra'),
    },
    {
      key: 'mantra',
      label: (
        <div style={{ padding: '6px 4px' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#111213' }}>Mantra & Chant</p>
          <span style={{ fontSize: 12, color: '#5C5E62' }}>
            Lossless MP3 & Sanskrit meter
          </span>
        </div>
      ),
      icon: (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: '#121314', verticalAlign: 'middle' }}
        >
          graphic_eq
        </span>
      ),
      onClick: () => router.push('/admin/upload?pillar=mantra'),
    },
  ];

  const totalCount =
    allItems.length || ((metrics?.activeAsanas ?? 0) + (metrics?.totalMudras ?? 0) + (metrics?.totalMantras ?? 0));
  const asanaCount = allItems.length > 0 ? allItems.filter((i) => i.pillarType === 'asana').length : (metrics?.activeAsanas ?? 0);
  const mudraCount = allItems.length > 0 ? allItems.filter((i) => i.pillarType === 'mudra').length : (metrics?.totalMudras ?? 0);
  const mantraCount = allItems.length > 0 ? allItems.filter((i) => i.pillarType === 'mantra').length : (metrics?.totalMantras ?? 0);

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
            Please sign in with an authorized teacher account.
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

      {/* Sidebar component */}
      <AdminSidebar activePillar={activePillar} onSelectPillar={(p) => setActivePillar(p)} />

      {/* Main Content Area */}
      <main
        className="admin-main-content"
        style={{
          flex: 1,
          padding: '36px 32px 100px',
          marginLeft: 256,
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Top Editorial Header & Command Ribbon */}
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
            <div className="ambient-glow-amber" style={{ top: -80, right: -80 }} />

            <div
              style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
              }}
            >
              <div style={{ maxWidth: 680 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#A8751E',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 8,
                  }}
                >
                  <span className="material-symbols-outlined filled" style={{ fontSize: 16 }}>
                    spa
                  </span>
                  <span>Pedagogy & Student Archive</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span>Semester 03 • Autumn Equinox</span>
                </div>

                <h1
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(28px, 3.5vw, 38px)',
                    color: '#111213',
                    margin: '0 0 8px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Curriculum Library
                </h1>

                <p style={{ margin: 0, fontSize: 15, color: '#5C5E62', lineHeight: 1.5 }}>
                  Manage and curate authentic poses, mudras, and chants taught inside the studio,
                  automatically synced to student self-guided rituals.
                </p>
              </div>

              {/* Upload Dropdown Button */}
              <Dropdown menu={{ items: uploadMenuItems }} trigger={['click']} placement="bottomRight">
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  style={{
                    backgroundColor: '#121314',
                    height: 46,
                    padding: '0 22px',
                    borderRadius: 12,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(18, 19, 20, 0.2)',
                  }}
                >
                  <span>Upload New Item</span>
                  <DownOutlined style={{ fontSize: 12 }} />
                </Button>
              </Dropdown>
            </div>
          </section>

          {/* Studio Metric Quick Cards Grid (3 cards) */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {/* Metric 1: Active Asanas */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 24,
                border: '1px solid #EAE4D2',
                boxShadow: '0 2px 10px rgba(28, 24, 18, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#5C5E62',
                  }}
                >
                  Active Asanas
                </span>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    backgroundColor: '#FDF3D0',
                    border: '1px solid #EAE4D2',
                    color: '#121314',
                    display: 'flex',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                    self_improvement
                  </span>
                </div>
              </div>

              <div style={{ margin: '16px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#111213' }}>
                    {metrics?.activeAsanas ?? 0}
                  </span>
                  <span style={{ fontSize: 13, color: '#A8751E', fontWeight: 600 }}>
                    +{metrics?.newAsanasThisTerm ?? 0} this term
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#5C5E62', marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 6px', borderRadius: 4, backgroundColor: '#FAF8F0', border: '1px solid #EAE4D2' }}>
                    {metrics?.foundationsCount ?? 0} Foundations
                  </span>
                  <span>•</span>
                  <span style={{ padding: '2px 6px', borderRadius: 4, backgroundColor: '#FAF8F0', border: '1px solid #EAE4D2' }}>
                    {metrics?.intermediateCount ?? 0} Intermediate
                  </span>
                  <span>•</span>
                  <span style={{ padding: '2px 6px', borderRadius: 4, backgroundColor: '#FAF8F0', border: '1px solid #EAE4D2' }}>
                    {metrics?.advancedCount ?? 0} Advanced
                  </span>
                </div>
              </div>

              {/* Multi-segment progress bar */}
              <div
                style={{
                  height: 6,
                  borderRadius: 9999,
                  backgroundColor: '#FAF8F0',
                  border: '1px solid #EAE4D2',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div style={{ width: '19%', backgroundColor: '#121314' }} />
                <div style={{ width: '57%', backgroundColor: '#D9A74A' }} />
                <div style={{ width: '24%', backgroundColor: '#FDF3D0' }} />
              </div>
            </div>

            {/* Metric 2: Sacred Mudras */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 24,
                border: '1px solid #EAE4D2',
                boxShadow: '0 2px 10px rgba(28, 24, 18, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#5C5E62',
                  }}
                >
                  Sacred Mudras
                </span>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    backgroundColor: '#FDF3D0',
                    border: '1px solid #EAE4D2',
                    color: '#A8751E',
                    display: 'flex',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                    sign_language
                  </span>
                </div>
              </div>

              <div style={{ margin: '16px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#111213' }}>
                    {metrics?.totalMudras ?? 0}
                  </span>
                  <span style={{ fontSize: 13, color: '#5C5E62' }}>Gesture guides</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5C5E62', lineHeight: 1.4 }}>
                  Paired with pranayama timing & energetic chakra cues
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid #EAE4D2',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: '#5C5E62',
                }}
              >
                <span>Prana Vayus covered</span>
                <span style={{ fontWeight: 700, color: '#A8751E' }}>
                  {metrics?.pranaVayusCovered || 'All Vayus Active'}
                </span>
              </div>
            </div>

            {/* Metric 3: Mantras & Chants */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 24,
                border: '1px solid #EAE4D2',
                boxShadow: '0 2px 10px rgba(28, 24, 18, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#5C5E62',
                  }}
                >
                  Mantras & Chants
                </span>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    backgroundColor: '#FDF3D0',
                    border: '1px solid #EAE4D2',
                    color: '#121314',
                    display: 'flex',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                    graphic_eq
                  </span>
                </div>
              </div>

              <div style={{ margin: '16px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#111213' }}>
                    {metrics?.totalMantras ?? 0}
                  </span>
                  <span style={{ fontSize: 13, color: '#A8751E', fontWeight: 600 }}>
                    Lossless MP3 audio
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#5C5E62', lineHeight: 1.4 }}>
                  Phonetic Devanagari translation + slow tempo practice loops
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid #EAE4D2',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: '#5C5E62',
                }}
              >
                <span>Average listen rate</span>
                <span style={{ fontWeight: 700, color: '#121314' }}>
                  {metrics?.averageListenRate || 'Active'}
                </span>
              </div>
            </div>
          </section>

          {/* Full-Width Content Library Section */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Filter Bar & Search Controls */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: '20px 24px',
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
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                {/* Segmented Category Tabs */}
                <div
                  style={{
                    display: 'inline-flex',
                    padding: 4,
                    borderRadius: 12,
                    backgroundColor: '#F5F1E4',
                    border: '1px solid #EAE4D2',
                    gap: 4,
                    overflowX: 'auto',
                    maxWidth: '100%',
                  }}
                >
                  {[
                    { key: 'all', label: 'All Content', count: totalCount || items.length },
                    { key: 'asana', label: 'Poses', count: asanaCount },
                    { key: 'mudra', label: 'Mudras', count: mudraCount },
                    { key: 'mantra', label: 'Mantras', count: mantraCount },
                  ].map((tab) => {
                    const active = activePillar === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActivePillar(tab.key)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          backgroundColor: active ? '#121314' : 'transparent',
                          color: active ? '#FFFFFF' : '#5C5E62',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: active ? 600 : 500,
                          fontSize: 13,
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    );
                  })}
                </div>

                {/* Sort Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#5C5E62', fontWeight: 600 }}>Sort by:</span>
                  <Select
                    value={sortBy}
                    onChange={(val) => setSortBy(val)}
                    style={{ width: 160 }}
                    options={[
                      { value: 'recent', label: 'Most Recent' },
                      { value: 'title', label: 'Alphabetical' },
                      { value: 'difficulty', label: 'Difficulty Level' },
                    ]}
                  />
                </div>
              </div>

              {/* Search & Difficulty Filter Bar */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 12,
                  borderTop: '1px solid #EAE4D2',
                  paddingTop: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 240 }}>
                  <Input
                    placeholder="Search by posture name, Sanskrit title, or cue..."
                    prefix={<SearchOutlined style={{ color: '#75777A' }} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    allowClear
                  />
                </div>

                <Select
                  value={difficultyFilter}
                  onChange={(val) => setDifficultyFilter(val)}
                  style={{ width: 180 }}
                  options={[
                    { value: 'all', label: 'All Difficulties' },
                    { value: 'foundations', label: 'Foundations' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'deepening', label: 'Advanced / Deepening' },
                  ]}
                />
              </div>
            </div>

            {/* Practice Items Cards Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
                <p style={{ marginTop: 16, color: '#5C5E62' }}>Loading curriculum repository...</p>
              </div>
            ) : items.length === 0 ? (
              <Empty
                description="No practice items match your filter criteria."
                style={{ padding: '60px 0' }}
              >
                <Button type="primary" onClick={() => router.push('/admin/upload')}>
                  Create New Practice Item
                </Button>
              </Empty>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 24,
                }}
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemForCues(item)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      border: '1px solid #EAE4D2',
                      overflow: 'hidden',
                      boxShadow: '0 2px 10px rgba(28, 24, 18, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
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
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(28, 24, 18, 0.04)';
                      e.currentTarget.style.borderColor = '#EAE4D2';
                    }}
                  >
                    {/* Media Thumbnail */}
                    <div
                      style={{
                        position: 'relative',
                        height: 190,
                        backgroundColor: '#EDE7D7',
                        overflow: 'hidden',
                      }}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
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
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 44, color: '#A8751E' }}
                          >
                            {item.pillarType === 'asana'
                              ? 'self_improvement'
                              : item.pillarType === 'mudra'
                                ? 'sign_language'
                                : 'graphic_eq'}
                          </span>
                        </div>
                      )}

                      {/* Top badges */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          right: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Tag
                          color="#121314"
                          style={{
                            padding: '2px 8px',
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.pillarType}
                        </Tag>
                        <Tag color="gold" style={{ textTransform: 'capitalize' }}>
                          {item.difficulty}
                        </Tag>
                      </div>

                      {/* Audio trigger button overlay if audio exists */}
                      {item.audioUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAudio({
                              title: item.title,
                              subtitle: item.audioDetails || 'Studio Alignment Guide',
                              durationSeconds: 210,
                              audioUrl: item.audioUrl,
                            });
                          }}
                          style={{
                            position: 'absolute',
                            bottom: 10,
                            right: 10,
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(18, 19, 20, 0.85)',
                            backdropFilter: 'blur(6px)',
                            color: '#FFFFFF',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            play_arrow
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 18,
                          color: '#111213',
                          margin: '0 0 4px',
                        }}
                      >
                        {item.title}
                      </h3>

                      {item.sanskritTitle && (
                        <span
                          style={{
                            fontSize: 12,
                            color: '#A8751E',
                            fontStyle: 'italic',
                            fontWeight: 600,
                            marginBottom: 8,
                            display: 'block',
                          }}
                        >
                          {item.sanskritTitle}
                        </span>
                      )}

                      <p
                        style={{
                          fontSize: 13,
                          color: '#5C5E62',
                          lineHeight: 1.5,
                          margin: '0 0 14px',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.description}
                      </p>

                      {/* Studio tag */}
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 16, color: '#A8751E' }}
                        >
                          verified
                        </span>
                        <span style={{ fontSize: 12, color: '#5C5E62' }}>
                          {item.classSessionName || 'Studio Autumn Flow'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div
                      style={{
                        padding: '12px 20px',
                        borderTop: '1px solid #EAE4D2',
                        backgroundColor: '#FAF8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Button
                        type="link"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemForCues(item);
                        }}
                        style={{ padding: 0, color: '#121314', fontWeight: 600 }}
                      >
                        View Cues & Media
                      </Button>

                      <div onClick={(e) => e.stopPropagation()}>
                        <Popconfirm
                          title="Delete practice item?"
                          description="This will remove it from student library."
                          onConfirm={() => handleDelete(item.id)}
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Floating Audio Console */}
      <AudioPlayerBar track={activeAudio} onClose={() => setActiveAudio(null)} />

      {/* Cue Modal */}
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
        onDelete={handleDelete}
      />

      <style jsx global>{`
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
