'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProfile, initUserProfileIfNeeded, getUserProfile } from '@/lib/userProfile';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  userProfile: null,
  refreshProfile: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) { setUserProfile(null); return; }
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === 'octavioiridologo@gmail.com');

      if (currentUser) {
        try {
          const profile = await initUserProfileIfNeeded(currentUser.uid, currentUser.email || '');
          setUserProfile(profile);
        } catch (e) {
          console.error('Error loading user profile:', e);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    await firebaseSignOut(auth);
    setUserProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, userProfile, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
