import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useProgressStore } from '../store/useProgressStore';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const loadProgress = useProgressStore(s => s.loadProgress);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setIsLoading(false);
            // Load cloud progress (and merge any local guest progress) on sign-in
            if (user) {
                await loadProgress(user.uid);
            }
        });

        return () => unsubscribe();
    }, [loadProgress]);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Email sign-in error:', error);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            if (displayName && result.user) {
                await updateProfile(result.user, { displayName });
            }
        } catch (error) {
            console.error('Email sign-up error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Sign-out error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                signInWithGoogle,
                signInWithEmail,
                signUpWithEmail,
                signOut
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
