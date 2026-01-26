from sqlalchemy import Boolean, Column, Integer, String, BigInteger
from database import Base

class Slot(Base):
    __tablename__ = "slots"

    id = Column(String, primary_key=True, index=True)
    floor = Column(String)
    aisle_row = Column(Integer)
    side = Column(String)
    slot_pos = Column(Integer)
    status = Column(String, default="FREE")   # Current state: 'FREE', 'OCCUPIED', or 'RESERVED'
    type = Column(String, default="STANDARD") # Slot classification: 'STANDARD', 'EV', or 'HANDICAPPED'
    is_locked = Column(Boolean, default=False)
    entry_time = Column(BigInteger, nullable=True) # Unix timestamp (milliseconds) of arrival
    is_overstay = Column(Boolean, default=False)
