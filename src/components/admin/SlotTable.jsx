import React, { useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';

const SlotTable = ({ slots }) => {
  const { toggleStatus, setMaintenance, simulateOverstay } = useParking();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Filtering Logic
  const filteredSlots = slots.filter(slot => {
     const matchesFilter = filter === 'ALL' || slot.status === filter || (filter === 'OVERSTAY' && slot.isOverstay);
     const matchesSearch = slot.id.toLowerCase().includes(search.toLowerCase());
     return matchesFilter && matchesSearch;
  });

  return (
    <div className="slot-table-container">
      {/* Table Actions */}
      <div className="table-controls">
        <div className="filters">
          <button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>All Slots</button>
          <button className={filter === 'FREE' ? 'active' : ''} onClick={() => setFilter('FREE')}>Free</button>
          <button className={filter === 'OCCUPIED' ? 'active' : ''} onClick={() => setFilter('OCCUPIED')}>Occupied</button>
          <button className={filter === 'RESERVED' ? 'active' : ''} onClick={() => setFilter('RESERVED')}>Locked</button>
          <button className={`danger ${filter === 'OVERSTAY' ? 'active' : ''}`} onClick={() => setFilter('OVERSTAY')}>Alerts</button>
        </div>
        <input 
          type="text" 
          placeholder="Search Slot ID..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Table Data */}
      <div className="table-wrapper">
         <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Slot ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.map(slot => (
                  <SlotRow 
                     key={slot.id} 
                     slot={slot} 
                     onToggle={() => toggleStatus(slot.id)}
                     onLock={() => setMaintenance(slot.id)}
                     onSimulate={() => simulateOverstay(slot.id)}
                  />
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

const SlotRow = ({ slot, onToggle, onLock, onSimulate }) => {
  // Live Timer Logic
  const [duration, setDuration] = useState('00:00:00');

  useEffect(() => {
    let interval;
    if (slot.status === 'OCCUPIED' && slot.entryTime) {
      const updateTimer = () => {
        const diff = Date.now() - slot.entryTime;
        const totalSecs = Math.floor(diff / 1000);
        const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSecs % 60).toString().padStart(2, '0');
        setDuration(`${h}:${m}:${s}`);
      };
      
      updateTimer(); // Initial Call
      interval = setInterval(updateTimer, 1000);
    } else {
      setDuration('--:--:--');
    }
    return () => clearInterval(interval);
  }, [slot.status, slot.entryTime]);

  return (
    <tr className={slot.isOverstay ? 'row-overstay' : ''}>
      <td className="font-mono">{slot.id}</td>
      <td>
        <span className={`badge-type ${slot.type.toLowerCase()}`}>{slot.type}</span>
      </td>
      <td>
        <span className={`badge-status ${slot.status.toLowerCase()} ${slot.isOverstay ? 'alert' : ''}`}>
          {slot.isOverstay ? 'OVERSTAY' : slot.status}
        </span>
      </td>
      <td className="text-muted">Manual (Admin)</td>
      <td className="font-mono">{duration}</td>
      <td className="actions-cell">
        <button 
           className="btn-action" 
           onClick={onToggle}
           disabled={slot.status === 'RESERVED'}
        >
          {slot.status === 'FREE' ? 'Occupy' : 'Free'}
        </button>
        <button 
           className={`btn-lock ${slot.status === 'RESERVED' ? 'active' : ''}`} 
           onClick={onLock}
           disabled={slot.status === 'OCCUPIED'}
           title={slot.status === 'OCCUPIED' ? 'Cannot Lock Occupied Slot' : ''}
        >
          {slot.status === 'RESERVED' ? 'Unlock' : 'Lock'}
        </button>
        {/* DEMO TOOL: Time Travel */}
        {(slot.status === 'OCCUPIED' || slot.status === 'FREE') && (
           <button 
              className="btn-demo"
              title="Simulate Overstay > 2h"
              onClick={onSimulate}
           >
             ⏱️
           </button>
        )}
      </td>
    </tr>
  );
};

export default SlotTable;
