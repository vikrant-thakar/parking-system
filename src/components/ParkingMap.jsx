import React, { useState, useEffect, useMemo } from 'react';
import { useParking } from '../context/ParkingContext'; // CHANGED: Use Context
import './ParkingMap.css';

const ParkingMap = ({ onNavigate, currentFloor }) => { // CHANGED: Accept Prop
  const { slots } = useParking();
  // const [currentFloor, setCurrentFloor] = useState('L1'); // REMOVED: Managed by App.jsx
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [scale, setScale] = useState(1);

  // Scaler Logic: Fit 1700x800 into Window
  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / 1700;
      const scaleY = window.innerHeight / 800; // Fit to 800px height
      const newScale = Math.min(scaleX, scaleY) * 0.98; // MAXIMIZED (0.90 -> 0.98) 
      setScale(newScale);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const floorSlots = useMemo(() => 
    slots.filter(slot => slot.floor === currentFloor), 
  [currentFloor, slots]);

  const groupedSlots = useMemo(() => {
    const sorted = [...floorSlots].sort((a,b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));
    const left = sorted.slice(0, 10);
    const center = sorted.slice(10, 90);
    const right = sorted.slice(90, 100);

    const islands = [];
    for (let i = 0; i < 4; i++) {
      const slice = center.slice(i * 20, (i + 1) * 20);
      islands.push({ id: i, left: slice.slice(0, 10), right: slice.slice(10, 20) });
    }
    return { left, islands, right };
  }, [floorSlots]);

  useEffect(() => {
    const freeSlot = floorSlots.find(s => s.status === 'FREE');
    if (freeSlot) {
      handleSlotClick(freeSlot);
    }
  }, [currentFloor]); // Only auto-select on floor switch, not every status update

  const handleSlotClick = (slot) => {
    if (slot.status !== 'FREE') return;
    setSelectedSlotId(slot.id);
    if(onNavigate) onNavigate(`SELECTED ${slot.id}`);
  };

  return (
    <div className="parking-interface">
      <div className="scaler-container" style={{ transform: `scale(${scale})` }}>
        
        {/* REMOVED: Floor Nav (Now in Navbar) */}

        <div className="mall-map-container">
          <div className="blueprint-grid">
            {/* LEFT ZONE */}
            <div className="zone-side left">
              <div className="zone-header">
                {/* REMOVED ♿ Icon */}
                <Ramp type="ENTRY" />
              </div>
              <div className="zone-body">
                <div className="slot-column">
                  <div className="slot-group vertical">
                    {groupedSlots.left.map(s => <SlotUnit key={s.id} slot={s} selected={selectedSlotId===s.id} onClick={handleSlotClick}/>)}
                  </div>
                </div>
                <div className="lane-column">
                  {/* Empty for spacing */}
                </div>
              </div>
            </div>

            {/* CENTER ZONE */}
            <div className="zone-center">
               {/* REMOVED P Icon */}

               {groupedSlots.islands.map((island) => (
                 <div key={island.id} className="parking-island">
                    <div className="slot-group">
                      {island.left.map(s => <SlotUnit key={s.id} slot={s} selected={selectedSlotId===s.id} onClick={handleSlotClick}/>)}
                    </div>
                    <div className="island-road"></div>
                    <div className="slot-group">
                      {island.right.map(s => <SlotUnit key={s.id} slot={s} selected={selectedSlotId===s.id} onClick={handleSlotClick}/>)}
                    </div>
                 </div>
               ))}

               {/* REMOVED 🚻 Icon */}
            </div>

            {/* RIGHT ZONE */}
            <div className="zone-side right">
              <div className="zone-header">
                {/* REMOVED 👮 Icon */}
                <Ramp type="EXIT" />
              </div>
              <div className="zone-body">
                <div className="lane-column">
                  {/* Empty for spacing */}
                </div>
                <div className="slot-column">
                  <div className="slot-group vertical">
                     {groupedSlots.right.map(s => <SlotUnit key={s.id} slot={s} selected={selectedSlotId===s.id} onClick={handleSlotClick}/>)}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      
      </div>
    </div>
  );
};

const Ramp = ({ type }) => (
  <div className="ramp-box">
    <div className="ramp-text">{type}</div>
  </div>
);

const SlotUnit = ({ slot, selected, onClick }) => (
  <div 
    className={`slot-unit ${slot.status.toLowerCase()} ${slot.type.toLowerCase()} ${selected ? 'selected' : ''}`}
    onClick={() => onClick(slot)}
  >
    {slot.id.split('-')[1]}
  </div>
);

export default ParkingMap;
