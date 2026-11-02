'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { api, UserProfileResponse } from '../../lib/api';
import { message, Spin } from 'antd';
import styles from '../../styles/profile.module.scss';

const AGE_RANGES = ['18–24', '25–34', '35–44', '45–54', '55–64', '65+'];
const GENDER_OPTIONS = ['Female', 'Male', 'Non-Binary', 'Prefer not to say'];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form Fields
  const [height, setHeight] = useState<number | string>(168);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weight, setWeight] = useState<number | string>(58);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [ageRange, setAgeRange] = useState<string>('25–34');
  const [gender, setGender] = useState<string>('Female');

  // Display & Teacher Meta
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string>('');
  const [assignedTeacher, setAssignedTeacher] = useState<string>('Elena Vance');
  const [streakDays, setStreakDays] = useState<number>(7);
  const [role, setRole] = useState<string>('student');

  // Load initial data
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setLoading(true);

        // Fetch user profile from backend
        const profile: UserProfileResponse = await api.getMe();
        if (!isMounted) return;

        if (profile) {
          if (profile.height !== undefined && profile.height !== null) {
            setHeight(profile.height);
          }
          if (profile.heightUnit === 'cm' || profile.heightUnit === 'ft') {
            setHeightUnit(profile.heightUnit);
          }
          if (profile.weight !== undefined && profile.weight !== null) {
            setWeight(profile.weight);
          }
          if (profile.weightUnit === 'kg' || profile.weightUnit === 'lbs') {
            setWeightUnit(profile.weightUnit);
          }
          if (profile.ageRange) {
            setAgeRange(profile.ageRange);
          }
          if (profile.gender) {
            setGender(profile.gender);
          }
          if (profile.displayName) {
            setDisplayName(profile.displayName);
          }
          if (profile.email) {
            setEmail(profile.email);
          }
          if (profile.photoURL) {
            setPhotoURL(profile.photoURL);
          }
          if (profile.streakDays !== undefined) {
            setStreakDays(profile.streakDays);
          }
          if (profile.role) {
            setRole(profile.role);
          }
        }

        // Fetch assigned teacher from Today's Class Sequence
        try {
          const todayClass = await api.getTodayClassSequence();
          if (todayClass?.curatedBy && isMounted) {
            setAssignedTeacher(todayClass.curatedBy);
          }
        } catch {
          // Keep default teacher "Elena Vance" if sequence unavailable
        }
      } catch (err: any) {
        console.warn('Could not load profile from backend, using auth defaults:', err.message);
        if (user && isMounted) {
          setDisplayName(user.displayName || '');
          setEmail(user.email || '');
          setPhotoURL(user.photoURL || '');
          setRole(user.role || 'student');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      loadProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  // If user signs in or changes via Firebase Auth, update display defaults
  useEffect(() => {
    if (user) {
      if (!displayName && user.displayName) setDisplayName(user.displayName);
      if (!email && user.email) setEmail(user.email);
      if (!photoURL && user.photoURL) setPhotoURL(user.photoURL);
    }
  }, [user, displayName, email, photoURL]);

  // Unit conversion helpers
  const handleHeightUnitToggle = (newUnit: 'cm' | 'ft') => {
    if (newUnit === heightUnit) return;
    const num = parseFloat(String(height));
    if (!isNaN(num) && num > 0) {
      if (newUnit === 'ft') {
        // cm to ft (e.g. 168 cm -> 5.5 ft)
        const inFeet = (num / 30.48).toFixed(1);
        setHeight(parseFloat(inFeet));
      } else {
        // ft to cm (e.g. 5.5 ft -> 168 cm)
        const inCm = Math.round(num * 30.48);
        setHeight(inCm);
      }
    }
    setHeightUnit(newUnit);
  };

  const handleWeightUnitToggle = (newUnit: 'kg' | 'lbs') => {
    if (newUnit === weightUnit) return;
    const num = parseFloat(String(weight));
    if (!isNaN(num) && num > 0) {
      if (newUnit === 'lbs') {
        // kg to lbs
        const inLbs = Math.round(num * 2.20462);
        setWeight(inLbs);
      } else {
        // lbs to kg
        const inKg = Math.round(num / 2.20462);
        setWeight(inKg);
      }
    }
    setWeightUnit(newUnit);
  };

  // Dynamic conversion hints
  const heightHint = useMemo(() => {
    const num = parseFloat(String(height));
    if (isNaN(num) || num <= 0) return 'Used for standing sequence reach & strap lengths.';
    if (heightUnit === 'cm') {
      const totalInches = num / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `Equivalent to ${feet}'${inches}". Used for standing sequence reach & strap lengths.`;
    } else {
      const inCm = Math.round(num * 30.48);
      return `Equivalent to ~${inCm} cm. Used for standing sequence reach & strap lengths.`;
    }
  }, [height, heightUnit]);

  const weightHint = useMemo(() => {
    const num = parseFloat(String(weight));
    if (isNaN(num) || num <= 0) return 'Guides ground reaction & joint pressure cues.';
    if (weightUnit === 'kg') {
      const inLbs = Math.round(num * 2.20462);
      return `Equivalent to ~${inLbs} lbs. Guides ground reaction & joint pressure cues.`;
    } else {
      const inKg = Math.round(num / 2.20462);
      return `Equivalent to ~${inKg} kg. Guides ground reaction & joint pressure cues.`;
    }
  }, [weight, weightUnit]);

  // Save handler
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        height: height !== '' ? Number(height) : undefined,
        heightUnit,
        weight: weight !== '' ? Number(weight) : undefined,
        weightUnit,
        ageRange,
        gender,
      };

      await api.updateMe(undefined, payload);

      setSavedSuccess(true);
      message.success('Practitioner profile calibrated and saved successfully.');

      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      message.error(err.message || 'Failed to update practitioner profile');
    } finally {
      setSaving(false);
    }
  };

  const initialLetter = useMemo(() => {
    const name = displayName || user?.displayName || email || 'Maya Tan';
    return name.charAt(0).toUpperCase();
  }, [displayName, user, email]);

  const resolvedPhoto = photoURL || user?.photoURL || '';

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        {/* Top Editorial Header & Breadcrumb */}
        <div className={styles.headerRow}>
          <div className={styles.headerContent}>
            <div className={styles.breadcrumb}>
              <Link href="/" className={styles.crumbLink}>
                Student Sanctuary
              </Link>
              <span className={styles.divider}>/</span>
              <span className={styles.activeCrumb}>Profile Settings &amp; Intentions</span>
            </div>
            <h1 className={styles.title}>Practitioner Profile &amp; Intentions</h1>
            <p className={styles.description}>
              Personalize your anatomical bio-metrics and mindful movement goals so teacher{' '}
              <span className={styles.teacherHighlight}>{assignedTeacher}</span> and your home routines
              adapt seamlessly to your physical envelope.
            </p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.syncBadge}>
              <span className={styles.pulseDot} />
              <span>Syncing with Studio Loft A • Active</span>
            </div>

            <button
              id="save-profile-btn"
              type="button"
              className={`${styles.saveButton} ${savedSuccess ? styles.saved : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              <span className={`material-symbols-outlined ${styles.saveIcon}`}>
                {savedSuccess ? 'task_alt' : 'check_circle'}
              </span>
              <span>
                {saving
                  ? 'Saving...'
                  : savedSuccess
                  ? 'Profile Calibrated & Saved!'
                  : 'Save Changes'}
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 320,
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <Spin size="large" />
            <p style={{ color: '#5C5E62', fontSize: 14 }}>
              Loading practitioner sanctuary profile...
            </p>
          </div>
        ) : (
          /* Main Workspace Grid: Asymmetric 4 / 8 Split */
          <div className={styles.mainGrid}>
            {/* LEFT COLUMN: Identity & Studio Pass (4 cols) */}
            <div className={styles.leftColumn}>
              <div className={styles.identityCard}>
                {/* Avatar Container (Read-only Google photo, per requirements) */}
                <div className={styles.avatarWrapper}>
                  <div className={styles.avatarFrame}>
                    {resolvedPhoto ? (
                      <img
                        src={resolvedPhoto}
                        alt={displayName || 'Practitioner Portrait'}
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={styles.avatarFallback}>{initialLetter}</div>
                    )}
                  </div>
                </div>

                {/* Identity Name & Badges */}
                <h2 className={styles.userName}>{displayName || 'Maya Tan'}</h2>

                <div className={styles.roleBadge}>
                  <span className={`material-symbols-outlined ${styles.verifiedIcon}`}>
                    verified
                  </span>
                  <span>{role === 'teacher' ? 'Teacher Admin' : 'Dedicated Practitioner'}</span>
                </div>

                <p className={styles.userBio}>
                  Practicing alignment-focused vinyasa &amp; mindful movement at Methsara Yoga.
                </p>

                {/* Metadata List */}
                <div className={styles.metadataBox}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Email</span>
                    <span className={styles.metaValue}>
                      {email || user?.email || 'm.tan@sanctuary.io'}
                    </span>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Studio Membership</span>
                    <span className={styles.metaValue}>
                      <span className={styles.membershipDot} />
                      Loft Unlimited
                    </span>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Lead Instructor</span>
                    <span className={styles.metaValue}>{assignedTeacher}</span>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Cohort Location</span>
                    <span className={styles.metaValue}>Studio Loft A (Dusk)</span>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Practice Streak</span>
                    <span className={styles.metaValue}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: '#A8751E' }}
                      >
                        local_fire_department
                      </span>
                      {streakDays} Days Strong
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Bio-metrics & Teacher Alignment Guidance (8 cols) */}
            <div className={styles.rightColumn}>
              {/* SECTION: Physical Bio-Metrics */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeaderRow}>
                  <div>
                    <div className={styles.sectionSuperTag}>
                      <span className={`material-symbols-outlined ${styles.tagIcon}`}>
                        monitor_heart
                      </span>
                      <span>Anatomical Architecture</span>
                    </div>
                    <h2 className={styles.sectionTitle}>Physical Bio-Metrics</h2>
                    <p className={styles.sectionSubtitle}>
                      Calibrates joint angles, counter-balance adjustments, and restorative bolster
                      density.
                    </p>
                  </div>

                  <span className={styles.privacyBadge}>Encrypted • Strictly Private</span>
                </div>

                {/* Dual Column Metrics Form (Height & Weight) */}
                <div className={styles.metricsGrid}>
                  {/* Height Input & Toggle */}
                  <div className={styles.metricInputCard}>
                    <div className={styles.metricHeader}>
                      <label htmlFor="height-input" className={styles.metricLabel}>
                        <span className={`material-symbols-outlined ${styles.metricIcon}`}>
                          height
                        </span>
                        Height
                      </label>

                      {/* Unit Switcher */}
                      <div className={styles.unitToggle}>
                        <button
                          type="button"
                          className={`${styles.unitBtn} ${
                            heightUnit === 'cm' ? styles.activeUnit : ''
                          }`}
                          onClick={() => handleHeightUnitToggle('cm')}
                        >
                          cm
                        </button>
                        <button
                          type="button"
                          className={`${styles.unitBtn} ${
                            heightUnit === 'ft' ? styles.activeUnit : ''
                          }`}
                          onClick={() => handleHeightUnitToggle('ft')}
                        >
                          ft
                        </button>
                      </div>
                    </div>

                    <div className={styles.inputWrapper}>
                      <input
                        id="height-input"
                        type="number"
                        step={heightUnit === 'ft' ? '0.1' : '1'}
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className={styles.metricInput}
                        placeholder={heightUnit === 'cm' ? '168' : '5.5'}
                      />
                      <span className={styles.inputSuffix}>{heightUnit}</span>
                    </div>

                    <p className={styles.metricHint}>
                      <span className={`material-symbols-outlined ${styles.hintIcon}`}>info</span>
                      <span>{heightHint}</span>
                    </p>
                  </div>

                  {/* Weight Input & Toggle */}
                  <div className={styles.metricInputCard}>
                    <div className={styles.metricHeader}>
                      <label htmlFor="weight-input" className={styles.metricLabel}>
                        <span className={`material-symbols-outlined ${styles.metricIcon}`}>
                          scale
                        </span>
                        Weight
                      </label>

                      {/* Unit Switcher */}
                      <div className={styles.unitToggle}>
                        <button
                          type="button"
                          className={`${styles.unitBtn} ${
                            weightUnit === 'kg' ? styles.activeUnit : ''
                          }`}
                          onClick={() => handleWeightUnitToggle('kg')}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          className={`${styles.unitBtn} ${
                            weightUnit === 'lbs' ? styles.activeUnit : ''
                          }`}
                          onClick={() => handleWeightUnitToggle('lbs')}
                        >
                          lbs
                        </button>
                      </div>
                    </div>

                    <div className={styles.inputWrapper}>
                      <input
                        id="weight-input"
                        type="number"
                        step="1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className={styles.metricInput}
                        placeholder={weightUnit === 'kg' ? '58' : '128'}
                      />
                      <span className={styles.inputSuffix}>{weightUnit}</span>
                    </div>

                    <p className={styles.metricHint}>
                      <span className={`material-symbols-outlined ${styles.hintIcon}`}>info</span>
                      <span>{weightHint}</span>
                    </p>
                  </div>
                </div>

                {/* Age Range Segmented Selector */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Age Range
                    <span className={styles.fieldSubtext}>
                      (tailors spinal decompression speed)
                    </span>
                  </label>
                  <div className={styles.segmentedWrap}>
                    {AGE_RANGES.map((range) => (
                      <button
                        key={range}
                        type="button"
                        className={`${styles.segmentBtn} ${
                          ageRange === range ? styles.activeSegment : ''
                        }`}
                        onClick={() => setAgeRange(range)}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender Identification Pill Options */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Gender Identification
                    <span className={styles.fieldSubtext}>(assists in pelvic tilt alignment)</span>
                  </label>
                  <div className={styles.pillWrap}>
                    {GENDER_OPTIONS.map((opt) => {
                      const isSelected = gender.toLowerCase() === opt.toLowerCase();
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`${styles.pillBtn} ${isSelected ? styles.activePill : ''}`}
                          onClick={() => setGender(opt)}
                        >
                          {isSelected && (
                            <span className={`material-symbols-outlined ${styles.pillCheck}`}>
                              check
                            </span>
                          )}
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Teacher Guidance / Studio Alignment Card (Section D context) */}
              <div className={styles.teacherGuidanceCard}>
                <div className={styles.teacherAvatarBadge}>
                  <span className={`material-symbols-outlined ${styles.teacherIcon}`}>
                    self_improvement
                  </span>
                </div>
                <div className={styles.guidanceText}>
                  <div className={styles.guidanceSuper}>Lead Teacher Guidance</div>
                  <h3 className={styles.guidanceTitle}>
                    Personalized Practice Alignment with {assignedTeacher}
                  </h3>
                  <p className={styles.guidanceBody}>
                    Your bio-metric calibrations provide <strong>{assignedTeacher}</strong> with
                    the precise anatomical context needed during hands-on assists and personalized
                    home sequence recommendations. Straps, blocks, and bolster depths in Studio Loft
                    A will automatically reflect your reach and leverage envelope.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
