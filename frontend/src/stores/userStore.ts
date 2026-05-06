import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/domain';

interface UserStore {
  // State
  currentUser: User | null;
  
  // Actions
  setUser: (user: User) => void;
  createGuestUser: (userName?: string) => User;
  clearUser: () => void;
}

// Generate a random guest ID
function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Generate a random guest name
function generateGuestName(): string {
  const adjectives = ['Happy', 'Lucky', 'Swift', 'Brave', 'Clever', 'Mighty', 'Wise', 'Cool'];
  const nouns = ['Player', 'Gamer', 'Hero', 'Champion', 'Master', 'Ace', 'Pro', 'Star'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      // Initial state
      currentUser: null,

      // Set user
      setUser: (user: User) => {
        set({ currentUser: user });
      },

      // Create a guest user
      createGuestUser: (userName?: string) => {
        const user: User = {
          userId: generateGuestId(),
          userName: userName || generateGuestName(),
          avatar: '👤',
          bio: 'Guest player',
        };
        set({ currentUser: user });
        return user;
      },

      // Clear user
      clearUser: () => {
        set({ currentUser: null });
      },
    }),
    {
      name: 'dobon-user-storage', // localStorage key
      partialize: (state) => ({ currentUser: state.currentUser }), // Only persist currentUser
    }
  )
);
