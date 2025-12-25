import React, { createContext, useContext, useState, useEffect } from 'react';
import { parkingSlots as initialSlots } from '../parkingData';

const ParkingContext = createContext();

export const useParking = () => useContext(ParkingContext);

export const ParkingProvider = ({ children }) => {
  // --- STATE 1: SLOTS DATA (Persisted) ---
  const [slots, setSlots] = useState(() => {
    const saved = localStorage.getItem('cyberpark_slots');
    return saved ? JSON.parse(saved) : initialSlots.map(s => ({
      ...s,
      entryTime: null, // New Field: Timestamp
      isLocked: false, // New Field: Maintenance Lock
      isOverstay: false // New Field: Overstay Alert
    }));
  });

  // --- STATE 2: THEME (Persisted) ---
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cyberpark_theme') || 'dark';
  });

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    localStorage.setItem('cyberpark_slots', JSON.stringify(slots));
  }, [slots]);

  // --- THEME EFFECT ---
  useEffect(() => {
    localStorage.setItem('cyberpark_theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // --- SYSTEM TICKER (Overstay Check) ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSlots(prev => prev.map(slot => {
        if (slot.status === 'OCCUPIED' && slot.entryTime) {
          const durationMs = now - slot.entryTime;
          const hours = durationMs / (1000 * 60 * 60);
          // ALERT: If > 2 Hours
          if (hours > 2 && !slot.isOverstay) {
            return { ...slot, isOverstay: true };
          }
        }
        return slot;
      }));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---

  const toggleStatus = (id) => {
    setSlots(prev => prev.map(slot => {
      if (slot.id !== id) return slot;
      if (slot.isLocked) return slot; // Locked slots cannot be changed nicely

      if (slot.status === 'FREE') {
        // Occupation Logic
        return { 
          ...slot, 
          status: 'OCCUPIED', 
          entryTime: Date.now(),
          isOverstay: false 
        };
      } else {
        // Free Logic
        return { 
          ...slot, 
          status: 'FREE', 
          entryTime: null, 
          isOverstay: false 
        };
      }
    }));
  };

  const setMaintenance = (id) => {
    setSlots(prev => prev.map(slot => {
      if (slot.id !== id) return slot;
      
      // LOGIC UPDATE: Cannot Lock if Occupied
      if (!slot.isLocked && slot.status === 'OCCUPIED') {
         alert("Cannot Lock an Occupied Slot! Please free it first.");
         return slot;
      }

      const newLockedState = !slot.isLocked;
      return {
        ...slot,
        isLocked: newLockedState,
        status: newLockedState ? 'RESERVED' : 'FREE', // Blue Color mapping
        entryTime: null,
        isOverstay: false
      };
    }));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const resetSystem = () => {
    if(window.confirm("RESET ALL DATA? This cannot be undone.")) {
       localStorage.removeItem('cyberpark_slots');
       window.location.reload();
    }
  };

  // --- DEMO TOOL: Time Travel ---
  const simulateOverstay = (id) => {
    setSlots(prev => prev.map(slot => {
      if (slot.id !== id) return slot;
      
      // Force Entry Time to 3 hours ago
      const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
      
      return { 
        ...slot, 
        status: 'OCCUPIED', 
        isLocked: false,
        entryTime: threeHoursAgo,
        isOverstay: true // Instant trigger
      };
    }));
  };

  const value = {
    slots,
    theme,
    toggleTheme,
    toggleStatus,
    setMaintenance,
    resetSystem,
    simulateOverstay
  };

  return (
    <ParkingContext.Provider value={value}>
      {children}
    </ParkingContext.Provider>
  );
};
