import React, { createContext, useContext, useState, useEffect } from 'react';

// Use empty initial array, data comes from Backend
const ParkingContext = createContext();

export const useParking = () => useContext(ParkingContext);
const API_URL = 'http://localhost:8000';

export const ParkingProvider = ({ children }) => {
  // Holds the array of parking slot objects retrieved from the database
  const [slots, setSlots] = useState([]);

  // Manages the UI theme (Light/Dark) preference, initializing from local storage if available
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cyberpark_theme') || 'dark';
  });

  // Asynchronously retrieves the latest slot data from the backend API
  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API_URL}/slots`);
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      console.error("Failed to load slots:", err);
    }
  };

  // Initializes data fetching on component mount and sets up a polling interval for real-time updates
  useEffect(() => {
    fetchSlots();
    
    // Periodically refreshes data every 30 seconds to ensure the UI stays synchronized with the server
    const interval = setInterval(fetchSlots, 30000); 
    return () => clearInterval(interval);
  }, []);

  // Synchronizes the current theme state with the document body attribute and local storage
  useEffect(() => {
    localStorage.setItem('cyberpark_theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Toggles the occupancy status of a specific slot via a POST request to the API
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

  // Toggles the maintenance lock status for a slot, preventing standard users from occupying it
  const setMaintenance = async (id) => {
    try {
       const res = await fetch(`${API_URL}/slots/${id}/maintenance`, { method: 'POST' });
       if (res.ok) {
         const updatedSlot = await res.json();
         setSlots(prev => prev.map(s => s.id === id ? updatedSlot : s));
       } else {
         // Captures and warns about server-side validation errors (e.g., locking an occupied slot)
         const errorText = await res.text();
         console.warn("Maintenance rejected:", errorText);
         alert("Action Failed: " + errorText);
       }
    } catch (err) {
      console.error("Error setting maintenance:", err);
    }
  };

  // Switches the global application theme between 'light' and 'dark' modes
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Performs a hard reset of the system, clearing all data on the server and reloading the client
  const resetSystem = async () => {
    if(window.confirm("RESET ALL DATA? This cannot be undone.")) {
       await fetch(`${API_URL}/api/reset`, { method: 'POST' });
       fetchSlots(); // Reload fresh data to reflect the reset state
    }
  };

  // Debugging utility to force-trigger an overstay alert for demonstration purposes by setting a past entry time
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
