"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, getCurrentUserId } from '@/lib/supabase';
import type { DisplayMode } from '@/types/database';

interface DisplayModeContextType {
  mode: DisplayMode;
  isEssentials: boolean;
  isFull: boolean;
  setMode: (mode: DisplayMode) => void;
  isLoading: boolean;
}

const DisplayModeContext = createContext<DisplayModeContextType | undefined>(undefined);

interface DisplayModeProviderProps {
  children: ReactNode;
}

export function DisplayModeProvider({ children }: DisplayModeProviderProps) {
  const [mode, setModeState] = useState<DisplayMode>('essentials');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's display mode on mount
  useEffect(() => {
    async function fetchDisplayMode() {
      try {
        const userId = await getCurrentUserId();
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('display_mode')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.log('[DisplayModeProvider] No profile found, using default');
          setModeState('essentials');
        } else {
          setModeState(data?.display_mode || 'essentials');
        }
      } catch (err) {
        console.error('[DisplayModeProvider] Error fetching display mode:', err);
        setModeState('essentials');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDisplayMode();
  }, []);

  // Update display mode in database
  const setMode = useCallback(async (newMode: DisplayMode) => {
    // Optimistic update
    setModeState(newMode);

    try {
      const userId = await getCurrentUserId();
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          display_mode: newMode,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('[DisplayModeProvider] Error saving display mode:', error);
      }
    } catch (err) {
      console.error('[DisplayModeProvider] Error saving display mode:', err);
    }
  }, []);

  const value: DisplayModeContextType = {
    mode,
    isEssentials: mode === 'essentials',
    isFull: mode === 'full',
    setMode,
    isLoading,
  };

  return (
    <DisplayModeContext.Provider value={value}>
      {children}
    </DisplayModeContext.Provider>
  );
}

/**
 * Hook to access display mode from context
 * Must be used within a DisplayModeProvider
 */
export function useDisplayMode(): DisplayModeContextType {
  const context = useContext(DisplayModeContext);
  
  if (context === undefined) {
    throw new Error('useDisplayMode must be used within a DisplayModeProvider');
  }
  
  return context;
}
