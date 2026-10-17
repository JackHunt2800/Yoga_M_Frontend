'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button, Drawer, Dropdown, MenuProps, Tag, Tooltip, message } from 'antd';
import {
  MenuOutlined,
  GoogleOutlined,
  UserOutlined,
  SwapOutlined,
  FireOutlined,
  AppstoreOutlined,
  ReadOutlined,
  HeartOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loginWithGoogle, logout, isFirebaseLive } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTeacher = user?.role === 'teacher';

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#111213' }}>{user?.displayName}</p>
          <p style={{ margin: 0, fontSize: 12, color: '#5C5E62' }}>{user?.email}</p>
          <Tag color={isTeacher ? 'gold' : 'green'} style={{ marginTop: 4 }}>
            {isTeacher ? 'Teacher Admin' : 'Student Practitioner'}
          </Tag>
        </div>
      ),
    },
    { type: 'divider' },
    ...(isTeacher
      ? [
        {
          key: 'portal-nav',
          icon: <SwapOutlined />,
          label: pathname.startsWith('/admin') ? 'View Student App' : 'Teacher Portal',
          onClick: () => router.push(pathname.startsWith('/admin') ? '/' : '/admin/curriculum'),
        },
      ]
      : []),
    {
      key: 'google-auth',
      icon: <GoogleOutlined />,
      label: user ? 'Re-authenticate with Google' : 'Sign in with Google',
      onClick: async () => {
        try {
          await loginWithGoogle();
          message.success('Successfully authenticated!');
        } catch (err: any) {
          if (err?.code === 'auth/unauthorized-domain') {
            message.error('Domain not authorized in Firebase Console Settings!');
          } else {
            message.error(err?.message || 'Google authentication failed.');
          }
        }
      },
    },
    { type: 'divider' },
    {
      key: 'logout',
      danger: true,
      label: 'Sign Out',
      onClick: () => logout(),
    },
  ];

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          zIndex: 1000,
          backgroundColor: 'rgba(250, 248, 240, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #EAE4D2',
          boxShadow: '0 1px 8px rgba(28, 24, 18, 0.05)',
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            height: '100%',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href={isTeacher ? '/admin/curriculum' : '/'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                color: '#111213',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#FDF3D0',
                  border: '1px solid #EAE4D2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#A8751E',
                }}
              >
                <span className="material-symbols-outlined filled" style={{ fontSize: 22 }}>
                  spa
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                Methsara Yoga
              </span>
            </Link>

            {/* Role indicator pill */}
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 9999,
                backgroundColor: isTeacher ? '#121314' : '#EDE7D7',
                color: isTeacher ? '#FAF8F0' : '#44474A',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {isTeacher ? 'Teacher Admin' : 'Student Mode'}
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              height: '100%',
            }}
            className="hidden-on-mobile"
          >
            {isTeacher ? (
              <>
                <Link
                  href="/admin/curriculum"
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: pathname.includes('/admin/curriculum') ? 600 : 500,
                    color: pathname.includes('/admin/curriculum') ? '#121314' : '#5C5E62',
                    borderBottom: pathname.includes('/admin/curriculum')
                      ? '2px solid #121314'
                      : '2px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    auto_stories
                  </span>
                  Curriculum & Content
                </Link>

                <Link
                  href="/admin/upload"
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: pathname.includes('/admin/upload') ? 600 : 500,
                    color: pathname.includes('/admin/upload') ? '#121314' : '#5C5E62',
                    borderBottom: pathname.includes('/admin/upload')
                      ? '2px solid #121314'
                      : '2px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    cloud_upload
                  </span>
                  Upload Content
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: pathname === '/' ? 600 : 500,
                    color: pathname === '/' ? '#121314' : '#5C5E62',
                    borderBottom: pathname === '/' ? '2px solid #121314' : '2px solid transparent',
                    textDecoration: 'none',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    self_improvement
                  </span>
                  Today&apos;s Practice
                </Link>

                <Link
                  href="/admin/curriculum"
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    color: '#5C5E62',
                    textDecoration: 'none',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    library_books
                  </span>
                  Practice Library
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Quick Portal Switcher Button (Teachers only) */}
            {user && isTeacher && (
              <Tooltip title={pathname.startsWith('/admin') ? 'View Student App' : 'Open Teacher Portal'}>
                <Button
                  type="default"
                  size="middle"
                  icon={<SwapOutlined />}
                  onClick={() => router.push(pathname.startsWith('/admin') ? '/' : '/admin/curriculum')}
                  style={{
                    backgroundColor: '#EDE7D7',
                    border: '1px solid #EAE4D2',
                    color: '#111213',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span className="hidden-on-mobile">
                    {pathname.startsWith('/admin') ? 'View Student App' : 'Teacher Admin'}
                  </span>
                </Button>
              </Tooltip>
            )}

            {/* User Profile / Google Sign-In */}
            {user ? (
              <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 9999,
                  }}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #EAE4D2',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        backgroundColor: '#121314',
                        color: '#FAF8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {user.displayName ? user.displayName.charAt(0) : <UserOutlined />}
                    </div>
                  )}
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }} className="hidden-on-mobile">
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111213' }}>
                      {user.displayName}
                    </div>
                    <div style={{ fontSize: 11, color: '#5C5E62' }}>
                      {isTeacher ? 'Lead Instructor' : 'Practitioner'}
                    </div>
                  </div>
                </button>
              </Dropdown>
            ) : (
              <Button
                type="primary"
                icon={<GoogleOutlined />}
                onClick={() => router.push('/login')}
                style={{
                  backgroundColor: '#121314',
                  borderRadius: 9999,
                  fontWeight: 600,
                  height: 38,
                  padding: '0 18px',
                }}
              >
                Sign In
              </Button>
            )}

            {/* Mobile Drawer Hamburger */}
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20 }} />}
              onClick={() => setMobileMenuOpen(true)}
              className="show-on-mobile"
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </header>

      {/* Mobile Responsive Navigation Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined text-amber filled">spa</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Methsara Yoga</span>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        styles={{ body: { backgroundColor: '#FAF8F0', padding: 20 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {user ? (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: '#F5F1E4',
                border: '1px solid #EAE4D2',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 15 }}>{user.displayName}</div>
              <div style={{ fontSize: 13, color: '#5C5E62' }}>{user.email}</div>
              <div style={{ marginTop: 10 }}>
                <Tag color={isTeacher ? 'gold' : 'green'}>
                  {isTeacher ? 'Teacher Admin' : 'Student Practitioner'}
                </Tag>
              </div>
            </div>
          ) : (
            <Button
              type="primary"
              icon={<GoogleOutlined />}
              onClick={() => {
                router.push('/login');
                setMobileMenuOpen(false);
              }}
              block
              style={{
                backgroundColor: '#121314',
                height: 44,
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Sign In with Google
            </Button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#5C5E62', textTransform: 'uppercase' }}>
              Navigation
            </span>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: pathname === '/' ? '#121314' : 'transparent',
                color: pathname === '/' ? '#FFFFFF' : '#111213',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined">self_improvement</span>
              Today&apos;s Practice
            </Link>

            {isTeacher && (
              <>
                <Link
                  href="/admin/curriculum"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: pathname.includes('/admin/curriculum') ? '#121314' : 'transparent',
                    color: pathname.includes('/admin/curriculum') ? '#FFFFFF' : '#111213',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span className="material-symbols-outlined">auto_stories</span>
                  Curriculum Library
                </Link>

                <Link
                  href="/admin/upload"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: pathname.includes('/admin/upload') ? '#121314' : 'transparent',
                    color: pathname.includes('/admin/upload') ? '#FFFFFF' : '#111213',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span className="material-symbols-outlined">cloud_upload</span>
                  Upload New Content
                </Link>
              </>
            )}
          </div>

          {user && (
            <div style={{ marginTop: 'auto', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isTeacher && (
                <Button
                  type="default"
                  icon={<SwapOutlined />}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (pathname.startsWith('/admin')) router.push('/');
                    else router.push('/admin/curriculum');
                  }}
                  block
                >
                  {pathname.startsWith('/admin') ? 'View Student App' : 'View Teacher Portal'}
                </Button>
              )}

              <Button
                danger
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                block
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </Drawer>

      <style jsx global>{`
        @media (max-width: 860px) {
          .hidden-on-mobile {
            display: none !important;
          }
          .show-on-mobile {
            display: inline-flex !important;
          }
        }
      `}</style>
    </>
  );
};
