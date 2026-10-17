'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  signInWithGoogle,
  logoutFirebase,
  isConfiguredFirebase,
} from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { api } from '../lib/api';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'teacher' | 'student';
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isFirebaseLive: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => { },
  logout: async () => { },
  isFirebaseLive: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(false);

  useEffect(() => {
    setIsFirebaseLive(!!isConfiguredFirebase());

    if (isConfiguredFirebase()) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          let currentProfile: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Practitioner',
            photoURL: fbUser.photoURL || '',
            role: 'student', // Default is student unless registered as teacher in database
          };

          try {
            const token = await fbUser.getIdToken();
            const me = await api.getMe(token, fbUser.uid);
            if (me) {
              currentProfile = {
                uid: me.uid || fbUser.uid,
                email: me.email || fbUser.email || '',
                displayName: me.displayName || fbUser.displayName || 'Practitioner',
                photoURL: me.photoURL || fbUser.photoURL || '',
                role: me.role === 'teacher' ? 'teacher' : 'student',
              };
            }
          } catch {
            // Keep student profile if backend query fails
          }

          setUser(currentProfile);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithGoogleHandler = async () => {
    try {
      const cred = await signInWithGoogle();

      let currentProfile: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Practitioner',
        photoURL: cred.user.photoURL || '',
        role: 'student',
      };

      try {
        const token = await cred.user.getIdToken();
        const me = await api.getMe(token, cred.user.uid);
        if (me) {
          currentProfile = {
            uid: me.uid || cred.user.uid,
            email: me.email || cred.user.email || '',
            displayName: me.displayName || cred.user.displayName || 'Practitioner',
            photoURL: me.photoURL || cred.user.photoURL || '',
            role: me.role === 'teacher' ? 'teacher' : 'student',
          };
        }
      } catch {
        // Keep profile
      }

      setUser(currentProfile);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const logoutHandler = async () => {
    if (isConfiguredFirebase()) {
      await logoutFirebase();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle: loginWithGoogleHandler,
        logout: logoutHandler,
        isFirebaseLive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

