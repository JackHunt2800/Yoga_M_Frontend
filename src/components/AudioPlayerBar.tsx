'use client';

import React, { useState, useEffect, useRef } from 'react';
import { soundSynthesizer } from '../lib/AudioSynthesizer';
import { Tooltip } from 'antd';

export interface AudioTrack {
  title: string;
  subtitle?: string;
  durationSeconds: number;
  audioUrl?: string;
}

interface AudioPlayerBarProps {
  track: AudioTrack | null;
  onClose: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ track, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isLoop, setIsLoop] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (track) {
      setCurrentTime(0);
      setIsPlaying(true);
      // Try playing synthesized drone or audio element
      soundSynthesizer.playDrone(432, track.durationSeconds || 30);
    } else {
      setIsPlaying(false);
      soundSynthesizer.stop();
    }
  }, [track]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && track) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= track.durationSeconds) {
            if (isLoop) {
              soundSynthesizer.playDrone(432, track.durationSeconds);
              return 0;
            } else {
              setIsPlaying(false);
              return track.durationSeconds;
            }
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, track, speed, isLoop]);

  if (!track) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, (currentTime / (track.durationSeconds || 1)) * 100);

  const togglePlay = () => {
    if (isPlaying) {
      soundSynthesizer.stop();
      setIsPlaying(false);
    } else {
      soundSynthesizer.playDrone(432, track.durationSeconds - currentTime);
      setIsPlaying(true);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 0.75];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
  };

  return (
    <aside
      aria-label="Floating audio console"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 820,
        zIndex: 1050,
        backgroundColor: 'rgba(251, 249, 245, 0.94)',
        backdropFilter: 'blur(20px)',
        border: '1px solid #DDD6CE',
        borderRadius: 24,
        boxShadow: '0 8px 32px rgba(60, 48, 38, 0.12)',
        padding: '12px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Track Title & Waveform Animation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#FDF3D0',
              border: '1px solid #EAE4D2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A8751E',
              flexShrink: 0,
            }}
          >
            {isPlaying ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
                <span className="sound-bar"></span>
                <span className="sound-bar"></span>
                <span className="sound-bar"></span>
                <span className="sound-bar"></span>
              </div>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                graphic_eq
              </span>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#111213',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {track.title}
            </h4>
            <span style={{ fontSize: 11, color: '#5C5E62' }}>
              {track.subtitle || '432Hz Studio Tuned • Pranayama Companion'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Tooltip title={isLoop ? 'Looping active' : 'Loop disabled'}>
            <button
              onClick={() => setIsLoop(!isLoop)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isLoop ? '#A8751E' : '#75777A',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                repeat
              </span>
            </button>
          </Tooltip>

          <button
            onClick={togglePlay}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#121314',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(18, 19, 20, 0.25)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            onClick={cycleSpeed}
            style={{
              padding: '3px 8px',
              borderRadius: 8,
              backgroundColor: '#EDE7D7',
              border: '1px solid #EAE4D2',
              color: '#111213',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {speed}x
          </button>

          <button
            onClick={() => {
              soundSynthesizer.stop();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#5C5E62',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Timing */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#5C5E62', minWidth: 36 }}>
          {formatTime(currentTime)}
        </span>
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newPercent = clickX / rect.width;
            const newSecs = newPercent * track.durationSeconds;
            setCurrentTime(newSecs);
          }}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 9999,
            backgroundColor: '#EDE7D7',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: '#C87D55',
              borderRadius: 9999,
              transition: 'width 0.2s linear',
            }}
          />
        </div>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#5C5E62', minWidth: 36 }}>
          {formatTime(track.durationSeconds)}
        </span>
      </div>
    </aside>
  );
};
