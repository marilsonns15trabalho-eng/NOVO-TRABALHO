-- LIONESS FIT - Consolidated Supabase Schema

-- 1. Users Table (Profile Data)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  name TEXT,
  email TEXT,
  age INTEGER,
  weight DECIMAL,
  height DECIMAL,
  goal TEXT,
  level TEXT,
  fitness_level TEXT,
  gender TEXT,
  training_days INTEGER,
  target_calories INTEGER,
  target_protein INTEGER,
  target_carbs INTEGER,
  target_fat INTEGER,
  avatar_url TEXT,
  base_photo_url TEXT,
  base_weight DECIMAL,
  role TEXT DEFAULT 'user', -- 'user' or 'admin'
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'basic', 'pro', 'gym_member'
  is_active BOOLEAN DEFAULT true,
  latest_assessment_photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Exercises Table (Catalog & User Specific)
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users, -- Optional: NULL for global catalog, UUID for user-specific
  name TEXT NOT NULL,
  reps TEXT,
  sets INTEGER,
  difficulty TEXT,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. User Workouts (Exercise completion log)
CREATE TABLE IF NOT EXISTS user_workouts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  exercise_id INTEGER REFERENCES exercises(id) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Workout Sessions (Full session log)
CREATE TABLE IF NOT EXISTS workout_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Nutrition Logs
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  calories INTEGER NOT NULL,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Progress (Simple Weight Log)
CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  weight DECIMAL NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Chat Messages (AI Coach History)
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Avaliações (Detailed Body Assessments) - NEW
CREATE TABLE IF NOT EXISTS avaliacoes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  peso DECIMAL,
  altura DECIMAL,
  idade INTEGER,
  sexo TEXT,
  peito DECIMAL,
  cintura DECIMAL,
  quadril DECIMAL,
  braco DECIMAL,
  perna DECIMAL,
  gordura DECIMAL,
  observacoes TEXT,
  foto_url TEXT,
  data TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Profiles Table (Alternative/Legacy Profile Data) - REMOVED (Merged into users)

-- RLS (Row Level Security) Configuration
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

-- Admin Check Function
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin' OR email = 'marilsonns15@gmail.com')
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies
-- Users
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Exercises (Public Read for global, User Specific for private)
CREATE POLICY "Anyone can view global exercises" ON exercises FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert their own exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exercises" ON exercises FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can delete their own exercises" ON exercises FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- User Workouts
CREATE POLICY "Users can view their own workouts" ON user_workouts FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert their own workouts" ON user_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Workout Sessions
CREATE POLICY "Users can view their own sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert their own sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Nutrition Logs
CREATE POLICY "Users can view their own nutrition" ON nutrition_logs FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert their own nutrition" ON nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Progress
CREATE POLICY "Users can view their own progress" ON progress FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert their own progress" ON progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat Messages
CREATE POLICY "Users can view their own messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert their own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Avaliações
CREATE POLICY "Users can view their own assessments" ON avaliacoes FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert their own assessments" ON avaliacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assessments" ON avaliacoes FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can delete their own assessments" ON avaliacoes FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- Seed Initial Exercises
INSERT INTO exercises (name, reps, sets, difficulty, category) VALUES
('Agachamento com Barra', '12', 4, 'Difícil', 'Pernas'),
('Passada (Afundo)', '12', 3, 'Médio', 'Pernas'),
('Leg Press Sentado', '15', 3, 'Fácil', 'Pernas'),
('Box Jumps Explosivos', '8', 5, 'Difícil', 'Pernas'),
('Supino Reto', '10', 4, 'Médio', 'Peito'),
('Remada Curvada', '12', 4, 'Médio', 'Costas'),
('Desenvolvimento Militar', '10', 3, 'Médio', 'Ombros'),
('Prancha Abdominal', '60s', 3, 'Fácil', 'Core')
ON CONFLICT DO NOTHING;
