/*
  # Video Conference Platform Schema

  1. New Tables
    - room_participants
      - id (uuid, primary key)
      - room_id (text, not null)
      - username (text, not null)
      - joined_at (timestamptz, not null)
    
    - chat_messages
      - id (uuid, primary key)
      - room_id (text, not null)
      - sender (text, not null)
      - message (text, not null)
      - timestamp (timestamptz, not null)
    
    - breakout_rooms
      - id (uuid, primary key)
      - main_room_id (text, not null)
      - name (text, not null)
      - created_by (text, not null)
      - created_at (timestamptz, not null)

  2. Security
    - Enable RLS on all tables
    - Add policies for room participants
    - Add policies for chat messages
    - Add policies for breakout rooms
*/

-- Create room_participants table
CREATE TABLE room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  username text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, username)
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  sender text NOT NULL,
  message text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Create breakout_rooms table
CREATE TABLE breakout_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_room_id text NOT NULL,
  name text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakout_rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for room_participants
CREATE POLICY "Anyone can view room participants"
  ON room_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can join a room"
  ON room_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Participants can leave rooms"
  ON room_participants
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for chat_messages
CREATE POLICY "Anyone can view chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can send messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for breakout_rooms
CREATE POLICY "Anyone can view breakout rooms"
  ON breakout_rooms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create breakout rooms"
  ON breakout_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX room_participants_room_id_idx ON room_participants(room_id);
CREATE INDEX chat_messages_room_id_idx ON chat_messages(room_id);
CREATE INDEX breakout_rooms_main_room_id_idx ON breakout_rooms(main_room_id);