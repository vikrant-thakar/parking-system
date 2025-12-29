import React, { useMemo } from 'react';
import { useParking } from '../../context/ParkingContext';
import SlotTable from './SlotTable';
import './AdminView.css';

const AdminDashboard = () => {
  const { slots, toggleTheme, theme, resetSystem } = useParking();

  // Stats Logic
  const stats = useMemo(() => {
    const total = slots.length;
    const occupied = slots.filter(s => s.status === 'OCCUPIED').length;
    const reserved = slots.filter(s => s.status === 'RESERVED').length; // Maintenance
    const free = total - occupied - reserved;
    const overstay = slots.filter(s => s.isOverstay).length;
    
    return { total, occupied, reserved, free, overstay };
  }, [slots]);

  return (
    <div className="admin-container">
      {/* Sidebar Header */}
      <header className="admin-header">
        <div className="admin-brand">
          <h2>S<span style={{color: 'var(--primary-neon)'}}>PARK</span> ADMIN</h2>
           {/* Car Theme Toggle Component */}
           <button 
             onClick={toggleTheme} 
             className={`car-toggle ${theme}`}
             title={theme === 'dark' ? "Turn Lights OFF (Light Mode)" : "Turn Lights ON (Dark Mode)"}
           >
             <div className="car-container">
               <div className="car-cabin"></div>
               <div className="car-chassis"></div>
               <div className="car-wheel front"></div>
               <div className="car-wheel back"></div>
               <div className="headlight-side"></div>
               <div className="light-beam"></div>
             </div>
           </button>
        </div>
        
        <div className="admin-actions">
           <button onClick={() => window.location.search = ''} className="btn-ghost">
             &larr; Back to Map
           </button>

           <button onClick={resetSystem} className="btn-danger">
             Reset Data
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        
        {/* STATS ROW */}
        <div className="stats-grid">
           <div className="stat-card">
             <h3>Total Slots</h3>
             <div className="stat-value">{stats.total}</div>
           </div>
           <div className="stat-card success">
             <h3>Available</h3>
             <div className="stat-value">{stats.free}</div>
           </div>
           <div className="stat-card danger">
             <h3>Occupied</h3>
             <div className="stat-value">{stats.occupied}</div>
           </div>
           <div className="stat-card info">
             <h3>Maintenance</h3>
             <div className="stat-value">{stats.reserved}</div>
           </div>
           <div className={`stat-card warning ${stats.overstay > 0 ? 'pulse' : ''}`}>
             <h3>Alerts</h3>
             <div className="stat-value">{stats.overstay}</div>
             <div className="stat-meta">Over 2h Parking</div>
           </div>
        </div>

        {/* ALERTS SECTION (Conditional) */}
        {stats.overstay > 0 && (
          <div className="alert-banner">
             ⚠️ <strong>PAYMENT ALERT:</strong> {stats.overstay} vehicles have exceeded the 2-hour limit. Please check the table below.
          </div>
        )}

        {/* SLOT MANAGEMENT TABLE - Fill Remaining Space */}
        <SlotTable slots={slots} />

      </main>
    </div>
  );
};

export default AdminDashboard;
