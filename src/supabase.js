import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase project URL and anon key from the Supabase dashboard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Example usage for our planned schema:
 * 
 * export const fetchActiveWorkoutPlan = async (userId) => {
 *   const { data, error } = await supabase
 *     .from('workout_plans')
 *     .select('*')
 *     .eq('user_id', userId)
 *     .eq('is_active', true)
 *     .single();
 *   return { data, error };
 * };
 */
