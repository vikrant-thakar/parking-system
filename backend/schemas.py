from pydantic import BaseModel
from typing import Optional

class SlotBase(BaseModel):
    floor: str
    aisle_row: int
    side: str
    slot_pos: int
    status: str
    type: str
    is_locked: bool
    entry_time: Optional[int] = None
    is_overstay: bool

class SlotCreate(SlotBase):
    id: str

class Slot(SlotBase):
    id: str

    class Config:
        orm_mode = True
