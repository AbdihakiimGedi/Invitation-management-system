ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_end_date TIMESTAMP;

UPDATE events
SET event_end_date = event_date
WHERE event_end_date IS NULL;
