from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import models, schemas, database

# Initialize database tables if they do not exist
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Configure Cross-Origin Resource Sharing (CORS) to allow requests from the React frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency provider for database sessions
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -----------------------------------------------------------------------------
# Database Seeding Logic
# -----------------------------------------------------------------------------
# Populates the database with initial slot data if the table is empty.
# Generates 300 slots across 3 floors (L1, L2, L3) with a realistic layout.
def seed_slots(db: Session):
    if db.query(models.Slot).first():
        return # Database is already populated

    # Constants derived from the physical layout of the mall
    LEVELS = ['L1', 'L2', 'L3']
    AISLES_PER_LEVEL = 5
    SLOTS_PER_SIDE = 10
    
    slots_data = []
    
    for level in LEVELS:
        slot_count = 1
        for aisle_row in range(AISLES_PER_LEVEL):
            # Generate Left-side slots
            for s in range(SLOTS_PER_SIDE):
                slots_data.append(create_slot_dict(level, slot_count, aisle_row, s, 'LEFT'))
                slot_count += 1
            # Generate Right-side slots
            for s in range(SLOTS_PER_SIDE):
                 slots_data.append(create_slot_dict(level, slot_count, aisle_row, s, 'RIGHT'))
                 slot_count += 1

    db.add_all(slots_data)
    db.commit()

def create_slot_dict(level, num, aisle_row, slot_pos, side):
    id_str = f"{level}-{str(num).zfill(3)}"
    # Assign special types based on slot number pattern (EV every 15th, Handicapped every 20th)
    return models.Slot(
        id=id_str,
        floor=level,
        aisle_row=aisle_row,
        side=side,
        slot_pos=slot_pos,
        status='FREE',
        type='STANDARD' if num % 15 != 0 and num % 20 != 0 else ('EV' if num % 15 == 0 else 'HANDICAPPED'),
        is_locked=False,
        entry_time=None,
        is_overstay=False
    )

@app.on_event("startup")
def on_startup():
    db = database.SessionLocal()
    seed_slots(db)
    db.close()

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

@app.get("/slots", response_model=List[schemas.Slot])
def read_slots(db: Session = Depends(get_db)):
    # Calculate overstay status dynamically based on current server time
    import time
    now_ms = int(time.time() * 1000)
    
    slots = db.query(models.Slot).all()
    
    dirty = False
    for slot in slots:
        if slot.status == 'OCCUPIED' and slot.entry_time:
            duration = now_ms - slot.entry_time
            # Mark as overstay if occupied for more than 2 hours
            if duration > (2 * 3600 * 1000) and not slot.is_overstay:
                slot.is_overstay = True
                dirty = True
        elif slot.status == 'FREE' and slot.is_overstay:
            slot.is_overstay = False
            dirty = True
            
    if dirty:
        db.commit()
        
    return slots

@app.post("/slots/{slot_id}/toggle", response_model=schemas.Slot)
def toggle_slot_status(slot_id: str, db: Session = Depends(get_db)):
    slot = db.query(models.Slot).filter(models.Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    if slot.is_locked:
        return slot

    import time
    if slot.status == 'FREE':
        # Occupy the slot and record entry time
        slot.status = 'OCCUPIED'
        slot.entry_time = int(time.time() * 1000)
        slot.is_overstay = False
    else:
        # Free the slot and clear timestamps
        slot.status = 'FREE'
        slot.entry_time = None
        slot.is_overstay = False
    
    db.commit()
    db.refresh(slot)
    return slot

@app.post("/slots/{slot_id}/maintenance", response_model=schemas.Slot)
def set_maintenance(slot_id: str, db: Session = Depends(get_db)):
    slot = db.query(models.Slot).filter(models.Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    if not slot.is_locked and slot.status == 'OCCUPIED':
        raise HTTPException(status_code=400, detail="Cannot lock occupied slot")
    
    # Toggle maintenance lock status
    slot.is_locked = not slot.is_locked
    slot.status = 'RESERVED' if slot.is_locked else 'FREE'
    slot.entry_time = None
    slot.is_overstay = False
    
    db.commit()
    db.refresh(slot)
    return slot

@app.post("/api/reset")
def reset_system(db: Session = Depends(get_db)):
    # Emergancy Reset: Sets all slots to FREE and clears all locks/timers
    db.query(models.Slot).update({
        models.Slot.status: 'FREE',
        models.Slot.entry_time: None,
        models.Slot.is_overstay: False,
        models.Slot.is_locked: False
    })
    db.commit()
    return {"message": "System Reset"}

@app.post("/slots/{slot_id}/simulate-overstay", response_model=schemas.Slot)
def simulate_overstay(slot_id: str, db: Session = Depends(get_db)):
    slot = db.query(models.Slot).filter(models.Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    import time
    three_hours_ago = int((time.time() - 3 * 3600) * 1000)
    
    slot.status = 'OCCUPIED'
    slot.is_locked = False
    slot.entry_time = three_hours_ago
    slot.is_overstay = True
    
    db.commit()
    db.refresh(slot)
    return slot
