'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Tag, Alert } from 'antd';
import { GoogleOutlined, ArrowLeftOutlined } from '@ant-design/icons';

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, isFirebaseLive } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
      router.push('/');
    } catch (e: any) {
      console.error('Google Sign-In Error:', e);
      const code = e?.code || '';
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your Vercel domain';

      if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          `Domain "${currentHost}" is not authorized. Please go to Firebase Console > Authentication > Settings > Authorized domains and add "${currentHost}".`
        );
      } else if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') {
        setErrorMessage(
          'Firebase API Key is missing or invalid. Please check your NEXT_PUBLIC_FIREBASE_* environment variables in your Vercel project settings.'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMessage(
          'Sign-in popup was closed before authentication finished. If this closed automatically, your domain is likely unauthorized in Firebase Console.'
        );
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('Sign-in popup was blocked by the browser. Please allow popups for this site.');
      } else if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
        setErrorMessage(
          'Google Sign-in is not enabled in Firebase Console. Go to Authentication > Sign-in method > Google and enable it.'
        );
      } else {
        setErrorMessage(e?.message || 'Failed to sign in with Google. Check browser console for details.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: '#FAF8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
      }}
    >
      <div className="ambient-glow-amber" style={{ top: 20, left: '50%', transform: 'translateX(-50%)' }} />

      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 24,
          backgroundColor: '#FFFFFF',
          border: '1px solid #EAE4D2',
          boxShadow: '0 8px 32px rgba(28, 24, 18, 0.08)',
          position: 'relative',
          zIndex: 10,
          padding: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
            <span className="material-symbols-outlined filled" style={{ fontSize: 32 }}>
              spa
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 28,
              color: '#111213',
              margin: '0 0 6px',
            }}
          >
            Sign in to Methsara Yoga
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: '#5C5E62' }}>
            Sacred curriculum repository & self-guided ritual companion
          </p>
        </div>

        {user ? (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#5C5E62' }}>
              Signed in as <strong style={{ color: '#111213' }}>{user.displayName}</strong> ({user.email})
            </p>
            <Button
              type="primary"
              size="large"
              onClick={() => router.push(user.role === 'teacher' ? '/admin/curriculum' : '/')}
              block
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: '#121314',
                color: '#FAF8F0',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Continue to {user.role === 'teacher' ? 'Teacher Portal' : 'Practice Home'}
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {errorMessage && (
              <Alert
                message="Authentication Error"
                description={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage(null)}
                style={{ borderRadius: 12, textAlign: 'left' }}
              />
            )}

            {!isFirebaseLive && !errorMessage && (
              <Alert
                message="Firebase Config Missing"
                description="Firebase environment variables are not detected. Make sure NEXT_PUBLIC_FIREBASE_* variables are set in your Vercel Project Settings."
                type="warning"
                showIcon
                style={{ borderRadius: 12, textAlign: 'left' }}
              />
            )}

            {/* Primary Google Login Button */}
            <Button
              type="primary"
              size="large"
              loading={isSigningIn}
              icon={<GoogleOutlined />}
              onClick={handleGoogleSignIn}
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: '#121314',
                color: '#FAF8F0',
                fontWeight: 700,
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(18, 19, 20, 0.2)',
              }}
            >
              {isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}
            </Button>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#5C5E62',
              textDecoration: 'none',
            }}
          >
            <ArrowLeftOutlined style={{ fontSize: 12 }} /> Back to Home Practice
          </Link>
        </div>
      </Card>
    </main>
  );
}
