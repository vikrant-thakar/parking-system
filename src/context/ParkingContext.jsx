import React, { createContext, useContext, useState, useEffect } from 'react';

// Use empty initial array, data comes from Backend
const ParkingContext = createContext();

export const useParking = () => useContext(ParkingContext);
const API_URL = 'http://localhost:8000';

export const ParkingProvider = ({ children }) => {
  // --- STATE 1: SLOTS DATA (From API) ---
  const [slots, setSlots] = useState([]);

  // --- STATE 2: THEME (Persisted LocalStorage is fine for UI preference) ---
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cyberpark_theme') || 'dark';
  });

  // --- INITIAL LOAD ---
  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API_URL}/slots`);
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      console.error("Failed to load slots:", err);
    }
  };

  useEffect(() => {
    fetchSlots();
    
    // Optional: Poll every 30s to sync overstays
    const interval = setInterval(fetchSlots, 30000); 
    return () => clearInterval(interval);
  }, []);

  // --- THEME EFFECT ---
  useEffect(() => {
    localStorage.setItem('cyberpark_theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // --- ACTIONS ---

  const toggleStatus = async (id) => {
    try {
      const res = await fetch(`${API_URL}/slots/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        const updatedSlot = await res.json();
        setSlots(prev => prev.map(s => s.id === id ? updatedSlot : s));
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const setMaintenance = async (id) => {
    try {
       const res = await fetch(`${API_URL}/slots/${id}/maintenance`, { method: 'POST' });
       if (res.ok) {
         const updatedSlot = await res.json();
         setSlots(prev => prev.map(s => s.id === id ? updatedSlot : s));
       } else {
         // Handle logic failure (e.g., locking occupied slot)
         const errorText = await res.text();
         console.warn("Maintenance rejected:", errorText);
         // Optionally alert user here if the API returns 400
         alert("Action Failed: " + errorText);
       }
    } catch (err) {
      console.error("Error setting maintenance:", err);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const resetSystem = async () => {
    if(window.confirm("RESET ALL DATA? This cannot be undone.")) {
       await fetch(`${API_URL}/api/reset`, { method: 'POST' });
       fetchSlots(); // Reload fresh data
    }
  };

  // --- DEMO TOOL: Time Travel ---
  const simulateOverstay = async (id) => {
    try {
      const res = await fetch(`${API_URL}/slots/${id}/simulate-overstay`, { method: 'POST' });
      if (res.ok) {
        const updatedSlot = await res.json();
        setSlots(prev => prev.map(s => s.id === id ? updatedSlot : s));
      }
    } catch (err) {
      console.error("Error simulating overstay:", err);
    }
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
