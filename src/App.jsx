import React, { useState, useEffect } from 'react';
import ParkingMap from './components/ParkingMap';
import AdminDashboard from './components/admin/AdminDashboard'; 
import { ParkingProvider } from './context/ParkingContext';
import './App.css';

function AppContent() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [navStatus, setNavStatus] = useState(null);
  const [currentFloor, setCurrentFloor] = useState('L1');

  useEffect(() => {
    // Inspects the URL query parameters for the 'admin=true' flag to conditionally enable access to the administrative dashboard.
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdmin(true);
    }
  }, []);

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="app-container">
      {/* Heads-Up Display (HUD) Header containing branding, navigation, and system status */}
      <header className="hud-header">
        <div className="brand-container">
          <div className="brand-text">
            <h1>S<span style={{color: 'var(--primary-neon)'}}>PARK</span></h1>
            <p className="subtitle">INTELLIGENT PARKING SOLUTIONS</p>
          </div>
        </div>

        {/* Interactive Floor Navigation Controls (L1, L2, L3) */}
        <div className="floor-nav-header">
           {['L1', 'L2', 'L3'].map(floor => (
              <button 
                key={floor} 
                className={`floor-btn ${currentFloor === floor ? 'active' : ''}`}
                onClick={() => setCurrentFloor(floor)}
              >
                {floor}
              </button>
           ))}
        </div>
        
        {/* Dynamic Navigation Status Display (e.g., "SELECTED L1-001") */}
        <div className="nav-display" style={{flex: 1, textAlign: 'center'}}>
           {navStatus && (
             <div style={{
               color: 'var(--primary-neon)', 
               fontFamily: 'Orbitron', 
               fontSize: '1.5rem',
               textShadow: '0 0 10px var(--primary-neon)',
               border: '1px solid var(--primary-neon)',
               display: 'inline-block',
               padding: '5px 30px',
               borderRadius: '5px',
               background: 'rgba(0, 243, 255, 0.1)'
             }}>
               {navStatus}
             </div>
           )}
        </div>
        
        <div className="status-panel">
          <div className="status-item">
            <span className="label">SYSTEM</span>
            <span className="value online">ONLINE</span>
          </div>
          <div className="status-item">
            <span className="label">TIME</span>
            <span className="value">
              {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <ParkingMap 
          onNavigate={setNavStatus} 
          currentFloor={currentFloor}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <ParkingProvider>
      <AppContent />
    </ParkingProvider>
  );
}

export default App;
