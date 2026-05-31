import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGymData } from '../hooks/useGymData';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import ProfileSidebar from './ProfileSidebar';

export default function Dashboard() {
  const { signOut } = useAuth();
  const { fetchAllPlans, fetchActivePlan, setActivePlanStatus, createPlan, fetchTodayAttendance, markAttendance, deleteAttendance, loading } = useGymData();
  const navigate = useNavigate();
  
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [attendance, setAttendance] = useState(null);
  
  const [newPlanName, setNewPlanName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const todayIndex = new Date().getDay();

  useEffect(() => {
    loadData();
  }, [fetchActivePlan, fetchAllPlans, fetchTodayAttendance]);

  const loadData = async () => {
    const all = await fetchAllPlans();
    setPlans(all);
    const active = await fetchActivePlan();
    setActivePlan(active);
    const att = await fetchTodayAttendance();
    setAttendance(att);
    
    // Default selection to the assigned routine for today, or first available
    if (!att && active && active.workout_days?.length > 0) {
      const todayRoutine = active.workout_days.find(d => d.order_index === todayIndex);
      if (todayRoutine) {
        setSelectedRoutineId(todayRoutine.id);
      } else {
        setSelectedRoutineId(active.workout_days[0].id);
      }
    }
  };

  const handleCancelAttendance = async () => {
    if (window.confirm("Undo today's attendance to choose a different routine?")) {
      await deleteAttendance(attendance.id);
      setAttendance(null);
      loadData();
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    setIsCreating(true);
    await createPlan(newPlanName);
    setNewPlanName('');
    setIsCreating(false);
    loadData();
  };

  const handleSwitchPlan = async (e) => {
    const planId = e.target.value;
    if (!planId) return;
    await setActivePlanStatus(planId);
    loadData();
  };

  const handleMarkAttendance = async () => {
    const dayId = selectedRoutineId || null;
    const att = await markAttendance(dayId);
    if (att) setAttendance(att);
  };

  if (loading && !activePlan && !isCreating && plans.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div>
        <div className="flex justify-between items-center">
          <h1 style={{ color: 'var(--primary-color)', marginBottom: 0 }}>
            Gym Tracker
          </h1>
          <button onClick={() => setIsProfileOpen(true)} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }} aria-label="Profile">
            <User size={20} />
          </button>
        </div>

        {/* Plan Management Section */}
      <div className="glass-panel mt-6" style={{ padding: '1.5rem' }}>
        <h3>Your Plans</h3>
        {plans.length > 0 ? (
          <div className="input-group mt-2">
            <label className="input-label">Active Plan</label>
            <select 
              className="input-field" 
              value={activePlan?.id || ''} 
              onChange={handleSwitchPlan}
              style={{ WebkitAppearance: 'none', background: 'var(--bg-color)' }}
            >
              <option value="" disabled>Select a plan</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>You don't have any workout plans yet.</p>
        )}

        <form onSubmit={handleCreatePlan} className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input 
            type="text" 
            className="input-field" 
            style={{ width: '100%', marginBottom: 0 }}
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            placeholder="New Plan Name"
            required
          />
          <button className="btn btn-secondary" style={{ width: '100%' }} disabled={isCreating}>
            Add Plan
          </button>
        </form>
      </div>
      
      {/* Today's Routine Section */}
      {activePlan && (
        <div className="glass-panel mt-6" style={{ padding: '1.5rem' }}>
          <h3>Today's Workout</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Choose the routine you want to execute today.
          </p>

          {!attendance ? (
            <>
              {activePlan.workout_days?.length > 0 ? (
                <div className="input-group">
                  <select 
                    className="input-field" 
                    value={selectedRoutineId} 
                    onChange={(e) => setSelectedRoutineId(e.target.value)}
                    style={{ WebkitAppearance: 'none', background: 'var(--bg-color)' }}
                  >
                    {activePlan.workout_days.map(day => (
                      <option key={day.id} value={day.id}>{day.name} ({day.exercises?.length || 0} exercises)</option>
                    ))}
                    <option value="">Rest Day (Log Attendance Only)</option>
                  </select>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Your active plan has no routines set up. Go to the Plans tab to add some!
                </p>
              )}

              <button 
                onClick={handleMarkAttendance} 
                className="btn btn-secondary mt-2" 
                style={{ width: '100%' }}
              >
                Mark Attendance for Today
              </button>
            </>
          ) : (
            <>
              <div className="mt-2 p-3 mb-4" style={{ background: 'rgba(0, 229, 255, 0.1)', borderRadius: '12px', color: 'var(--primary-color)', textAlign: 'center', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                ✓ Attendance logged for today!
              </div>

              {attendance.day_id ? (
                <Link to="/session" className="btn btn-primary" style={{ width: '100%' }}>
                  Start Workout Session
                </Link>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>You selected a Rest Day for today. Enjoy your recovery!</p>
              )}

              <button 
                onClick={handleCancelAttendance}
                className="btn btn-secondary mt-4"
                style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
              >
                Change Routine / Undo
              </button>
            </>
          )}
        </div>
      )}
      </div>

      <ProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
