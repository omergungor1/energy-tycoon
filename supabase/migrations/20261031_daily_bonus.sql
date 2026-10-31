-- Migration: Add Daily Streak and Bonus Tracking to Companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS daily_streak INT NOT NULL DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS last_daily_bonus_date DATE DEFAULT NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS total_daily_bonuses_claimed INT NOT NULL DEFAULT 0;

