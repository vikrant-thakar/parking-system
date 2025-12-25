/**
 * CYBERPARK MALL DATA SOURCE
 * 
 * Scale: 300 Slots (100 per Level: L1, L2, L3).
 * Layout: 5 Aisles per Floor + 1 Main Central Road.
 * Grid Coordinates: 
 *   - Main Road is at Grid X = 0.
 *   - Aisles branch out Left (-X) and Right (+X).
 *   - Actually, let's keep valid positive indicies for easy CSS Grid.
 *   
 *   GRID CONCEPT (Aisles Horizontal):
 *   [ AISLE 1 (Slots 01-10) ] -- ROAD -- [ AISLE 2 (Slots 11-20) ]
 *   ... repeated 5 times vertically ...
 */

const LEVELS = ['L1', 'L2', 'L3'];
const AISLES_PER_LEVEL = 5;
const SLOTS_PER_AISLE_SIDE = 10; // 10 Left, 10 Right = 20 per 'Row' of Aisles? No, let's do 100 slots.
// 5 Aisle-Rows. Each Row has 20 slots (10 on Left Side of road, 10 on Right Side).
// Total 20 * 5 = 100 slots per floor.

const generateMallData = () => {
  const allSlots = [];

  LEVELS.forEach(level => {
    let slotCount = 1;
    
    for (let aisleRow = 0; aisleRow < AISLES_PER_LEVEL; aisleRow++) {
      // LEFT SIDE ( 10 Slots )
      for (let s = 0; s < SLOTS_PER_AISLE_SIDE; s++) {
        allSlots.push(createSlot(level, slotCount++, aisleRow, s, 'LEFT'));
      }
      
      // RIGHT SIDE ( 10 Slots )
      for (let s = 0; s < SLOTS_PER_AISLE_SIDE; s++) {
        allSlots.push(createSlot(level, slotCount++, aisleRow, s, 'RIGHT'));
      }
    }
  });

  return allSlots;
};

const createSlot = (level, num, aisleRow, slotPos, side) => {
  const idStr = `${level}-${String(num).padStart(3, '0')}`;
  
  // Random Status Logic
  const rand = Math.random();
  let status = 'FREE';
  if (rand > 0.4) status = 'OCCUPIED'; // Busy mall!
  if (rand > 0.9) status = 'RESERVED';

  // Random Type Logic
  let type = 'STANDARD';
  if (num % 15 === 0) type = 'EV';
  if (num % 20 === 0) type = 'HANDICAPPED';

  // Coordinates
  // Let's say Central Road is col index 10.
  // Left slots: 0-9. Right slots: 11-20.
  // Row is based on aisleRow * (SlotHeight + RoadGap).
  
  return {
    id: idStr,
    floor: level,
    aisleRow: aisleRow, // 0 to 4
    side: side, // 'LEFT' or 'RIGHT'
    slotPos: slotPos, // 0 to 9 (distance from road?)
    status: status,
    type: type,
    isAutoMode: false,
    sensorId: null
  };
};

export const parkingSlots = generateMallData();
