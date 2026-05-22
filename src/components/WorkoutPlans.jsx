import React, { useState, useEffect } from 'react';
import { useGymData } from '../hooks/useGymData';
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkoutPlans() {
  const { fetchActivePlan, addDayToPlan, deleteDay, addExerciseToDay, deleteExercise, loading } = useGymData();
  
  const [activePlan, setActivePlan] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDay, setNewRoutineDay] = useState('1'); // Default to Monday
  const [newExercise, setNewExercise] = useState({ name: '' });

  useEffect(() => {
    loadData();
  }, [fetchActivePlan]);

  const loadData = async () => {
    const plan = await fetchActivePlan();
    setActivePlan(plan);
  };

  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    if (!newRoutineName.trim() || !activePlan) return;
    await addDayToPlan(activePlan.id, newRoutineName, parseInt(newRoutineDay));
    setNewRoutineName('');
    loadData();
  };

  const handleDeleteRoutine = async (e, dayId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this routine and all its exercises?")) {
      await deleteDay(dayId);
      loadData();
    }
  };

  const handleAddExercise = async (e, dayId) => {
    e.preventDefault();
    if (!newExercise.name.trim()) return;
    await addExerciseToDay(dayId, newExercise.name, 0, 0);
    setNewExercise({ name: '' });
    loadData();
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (window.confirm("Delete this exercise?")) {
      await deleteExercise(exerciseId);
      loadData();
    }
  };

  if (loading && !activePlan) return <div>Loading...</div>;

  if (!activePlan) {
    return (
      <div>
        <h2>Your Routines</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You don't have an active plan yet. Go to the <Link to="/" style={{ color: 'var(--primary-color)' }}>Home screen</Link> to select or create one!</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <h2 style={{ color: 'var(--primary-color)' }}>{activePlan.name}</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Create routines and assign exercises.</p>

      {/* Routine Creation */}
      <form onSubmit={handleCreateRoutine} className="mt-4" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="input-field" 
          style={{ flex: 2, minWidth: '150px', marginBottom: 0 }}
          value={newRoutineName}
          onChange={(e) => setNewRoutineName(e.target.value)}
          placeholder="New Routine (e.g. Leg Day)"
          required
        />
        <select 
          className="input-field" 
          style={{ flex: 1, minWidth: '120px', WebkitAppearance: 'none', marginBottom: 0, background: 'var(--bg-color)' }}
          value={newRoutineDay}
          onChange={(e) => setNewRoutineDay(e.target.value)}
        >
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
          <option value="0">Sunday</option>
        </select>
        <button className="btn btn-secondary" disabled={loading} style={{ width: '100%' }}>
          Add Routine
        </button>
      </form>

      {/* Routine List */}
      <div className="mt-6 flex-col gap-4">
        {activePlan.workout_days?.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No routines created yet.</p>
        ) : (
          activePlan.workout_days?.map((day) => (
            <div key={day.id} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: '3px solid var(--primary-color)' }}>
              
              {/* Routine Header */}
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {day.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({DAYS[day.order_index]})</span>
                </h3>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{day.exercises?.length || 0} Exercises</span>
                  <button onClick={(e) => handleDeleteRoutine(e, day.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                  {expandedDay === day.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              
              {/* Routine Exercises (Expanded) */}
              {expandedDay === day.id && (
                <div className="mt-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  {day.exercises?.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {day.exercises.map(ex => (
                        <li key={ex.id} style={{ padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontWeight: '500' }}>{ex.name}</span>
                          <div className="flex items-center gap-4">
                            <button onClick={() => handleDeleteExercise(ex.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>No exercises added to this routine yet.</p>
                  )}

                  <form onSubmit={(e) => handleAddExercise(e, day.id)} className="mt-4 p-3" style={{ background: 'var(--surface-color-light)', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--primary-color)' }}>Add Exercise</h4>
                    <div className="input-group">
                      <input type="text" className="input-field" placeholder="Exercise Name" value={newExercise.name} onChange={e => setNewExercise({...newExercise, name: e.target.value})} required style={{ padding: '0.6rem' }} />
                    </div>
                    <button type="submit" className="btn btn-secondary mt-4" style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}>
                      <Plus size={16} style={{ marginRight: '4px' }} /> Add to Routine
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
