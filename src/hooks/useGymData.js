import { useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

export function useGymData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -- WORKOUT PLANS --
  const fetchAllPlans = useCallback(async () => {
    if (!user) return [];
    setLoading(true);
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) setError(error.message);
    setLoading(false);
    return data || [];
  }, [user]);

  const fetchActivePlan = useCallback(async () => {
    if (!user) return null;
    setLoading(true);
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*, workout_days(*, exercises(*))')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      setError(error.message);
    }
    setLoading(false);
    return data;
  }, [user]);

  const setActivePlanStatus = async (planId) => {
    if (!user) return;
    setLoading(true);
    
    // First, set all plans for this user to inactive
    await supabase
      .from('workout_plans')
      .update({ is_active: false })
      .eq('user_id', user.id);
      
    // Then set the chosen plan to active
    const { error } = await supabase
      .from('workout_plans')
      .update({ is_active: true })
      .eq('id', planId);
      
    if (error) setError(error.message);
    setLoading(false);
  };

  const createPlan = async (name) => {
    if (!user) return;
    setLoading(true);
    // If it's their first plan, we can make it active. Otherwise inactive.
    const plans = await fetchAllPlans();
    const isActive = plans.length === 0;

    const { data, error } = await supabase
      .from('workout_plans')
      .insert([{ user_id: user.id, name, is_active: isActive }])
      .select()
      .single();
    
    if (error) setError(error.message);
    setLoading(false);
    return data;
  };

  // -- WORKOUT DAYS (ROUTINES) --
  const addDayToPlan = async (planId, name, orderIndex = 0) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('workout_days')
      .insert([{ plan_id: planId, name, order_index: orderIndex }])
      .select()
      .single();
    
    if (error) setError(error.message);
    setLoading(false);
    return data;
  };

  const deleteDay = async (dayId) => {
    setLoading(true);
    const { error } = await supabase
      .from('workout_days')
      .delete()
      .eq('id', dayId);
    
    if (error) setError(error.message);
    setLoading(false);
  };

  // -- EXERCISES --
  const addExerciseToDay = async (dayId, name, targetSets, targetReps) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .insert([{ day_id: dayId, name, target_sets: targetSets, target_reps: targetReps }])
      .select()
      .single();
    
    if (error) setError(error.message);
    setLoading(false);
    return data;
  };

  const deleteExercise = async (exerciseId) => {
    setLoading(true);
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', exerciseId);
    
    if (error) setError(error.message);
    setLoading(false);
  };

  // -- ATTENDANCE --
  const fetchTodayAttendance = useCallback(async () => {
    if (!user) return null;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();
    
    if (error && error.code !== 'PGRST116') setError(error.message);
    return data;
  }, [user]);

  const markAttendance = async (dayId = null) => {
    if (!user) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert([{ user_id: user.id, date: today, day_id: dayId }])
      .select()
      .single();
    
    if (error) setError(error.message);
    setLoading(false);
    return data;
  };

  const deleteAttendance = async (attendanceId) => {
    setLoading(true);
    const { error } = await supabase
      .from('attendance_logs')
      .delete()
      .eq('id', attendanceId);
    
    if (error) setError(error.message);
    setLoading(false);
  };

  // -- SETS --
  const logSet = async (attendanceId, exerciseId, weight, reps) => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('workout_sets')
      .insert([{ user_id: user.id, attendance_id: attendanceId, exercise_id: exerciseId, weight, reps }])
      .select()
      .single();
    
    if (error) setError(error.message);
    setLoading(false);
    return data;
  };

  const deleteSet = async (setId) => {
    setLoading(true);
    const { error } = await supabase
      .from('workout_sets')
      .delete()
      .eq('id', setId);
    
    if (error) setError(error.message);
    setLoading(false);
  };

  const fetchPreviousSessionSetsForExercise = useCallback(async (exerciseName) => {
    if (!user) return [];
    
    const { data: lastSet } = await supabase
      .from('workout_sets')
      .select('attendance_id, exercises!inner(name)')
      .eq('user_id', user.id)
      .eq('exercises.name', exerciseName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (!lastSet) return [];
    
    const { data } = await supabase
      .from('workout_sets')
      .select('weight, reps, exercises!inner(name)')
      .eq('user_id', user.id)
      .eq('attendance_id', lastSet.attendance_id)
      .eq('exercises.name', exerciseName)
      .order('created_at', { ascending: true });
      
    return data || [];
  }, [user]);

  const fetchSetsForAttendance = useCallback(async (attendanceId) => {
    if (!attendanceId) return [];
    const { data, error } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('attendance_id', attendanceId);
    
    if (error) setError(error.message);
    return data || [];
  }, []);

  // -- REPORTS --
  const fetchRecentActivity = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*, workout_days(name), workout_sets(count)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10);
    
    if (error) setError(error.message);
    return data || [];
  }, [user]);

  const fetchAllAttendanceLogs = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('date')
      .eq('user_id', user.id);
    
    if (error) setError(error.message);
    return data || [];
  }, [user]);

  const fetchExerciseHistory = useCallback(async (exerciseName) => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('workout_sets')
      .select('weight, reps, created_at, attendance_logs!inner(date), exercises!inner(name)')
      .eq('user_id', user.id)
      .eq('exercises.name', exerciseName)
      .order('created_at', { ascending: true });
    
    if (error) setError(error.message);
    return data || [];
  }, [user]);

  const fetchHistoryLogs = useCallback(async (dateFilter, exerciseFilter) => {
    if (!user) return [];
    setLoading(true);

    let query = supabase
      .from('workout_sets')
      .select(`
        id, 
        weight, 
        reps, 
        created_at, 
        attendance_logs!inner(date), 
        exercises!inner(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dateFilter) {
      query = query.eq('attendance_logs.date', dateFilter);
    }
    if (exerciseFilter) {
      query = query.eq('exercises.name', exerciseFilter);
    }

    const { data, error } = await query;
    if (error) setError(error.message);
    
    setLoading(false);
    return data || [];
  }, [user]);

  return {
    loading,
    error,
    fetchAllPlans,
    fetchActivePlan,
    setActivePlanStatus,
    createPlan,
    addDayToPlan,
    deleteDay,
    addExerciseToDay,
    deleteExercise,
    fetchTodayAttendance,
    markAttendance,
    deleteAttendance,
    logSet,
    deleteSet,
    fetchPreviousSessionSetsForExercise,
    fetchSetsForAttendance,
    fetchRecentActivity,
    fetchAllAttendanceLogs,
    fetchExerciseHistory,
    fetchHistoryLogs
  };
}
