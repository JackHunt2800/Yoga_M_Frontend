'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, PracticeItem } from '../../lib/api';
import { buildDailyPlaylists, DailyPlaylist, getDateKey } from '../../lib/playlistUtils';
import { soundSynthesizer } from '../../lib/AudioSynthesizer';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Button,
  Tag,
  Spin,
  Progress,
  Tooltip,
  Modal,
  message,
  Input,
  Radio,
  Empty,
  Slider,
} from 'antd';
import {
  PlayCircleFilled,
  PauseCircleFilled,
  StepForwardOutlined,
  StepBackwardOutlined,
  PlusOutlined,
  SoundOutlined,
  CloseOutlined,
  CheckCircleFilled,
  FireOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  FieldTimeOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

function PracticeHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // State: Data loading
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State: Filtering
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'foundations' | 'intermediate' | 'deepening'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'recent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // State: Runner
  const [activePlaylist, setActivePlaylist] = useState<DailyPlaylist | null>(null);
  const [runnerStage, setRunnerStage] = useState<'asana' | 'mudra' | 'completed'>('asana');
  const [asanaIndex, setAsanaIndex] = useState(0);
  const [mudraIndex, setMudraIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [initialSeconds, setInitialSeconds] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [cuesDrawerOpen, setCuesDrawerOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // State: Audio for Mantra
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.7);
  const [currentMantraTrackIndex, setCurrentMantraTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State: Completion stats
  const [completedStreak, setCompletedStreak] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Fetch all curriculum items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.getCurriculum();
      setItems(data);
    } catch (err: any) {
      console.error('Failed to fetch practice items:', err);
      message.error('Unable to load practice curriculum');
    } finally {
      setLoading(false);
    }
  };

  // Build playlists grouped by Created Date and Difficulty
  const allPlaylists = useMemo(() => {
    return buildDailyPlaylists(items);
  }, [items]);

  const todayDateKey = useMemo(() => getDateKey(new Date().toISOString()), []);

  // Filtered playlists
  const filteredPlaylists = useMemo(() => {
    return allPlaylists.filter((pl) => {
      // Difficulty match
      if (selectedDifficulty !== 'all' && pl.difficulty !== selectedDifficulty) {
        return false;
      }
      // Date filter
      if (selectedDateFilter === 'today' && pl.dateKey !== todayDateKey) {
        return false;
      }
      if (selectedDateFilter === 'recent') {
        // Last 7 days
        const itemDate = new Date(pl.dateKey).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (itemDate < sevenDaysAgo) return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDate = pl.displayDate.toLowerCase().includes(query) || pl.dateKey.includes(query);
        const matchesAsana = pl.asanas.some(
          (a) => a.title.toLowerCase().includes(query) || a.sanskritTitle?.toLowerCase().includes(query)
        );
        const matchesMudra = pl.mudras.some(
          (m) => m.title.toLowerCase().includes(query) || m.sanskritTitle?.toLowerCase().includes(query)
        );
        const matchesMantra = pl.mantras.some(
          (ma) => ma.title.toLowerCase().includes(query) || ma.sanskritTitle?.toLowerCase().includes(query)
        );
        return matchesDate || matchesAsana || matchesMudra || matchesMantra;
      }
      return true;
    });
  }, [allPlaylists, selectedDifficulty, selectedDateFilter, searchQuery, todayDateKey]);

  // Handle direct URL query parameters (e.g. ?startToday=true or ?date=...)
  useEffect(() => {
    if (allPlaylists.length > 0 && !activePlaylist) {
      const startTodayParam = searchParams.get('startToday');
      const playlistIdParam = searchParams.get('playlistId');

      if (playlistIdParam) {
        const target = allPlaylists.find((p) => p.id === playlistIdParam);
        if (target) startPractice(target);
      } else if (startTodayParam === 'true') {
        const todayPlaylist = allPlaylists.find((p) => p.dateKey === todayDateKey);
        if (todayPlaylist) startPractice(todayPlaylist);
      }
    }
  }, [allPlaylists, searchParams]);

  // START PRACTICE
  const startPractice = (playlist: DailyPlaylist) => {
    setActivePlaylist(playlist);
    setSessionStartTime(Date.now());
    setRunnerStage(playlist.asanas.length > 0 ? 'asana' : 'mudra');
    setAsanaIndex(0);
    setMudraIndex(0);

    const firstItem = playlist.asanas[0] || playlist.mudras[0];
    const duration = (firstItem?.durationMinutes || 3) * 60;
    setSecondsLeft(duration);
    setInitialSeconds(duration);
    setIsTimerRunning(true);
    setCurrentMantraTrackIndex(0);

    // Start background Mantra audio or fallback drone
    playBackgroundMantra(playlist, 0);
  };

  // Play background Mantra audio
  const playBackgroundMantra = (playlist: DailyPlaylist, mantraIdx: number) => {
    const mantraTracks = playlist.mantras.filter((m) => !!m.audioUrl);
    if (mantraTracks.length > 0) {
      const track = mantraTracks[mantraIdx % mantraTracks.length];
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl!;
        audioRef.current.volume = audioMuted ? 0 : audioVolume;
        audioRef.current.loop = mantraTracks.length === 1;
        audioRef.current.play().catch((err) => {
          console.warn('Audio auto-play blocked, user interaction required:', err);
        });
      }
    } else {
      // Fallback: Web Audio synthesizer peaceful 432 Hz drone tone
      if (!audioMuted) {
        soundSynthesizer.playDrone(432, 120);
      }
    }
  };

  // Handle Mantra audio ended -> cycle to next track if multiple
  const handleMantraAudioEnded = () => {
    if (!activePlaylist) return;
    const mantraTracks = activePlaylist.mantras.filter((m) => !!m.audioUrl);
    if (mantraTracks.length > 1) {
      const nextTrack = (currentMantraTrackIndex + 1) % mantraTracks.length;
      setCurrentMantraTrackIndex(nextTrack);
      playBackgroundMantra(activePlaylist, nextTrack);
    }
  };

  // Sync volume & mute changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioMuted ? 0 : audioVolume;
    }
    if (audioMuted) {
      soundSynthesizer.stop();
    }
  }, [audioMuted, audioVolume]);

  // Asana / Mudra countdown timer tick
  useEffect(() => {
    let interval: any;
    if (activePlaylist && isTimerRunning && secondsLeft > 0 && runnerStage !== 'completed') {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (activePlaylist && secondsLeft === 0 && runnerStage !== 'completed') {
      handleNext();
    }
    return () => clearInterval(interval);
  }, [activePlaylist, isTimerRunning, secondsLeft, runnerStage]);

  // Breathing pacer cycle (4s Inhale, 4s Hold, 4s Exhale)
  useEffect(() => {
    if (!activePlaylist || runnerStage === 'completed') return;
    const cycle = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 4000);
    return () => clearInterval(cycle);
  }, [activePlaylist, runnerStage]);

  // Next Step / Next Posture / Segue to Mudra / Complete
  const handleNext = () => {
    if (!activePlaylist) return;

    if (runnerStage === 'asana') {
      if (asanaIndex < activePlaylist.asanas.length - 1) {
        // Next Asana
        const nextIdx = asanaIndex + 1;
        setAsanaIndex(nextIdx);
        const nextSecs = (activePlaylist.asanas[nextIdx]?.durationMinutes || 3) * 60;
        setSecondsLeft(nextSecs);
        setInitialSeconds(nextSecs);
      } else {
        // Last Asana complete! Transition to Mudra stage
        if (activePlaylist.mudras.length > 0) {
          setRunnerStage('mudra');
          setMudraIndex(0);
          const mudraSecs = (activePlaylist.mudras[0]?.durationMinutes || 3) * 60;
          setSecondsLeft(mudraSecs);
          setInitialSeconds(mudraSecs);
          message.info('Asanas complete! Segueing into Closing Mudra & Meditation 🙏');
        } else {
          // No mudras for this day, finish session
          finishSession();
        }
      }
    } else if (runnerStage === 'mudra') {
      if (mudraIndex < activePlaylist.mudras.length - 1) {
        // Next Mudra
        const nextIdx = mudraIndex + 1;
        setMudraIndex(nextIdx);
        const nextSecs = (activePlaylist.mudras[nextIdx]?.durationMinutes || 3) * 60;
        setSecondsLeft(nextSecs);
        setInitialSeconds(nextSecs);
      } else {
        // All mudras complete! Finish session
        finishSession();
      }
    }
  };

  // Previous Step
  const handlePrev = () => {
    if (!activePlaylist) return;

    if (runnerStage === 'mudra') {
      if (mudraIndex > 0) {
        const prevIdx = mudraIndex - 1;
        setMudraIndex(prevIdx);
        const prevSecs = (activePlaylist.mudras[prevIdx]?.durationMinutes || 3) * 60;
        setSecondsLeft(prevSecs);
        setInitialSeconds(prevSecs);
      } else if (activePlaylist.asanas.length > 0) {
        // Back to last Asana
        setRunnerStage('asana');
        const lastAsanaIdx = activePlaylist.asanas.length - 1;
        setAsanaIndex(lastAsanaIdx);
        const prevSecs = (activePlaylist.asanas[lastAsanaIdx]?.durationMinutes || 3) * 60;
        setSecondsLeft(prevSecs);
        setInitialSeconds(prevSecs);
      }
    } else if (runnerStage === 'asana') {
      if (asanaIndex > 0) {
        const prevIdx = asanaIndex - 1;
        setAsanaIndex(prevIdx);
        const prevSecs = (activePlaylist.asanas[prevIdx]?.durationMinutes || 3) * 60;
        setSecondsLeft(prevSecs);
        setInitialSeconds(prevSecs);
      }
    }
  };

  // Add 30 seconds to current pose timer
  const handleAdd30s = () => {
    setSecondsLeft((s) => s + 30);
    setInitialSeconds((init) => init + 30);
  };

  // Finish practice session
  const finishSession = async () => {
    setRunnerStage('completed');
    setIsTimerRunning(false);
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#A8751E', '#3D5A4C', '#D9A74A', '#C87D55'],
    });

    try {
      const res = await api.completeTodaySession(user?.uid);
      setCompletedStreak(res.newStreak);
      message.success('Practice recorded! Your streak has increased.');
    } catch (err) {
      console.error('Failed to log completion:', err);
    }
  };

  // Exit runner
  const exitRunner = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    soundSynthesizer.stop();
    setActivePlaylist(null);
    setRunnerStage('asana');
    setIsTimerRunning(false);
    setShowExitConfirm(false);
  };

  // Format seconds to mm:ss
  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Current active item
  const currentItem = useMemo(() => {
    if (!activePlaylist) return null;
    if (runnerStage === 'asana') {
      return activePlaylist.asanas[asanaIndex] || null;
    }
    if (runnerStage === 'mudra') {
      return activePlaylist.mudras[mudraIndex] || null;
    }
    return null;
  }, [activePlaylist, runnerStage, asanaIndex, mudraIndex]);

  // Current active mantra name
  const currentMantraTrack = useMemo(() => {
    if (!activePlaylist || activePlaylist.mantras.length === 0) return null;
    const mantraTracks = activePlaylist.mantras.filter((m) => !!m.audioUrl);
    if (mantraTracks.length > 0) {
      return mantraTracks[currentMantraTrackIndex % mantraTracks.length];
    }
    return activePlaylist.mantras[0];
  }, [activePlaylist, currentMantraTrackIndex]);

  const difficultyColor = {
    foundations: { text: '#3D5A4C', bg: '#E8F0EC', border: '#C2D6CC' },
    intermediate: { text: '#A8751E', bg: '#FDF3D0', border: '#EAE4D2' },
    deepening: { text: '#C87D55', bg: '#FBEFEA', border: '#ECC8B8' },
  };

  // -------------------------------------------------------------
  // RENDER: RUNNER VIEW
  // -------------------------------------------------------------
  if (activePlaylist) {
    const timerProgress = initialSeconds > 0 ? Math.round(((initialSeconds - secondsLeft) / initialSeconds) * 100) : 0;
    const totalPoses = activePlaylist.asanas.length;
    const totalMudras = activePlaylist.mudras.length;

    return (
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#FAF8F0',
          position: 'relative',
          paddingTop: 80,
          paddingBottom: 60,
        }}
      >
        <audio ref={audioRef} onEnded={handleMantraAudioEnded} />

        {/* Top Floating Runner Bar */}
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 72,
            backgroundColor: 'rgba(250, 248, 240, 0.95)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid #EAE4D2',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          {/* Back/Exit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => (runnerStage === 'completed' ? exitRunner() : setShowExitConfirm(true))}
              style={{ fontSize: 16, color: '#111213' }}
            >
              Exit Practice
            </Button>

            <div style={{ height: 24, width: 1, backgroundColor: '#EAE4D2' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, color: '#111213', fontSize: 15 }}>
                  {activePlaylist.displayDate}
                </span>
                <Tag
                  style={{
                    borderRadius: 9999,
                    margin: 0,
                    textTransform: 'capitalize',
                    fontWeight: 600,
                    backgroundColor: difficultyColor[activePlaylist.difficulty].bg,
                    color: difficultyColor[activePlaylist.difficulty].text,
                    border: `1px solid ${difficultyColor[activePlaylist.difficulty].border}`,
                  }}
                >
                  {activePlaylist.difficulty}
                </Tag>
              </div>
              <div style={{ fontSize: 12, color: '#68645C' }}>
                {runnerStage === 'asana' && `Asana ${asanaIndex + 1} of ${totalPoses}`}
                {runnerStage === 'mudra' && `Closing Mudra ${mudraIndex + 1} of ${totalMudras}`}
                {runnerStage === 'completed' && 'Session Complete'}
              </div>
            </div>
          </div>

          {/* Background Mantra Audio Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              backgroundColor: '#F3EFE4',
              padding: '6px 16px',
              borderRadius: 9999,
              border: '1px solid #E2DCCC',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 18,
                  color: audioMuted ? '#8E8A80' : '#A8751E',
                  animation: !audioMuted && isTimerRunning ? 'pulse 2s infinite' : 'none',
                }}
              >
                {audioMuted ? 'volume_off' : 'spatial_audio'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#44413C', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentMantraTrack?.title || '432Hz Drone Harmony'}
              </span>
            </div>

            {/* Mute/Unmute */}
            <Tooltip title={audioMuted ? 'Unmute Mantra' : 'Mute Mantra'}>
              <Button
                type="text"
                size="small"
                onClick={() => setAudioMuted(!audioMuted)}
                icon={
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {audioMuted ? 'volume_off' : 'volume_up'}
                  </span>
                }
              />
            </Tooltip>

            {/* Volume slider */}
            <div style={{ width: 70 }} className="hidden-on-mobile">
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={audioMuted ? 0 : audioVolume}
                onChange={(val) => {
                  setAudioVolume(val);
                  if (audioMuted) setAudioMuted(false);
                }}
              />
            </div>
          </div>
        </header>

        {/* Content Box */}
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 20px' }}>
          {runnerStage === 'completed' ? (
            /* COMPLETED CELEBRATION SCREEN */
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                border: '1px solid #EAE4D2',
                padding: '60px 40px',
                textAlign: 'center',
                boxShadow: '0 12px 40px rgba(40, 32, 20, 0.06)',
                maxWidth: 640,
                margin: '40px auto 0',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: '#FDF3D0',
                  border: '2px solid #EAE4D2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#A8751E',
                }}
              >
                <CheckCircleFilled style={{ fontSize: 44 }} />
              </div>

              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 34,
                  color: '#111213',
                  marginBottom: 12,
                }}
              >
                Practice Complete!
              </h1>

              <p style={{ color: '#5C5E62', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
                You have honored your body and breath today. Your sequence of asanas, closing mudra, and sacred chanting has been harmoniously recorded.
              </p>

              {/* Stats Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16,
                  marginBottom: 36,
                }}
              >
                <div style={{ backgroundColor: '#FAF8F0', padding: '16px', borderRadius: 16, border: '1px solid #EAE4D2' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#A8751E' }}>{totalPoses}</div>
                  <div style={{ fontSize: 13, color: '#68645C' }}>Asanas Completed</div>
                </div>

                <div style={{ backgroundColor: '#FAF8F0', padding: '16px', borderRadius: 16, border: '1px solid #EAE4D2' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#3D5A4C' }}>{totalMudras}</div>
                  <div style={{ fontSize: 13, color: '#68645C' }}>Mudras Sealed</div>
                </div>

                <div style={{ backgroundColor: '#FAF8F0', padding: '16px', borderRadius: 16, border: '1px solid #EAE4D2' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#C87D55' }}>
                    {completedStreak !== null ? completedStreak : 1}
                  </div>
                  <div style={{ fontSize: 13, color: '#68645C' }}>Day Streak 🔥</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <Button
                  size="large"
                  type="primary"
                  onClick={exitRunner}
                  style={{
                    backgroundColor: '#121314',
                    height: 48,
                    padding: '0 32px',
                    borderRadius: 9999,
                    fontWeight: 600,
                  }}
                >
                  Return to Playlists
                </Button>

                <Button
                  size="large"
                  onClick={() => router.push('/')}
                  style={{
                    height: 48,
                    padding: '0 28px',
                    borderRadius: 9999,
                    borderColor: '#DDD6CE',
                  }}
                >
                  Go to Home
                </Button>
              </div>
            </div>
          ) : (
            /* ACTIVE RUNNER CARD (ASANA & MUDRA) */
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                border: '1px solid #EAE4D2',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(40, 32, 20, 0.05)',
              }}
            >
              {/* Stage Progress Bar */}
              <div style={{ backgroundColor: '#F5F1E4', padding: '12px 24px', borderBottom: '1px solid #EAE4D2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20, color: runnerStage === 'asana' ? '#A8751E' : '#3D5A4C' }}
                  >
                    {runnerStage === 'asana' ? 'self_improvement' : 'pan_tool'}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#111213' }}>
                    {runnerStage === 'asana' ? 'Postural Asana Phase' : 'Closing Mudra & Stillness'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#68645C' }}>
                    {runnerStage === 'asana'
                      ? `Pose ${asanaIndex + 1} of ${totalPoses}`
                      : `Mudra ${mudraIndex + 1} of ${totalMudras}`}
                  </span>
                  <div style={{ width: 120 }}>
                    <Progress
                      percent={
                        runnerStage === 'asana'
                          ? Math.round(((asanaIndex + 1) / totalPoses) * 100)
                          : Math.round(((mudraIndex + 1) / totalMudras) * 100)
                      }
                      showInfo={false}
                      strokeColor={runnerStage === 'asana' ? '#A8751E' : '#3D5A4C'}
                      size="small"
                    />
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: currentItem?.imageUrl ? '1.1fr 1.2fr' : '1fr',
                  gap: 32,
                  padding: 32,
                  alignItems: 'center',
                }}
              >
                {/* Media Column (if available) */}
                {currentItem?.imageUrl && (
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: 20,
                      overflow: 'hidden',
                      backgroundColor: '#FAF8F0',
                      border: '1px solid #EAE4D2',
                      minHeight: 380,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={currentItem.imageUrl}
                      alt={currentItem.imageAlt || currentItem.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        maxHeight: 440,
                        objectFit: 'contain',
                        borderRadius: 18,
                      }}
                    />

                    {currentItem.targetChakra && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 16,
                          left: 16,
                          backgroundColor: 'rgba(18, 19, 20, 0.75)',
                          backdropFilter: 'blur(8px)',
                          color: '#FFFFFF',
                          padding: '4px 12px',
                          borderRadius: 9999,
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#D9A74A' }}>
                          spa
                        </span>
                        Chakra: {currentItem.targetChakra}
                      </div>
                    )}
                  </div>
                )}

                {/* Details & Controls Column */}
                <div>
                  {/* Sanskrit & Title */}
                  {currentItem?.sanskritTitle && (
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: 'italic',
                        fontSize: 17,
                        color: '#A8751E',
                        marginBottom: 4,
                      }}
                    >
                      {currentItem.sanskritTitle}
                    </div>
                  )}

                  <h2
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 32,
                      color: '#111213',
                      marginBottom: 12,
                    }}
                  >
                    {currentItem?.title || 'Mindful Posture'}
                  </h2>

                  <p style={{ color: '#5C5E62', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                    {currentItem?.description}
                  </p>

                  {/* Badges / Pill row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
                    {currentItem?.holdBreaths && (
                      <Tag color="gold" style={{ borderRadius: 9999 }}>
                        {currentItem.holdBreaths}
                      </Tag>
                    )}
                    {currentItem?.pranicCurrent && (
                      <Tag color="cyan" style={{ borderRadius: 9999 }}>
                        Prana: {currentItem.pranicCurrent}
                      </Tag>
                    )}
                    {currentItem?.breathPacing && (
                      <Tag color="purple" style={{ borderRadius: 9999 }}>
                        Pacing: {currentItem.breathPacing}
                      </Tag>
                    )}
                  </div>

                  {/* Interactive Timer & Breathing Hub */}
                  <div
                    style={{
                      backgroundColor: '#FAF8F0',
                      border: '1px solid #EAE4D2',
                      borderRadius: 20,
                      padding: '24px 28px',
                      marginBottom: 28,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 20,
                    }}
                  >
                    {/* Time Counter */}
                    <div>
                      <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#68645C', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>
                        Time Remaining
                      </div>
                      <div
                        style={{
                          fontSize: 44,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: secondsLeft <= 10 ? '#C84C32' : '#111213',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {formatTimer(secondsLeft)}
                      </div>
                    </div>

                    {/* Breathing Pacer Visualizer */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 20px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 16,
                        border: '1px solid #EAE4D2',
                        minWidth: 150,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor:
                            breathPhase === 'Inhale'
                              ? '#E8F0EC'
                              : breathPhase === 'Hold'
                              ? '#FDF3D0'
                              : '#FBEFEA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 4,
                          transform: breathPhase === 'Inhale' ? 'scale(1.15)' : 'scale(0.9)',
                          transition: 'all 1.5s ease-in-out',
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 18,
                            color:
                              breathPhase === 'Inhale'
                                ? '#3D5A4C'
                                : breathPhase === 'Hold'
                                ? '#A8751E'
                                : '#C87D55',
                          }}
                        >
                          {breathPhase === 'Inhale' ? 'north' : breathPhase === 'Hold' ? 'pause' : 'south'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111213' }}>
                        {breathPhase}
                      </div>
                      <div style={{ fontSize: 11, color: '#8E8A80' }}>4s Guided Breath</div>
                    </div>
                  </div>

                  {/* Runner Control Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Button
                      size="large"
                      icon={<StepBackwardOutlined />}
                      onClick={handlePrev}
                      disabled={runnerStage === 'asana' && asanaIndex === 0}
                      style={{ borderRadius: 9999, height: 46 }}
                    >
                      Previous
                    </Button>

                    <Button
                      type="primary"
                      size="large"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      icon={isTimerRunning ? <PauseCircleFilled /> : <PlayCircleFilled />}
                      style={{
                        backgroundColor: '#121314',
                        borderRadius: 9999,
                        height: 46,
                        padding: '0 24px',
                        fontWeight: 600,
                      }}
                    >
                      {isTimerRunning ? 'Pause' : 'Resume'}
                    </Button>

                    <Button
                      size="large"
                      icon={<StepForwardOutlined />}
                      onClick={handleNext}
                      style={{ borderRadius: 9999, height: 46 }}
                    >
                      {runnerStage === 'asana' && asanaIndex === totalPoses - 1 ? 'Go to Mudra' : 'Next'}
                    </Button>

                    <Tooltip title="Add 30 seconds to this posture">
                      <Button
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={handleAdd30s}
                        style={{ borderRadius: 9999, height: 46 }}
                      >
                        +30s
                      </Button>
                    </Tooltip>

                    {currentItem?.alignmentCues && currentItem.alignmentCues.length > 0 && (
                      <Button
                        size="large"
                        icon={<InfoCircleOutlined />}
                        onClick={() => setCuesDrawerOpen(!cuesDrawerOpen)}
                        style={{ borderRadius: 9999, height: 46 }}
                      >
                        Cues ({currentItem.alignmentCues.length})
                      </Button>
                    )}
                  </div>

                  {/* Alignment Cues Accordion */}
                  {cuesDrawerOpen && currentItem?.alignmentCues && (
                    <div
                      style={{
                        marginTop: 24,
                        padding: 20,
                        backgroundColor: '#FAF8F0',
                        borderRadius: 16,
                        border: '1px solid #EAE4D2',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#111213', marginBottom: 10 }}>
                        Anatomical & Alignment Cues:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: '#5C5E62', fontSize: 14 }}>
                        {currentItem.alignmentCues.map((cue, idx) => (
                          <li key={idx} style={{ marginBottom: 6 }}>
                            {cue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exit Confirmation Modal */}
        <Modal
          open={showExitConfirm}
          onCancel={() => setShowExitConfirm(false)}
          onOk={exitRunner}
          okText="Yes, Exit Practice"
          cancelText="Keep Practicing"
          okButtonProps={{ danger: true, style: { borderRadius: 9999 } }}
          cancelButtonProps={{ style: { borderRadius: 9999 } }}
          centered
        >
          <div style={{ padding: '16px 0' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 8 }}>
              Exit practice session?
            </h3>
            <p style={{ color: '#5C5E62', margin: 0 }}>
              Your current timed progress for this session will not be saved towards today's streak until you complete all asanas and the closing mudra.
            </p>
          </div>
        </Modal>
      </main>
    );
  }

  // -------------------------------------------------------------
  // RENDER: PLAYLIST CATALOG BROWSER VIEW
  // -------------------------------------------------------------
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF8F0', paddingBottom: 100 }}>
      {/* Ambient background glows */}
      <div className="ambient-glow-amber" style={{ top: -100, right: 20 }} />
      <div className="ambient-glow-terracotta" style={{ top: 400, left: -50 }} />

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '36px 24px' }}>
        {/* Breadcrumb / Top Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Link href="/" style={{ color: '#8E8A80', textDecoration: 'none', fontSize: 14 }}>
            Home
          </Link>
          <span style={{ color: '#8E8A80' }}>/</span>
          <span style={{ color: '#111213', fontWeight: 600, fontSize: 14 }}>Daily Practice Hub</span>
        </div>

        {/* Hero Section */}
        <div
          style={{
            backgroundColor: '#F5F1E4',
            borderRadius: 24,
            padding: '40px 36px',
            border: '1px solid #EAE4D2',
            boxShadow: '0 4px 24px rgba(28, 24, 18, 0.04)',
            marginBottom: 36,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ maxWidth: 720, position: 'relative', zIndex: 2 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#FAF8F0',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                color: '#A8751E',
                marginBottom: 16,
                border: '1px solid #EAE4D2',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                queue_music
              </span>
              Curated Daily Practice Playlists
            </div>

            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 38,
                color: '#111213',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              Select Your Sacred Practice Flow
            </h1>

            <p style={{ color: '#5C5E62', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
              Each playlist is composed from the asanas, closing mudras, and ambient chanting mantras added on that date. Select a session below to launch the dedicated posture timers and immersion.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: '20px 24px',
            border: '1px solid #EAE4D2',
            boxShadow: '0 2px 12px rgba(28, 24, 18, 0.03)',
            marginBottom: 32,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Difficulty Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#68645C', marginRight: 4 }}>
              Difficulty:
            </span>
            {(['all', 'foundations', 'intermediate', 'deepening'] as const).map((diff) => {
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  style={{
                    backgroundColor: isSelected ? '#121314' : '#FAF8F0',
                    color: isSelected ? '#FFFFFF' : '#44413C',
                    border: `1px solid ${isSelected ? '#121314' : '#EAE4D2'}`,
                    padding: '6px 16px',
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {diff}
                </button>
              );
            })}
          </div>

          {/* Date Filter & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Date filter toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#68645C', marginRight: 4 }}>
                Date:
              </span>
              <Radio.Group
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                buttonStyle="solid"
                size="middle"
              >
                <Radio.Button value="all">All Dates</Radio.Button>
                <Radio.Button value="today">Today Only</Radio.Button>
                <Radio.Button value="recent">Past 7 Days</Radio.Button>
              </Radio.Group>
            </div>

            {/* Search Input */}
            <Input
              prefix={<SearchOutlined style={{ color: '#8E8A80' }} />}
              placeholder="Search posture, mudra, mantra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: 240,
                borderRadius: 9999,
                backgroundColor: '#FAF8F0',
                border: '1px solid #EAE4D2',
              }}
              allowClear
            />
          </div>
        </div>

        {/* Playlists Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#68645C' }}>Gathering your daily yoga playlists...</div>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: '64px 24px',
              textAlign: 'center',
              border: '1px solid #EAE4D2',
            }}
          >
            <Empty
              description={
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#111213', marginBottom: 8 }}>
                    No Practice Playlists Found
                  </h3>
                  <p style={{ color: '#68645C', maxWidth: 440, margin: '0 auto 20px' }}>
                    {selectedDateFilter === 'today'
                      ? "No postures have been added today yet. Try switching to 'All Dates' or upload new items in the admin portal."
                      : 'No items match your filter selection. Try resetting filters or adding new content.'}
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedDifficulty('all');
                      setSelectedDateFilter('all');
                      setSearchQuery('');
                    }}
                    style={{ borderRadius: 9999 }}
                  >
                    Clear Filters
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: 24,
            }}
          >
            {filteredPlaylists.map((playlist) => {
              const diffStyle = difficultyColor[playlist.difficulty];
              const asanaCount = playlist.asanas.length;
              const mudraCount = playlist.mudras.length;
              const mantraCount = playlist.mantras.length;

              return (
                <div
                  key={playlist.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 22,
                    border: '1px solid #EAE4D2',
                    padding: 24,
                    boxShadow: '0 4px 16px rgba(28, 24, 18, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <div>
                    {/* Top Header: Date & Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#111213' }}>
                          {playlist.displayDate}
                        </span>
                        {playlist.isToday && (
                          <Tag color="gold" style={{ borderRadius: 9999, fontWeight: 600, margin: 0 }}>
                            Today
                          </Tag>
                        )}
                      </div>

                      <Tag
                        style={{
                          borderRadius: 9999,
                          margin: 0,
                          textTransform: 'capitalize',
                          fontWeight: 600,
                          backgroundColor: diffStyle.bg,
                          color: diffStyle.text,
                          border: `1px solid ${diffStyle.border}`,
                        }}
                      >
                        {playlist.difficulty}
                      </Tag>
                    </div>

                    {/* Duration & Count summary */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        color: '#68645C',
                        fontSize: 13,
                        marginBottom: 20,
                        backgroundColor: '#FAF8F0',
                        padding: '8px 14px',
                        borderRadius: 12,
                        border: '1px solid #EAE4D2',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FieldTimeOutlined style={{ color: '#A8751E' }} />
                        {playlist.totalDurationMinutes} mins
                      </span>
                      <span>•</span>
                      <span>{asanaCount} {asanaCount === 1 ? 'Asana' : 'Asanas'}</span>
                      <span>•</span>
                      <span>{mudraCount} {mudraCount === 1 ? 'Mudra' : 'Mudras'}</span>
                    </div>

                    {/* Asanas list preview */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#8E8A80', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 10 }}>
                        Posture Sequence ({asanaCount}):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {playlist.asanas.slice(0, 4).map((asana, idx) => (
                          <div
                            key={asana.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: 14,
                              color: '#333',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#A8751E', fontWeight: 600, fontSize: 12, width: 18 }}>
                                {idx + 1}.
                              </span>
                              <span style={{ fontWeight: 500, color: '#111213' }}>{asana.title}</span>
                              {asana.sanskritTitle && (
                                <span style={{ color: '#8E8A80', fontSize: 12, fontStyle: 'italic' }}>
                                  ({asana.sanskritTitle})
                                </span>
                              )}
                            </span>
                            <span style={{ color: '#8E8A80', fontSize: 12 }}>
                              {asana.durationMinutes || 3}m
                            </span>
                          </div>
                        ))}

                        {asanaCount > 4 && (
                          <div style={{ fontSize: 12, color: '#8E8A80', fontStyle: 'italic', marginTop: 2 }}>
                            +{asanaCount - 4} more postures in sequence
                          </div>
                        )}

                        {asanaCount === 0 && (
                          <div style={{ fontSize: 13, color: '#8E8A80', fontStyle: 'italic' }}>
                            Dedicated Mudra & Mantra Meditation session
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Closing Mudra & Mantra indicator */}
                    <div
                      style={{
                        paddingTop: 14,
                        borderTop: '1px dashed #EAE4D2',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginBottom: 20,
                        fontSize: 13,
                      }}
                    >
                      {mudraCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3D5A4C' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            pan_tool
                          </span>
                          <span>
                            <strong>Closing Mudra:</strong> {playlist.mudras[0].title}
                          </span>
                        </div>
                      )}

                      {mantraCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A8751E' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            music_note
                          </span>
                          <span>
                            <strong>Mantra Chanting:</strong> {playlist.mantras[0].title}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Start Button */}
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleFilled />}
                    onClick={() => startPractice(playlist)}
                    style={{
                      backgroundColor: '#121314',
                      height: 48,
                      borderRadius: 9999,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(18, 19, 20, 0.15)',
                    }}
                    block
                  >
                    Start Practice Session
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function PracticeHubPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '100px 0', backgroundColor: '#FAF8F0', minHeight: '100vh' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#68645C' }}>Loading your sacred practice...</div>
        </div>
      }
    >
      <PracticeHubContent />
    </Suspense>
  );
}
