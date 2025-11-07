-- Create word_sets table for storing custom word sets
CREATE TABLE IF NOT EXISTS word_sets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  words JSONB NOT NULL,
  language VARCHAR(50),
  type VARCHAR(50),
  count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_word_sets_name ON word_sets(name);

-- Enable Row Level Security (RLS) - optional, for public access
ALTER TABLE word_sets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read/write access (for demo purposes)
-- In production, you might want more restrictive policies
CREATE POLICY "Allow public access" ON word_sets
  FOR ALL USING (true) WITH CHECK (true);
