import React, { useState, useEffect, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import './ParkingMap.css';

const ParkingMap = ({ onNavigate, currentFloor }) => {
  const { slots } = useParking();
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [scale, setScale] = useState(1);

  // Dynamically calculates the optimal scale factor to fit the 1700x900 map layout within the current browser window, ensuring the interface remains fully visible without scrolling.
  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / 1700;
      // Subtracts the header height (100px) from the viewport height to calculate the safe vertical area for the map
      const availableHeight = window.innerHeight - 100; 
      const scaleY = availableHeight / 800; 
      const newScale = Math.min(scaleX, scaleY) * 0.98; 
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

  // Iterates through a list of slots and injects decorative "pillar" elements at specific indices (3rd and 7th positions) to simulate structural support beams in the parking garage.
  const renderWithPillars = (list) => {
    const items = [];
    list.forEach((s, i) => {
       items.push(
         <SlotUnit 
           key={s.id} 
           slot={s} 
           selected={selectedSlotId===s.id} 
           onClick={handleSlotClick}
         />
       );
       // Insert Pillar after index 2 (3rd item) and 6 (7th item)
       if (i === 2 || i === 6) {
         items.push(<div key={`pillar-${s.id}`} className="pillar"></div>);
       }
    });
    return items;
  };

  // Calculates a negative margin to offset the whitespace created by the CSS scale transform, preventing empty space at the bottom of the viewport.
  // The base reference height is 800px for the 100-slot layout.
  const marginBottom = -1 * (800 * (1 - scale));

  return (
    <div className="parking-interface">
      <div 
        className="scaler-container" 
        style={{ 
          transform: `scale(${scale})`,
          marginBottom: `${marginBottom}px`
        }}
      >
        {/* REMOVED: Floor Nav (Now in Navbar) */}

        <div className="mall-map-container">
          <div className="blueprint-grid">
            {/* LEFT ZONE */}
            <div className="zone-side left">
              <div className="zone-header">
                <Ramp type="ENTRY" />
              </div>
              <div className="zone-body">
                <div className="slot-column">
                  <div className="slot-group vertical">
                    {renderWithPillars(groupedSlots.left)}
                  </div>
                </div>
                <div className="lane-column">
                  {/* Empty for spacing */}
                </div>
              </div>
            </div>

            {/* CENTER ZONE */}
            <div className="zone-center">

               {groupedSlots.islands.map((island) => (
                 <div key={island.id} className="parking-island">
                    <div className="slot-group">
                      {renderWithPillars(island.left)}
                    </div>
                    <div className="island-road"></div>
                    <div className="slot-group">
                      {renderWithPillars(island.right)}
                    </div>
                 </div>
               ))}
            </div>

            {/* RIGHT ZONE */}
            <div className="zone-side right">
              <div className="zone-header">
                <Ramp type="EXIT" />
              </div>
              <div className="zone-body">
                <div className="lane-column">
                  {/* Empty for spacing */}
                </div>
                <div className="slot-column">
                  <div className="slot-group vertical">
                     {renderWithPillars(groupedSlots.right)}
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
