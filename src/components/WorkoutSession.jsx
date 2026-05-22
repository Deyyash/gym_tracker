import React, { useState, useEffect } from 'react';
import { useGymData } from '../hooks/useGymData';
import { Check, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function WorkoutSession() {
  const { fetchActivePlan, fetchTodayAttendance, logSet, deleteSet, fetchSetsForAttendance, fetchPreviousSessionSetsForExercise } = useGymData();
  const navigate = useNavigate();
  
  const [attendance, setAttendance] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loggedSets, setLoggedSets] = useState([]);
  const [lastLogs, setLastLogs] = useState({});

  // Form states per exercise: exercise_id -> { weight, reps }
  const [setInputs, setSetInputs] = useState({});
  const [isAdding, setIsAdding] = useState({});

  const todayIndex = new Date().getDay();

  useEffect(() => {
    loadData();
  }, [fetchActivePlan, fetchTodayAttendance]);

  const loadData = async () => {
    const att = await fetchTodayAttendance();
    setAttendance(att);
    
    if (att) {
      const plan = await fetchActivePlan();
      setActivePlan(plan);
      
      // Determine which routine the user selected today from the attendance record
      const day = plan?.workout_days?.find(d => d.id === att.day_id);
      setSelectedDay(day || null);

      const sets = await fetchSetsForAttendance(att.id);
      setLoggedSets(sets);
      
      if (day) {
        const initialInputs = {};
        const historicalLogs = {};
        
        await Promise.all(day.exercises?.map(async (ex) => {
          const previousSets = await fetchPreviousSessionSetsForExercise(ex.name);
          if (previousSets && previousSets.length > 0) {
            historicalLogs[ex.id] = previousSets;
            // Prepopulate with the first set from the previous session
            initialInputs[ex.id] = { weight: previousSets[0].weight, reps: previousSets[0].reps };
          } else {
            initialInputs[ex.id] = { weight: 20, reps: 10 };
          }
        }) || []);

        setLastLogs(historicalLogs);
        setSetInputs(initialInputs);
      }
    }
  };

  const handleStepper = (exerciseId, field, delta) => {
    setSetInputs(prev => {
      const current = prev[exerciseId] || { weight: 20, reps: 10 };
      let newVal = current[field] + delta;
      if (newVal < 0) newVal = 0;
      return { ...prev, [exerciseId]: { ...current, [field]: newVal } };
    });
  };

  const handleLogSet = async (exerciseId) => {
    const input = setInputs[exerciseId];
    if (!input || input.weight <= 0 || input.reps <= 0) return;

    await logSet(attendance.id, exerciseId, input.weight, input.reps);
    
    const sets = await fetchSetsForAttendance(attendance.id);
    setLoggedSets(sets);
  };

  const handleDeleteSet = async (setId) => {
    if (window.confirm("Delete this set?")) {
      await deleteSet(setId);
      const sets = await fetchSetsForAttendance(attendance.id);
      setLoggedSets(sets);
    }
  };

  if (!attendance) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2>No Active Session</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You need to mark attendance on the Home screen first.</p>
      </div>
    );
  }

  if (!selectedDay) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2>Rest Day</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You logged a rest day. Enjoy your recovery!</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '100px' }}> {/* Space for sticky bottom button */}
      
      <div className="flex justify-between items-center mb-6">
        <h2>{selectedDay.name}</h2>
      </div>

      {/* Calendar Attendance Header Strip */}
      <div className="flex justify-between items-center mb-6 px-2">
        {WEEKDAYS_SHORT.map((day, idx) => (
          <div key={idx} className="flex-col items-center gap-2">
            <span style={{ fontSize: '0.75rem', color: idx === todayIndex ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: idx === todayIndex ? 'bold' : 'normal' }}>
              {day}
            </span>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: idx === todayIndex ? 'var(--primary-color)' : 'transparent',
              border: idx === todayIndex ? 'none' : '1px solid var(--border-color)'
            }} />
          </div>
        ))}
      </div>

      {selectedDay.exercises?.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No exercises defined for today. Add some in the Plans tab!</p>
      ) : (
        selectedDay.exercises?.map(ex => {
          const exSets = loggedSets.filter(s => s.exercise_id === ex.id);
          const previousSetsArray = lastLogs[ex.id];
          
          return (
            <div key={ex.id} className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{ex.name}</h3>
              </div>
              
              {previousSetsArray && previousSetsArray.length > 0 && (
                <div className="mb-4" style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '8px', borderLeft: '2px solid var(--primary-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>PREVIOUS SESSION</span>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {previousSetsArray.map((ps, idx) => (
                      <span key={idx} style={{ fontSize: '0.85rem', color: 'var(--primary-color)', background: 'var(--surface-color)', padding: '2px 6px', borderRadius: '4px' }}>
                        {ps.weight}kg × {ps.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mb-2 px-2">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'center' }}>Weight (kg)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'center' }}>Reps</span>
              </div>

              {/* Logged Sets (Highlighted) */}
              <div className="flex-col gap-3 mb-4">
                {exSets.map((s, idx) => (
                  <div key={s.id} className="flex items-center" style={{ 
                    background: 'rgba(0, 229, 255, 0.1)', 
                    border: '1px solid var(--primary-color)',
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '12px' 
                  }}>
                    <div style={{ width: '24px', display: 'flex', alignItems: 'center' }}>
                      <Check size={16} color="var(--primary-color)" />
                    </div>
                    <div className="flex" style={{ flex: 1 }}>
                      <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{s.weight}</div>
                      <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{s.reps}</div>
                    </div>
                    <div style={{ width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleDeleteSet(s.id)} 
                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Stepper for Next Set */}
              {isAdding[ex.id] ? (
                <>
                  <div className="flex items-center" style={{ background: 'var(--surface-color-light)', padding: '0.5rem 0.75rem', borderRadius: '12px' }}>
                    <div style={{ width: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {exSets.length + 1}
                    </div>
                    
                    <div className="flex items-center" style={{ flex: 1, justifyContent: 'space-around' }}>
                      {/* Weight Stepper */}
                      <div className="flex items-center gap-2" style={{ background: 'var(--bg-color)', padding: '4px', borderRadius: '8px' }}>
                        <button className="btn-stepper" onClick={() => handleStepper(ex.id, 'weight', -2.5)}><Minus size={16} /></button>
                        <div style={{ width: '40px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {setInputs[ex.id]?.weight || 0}
                        </div>
                        <button className="btn-stepper" onClick={() => handleStepper(ex.id, 'weight', 2.5)}><Plus size={16} /></button>
                      </div>

                      {/* Reps Stepper */}
                      <div className="flex items-center gap-2" style={{ background: 'var(--bg-color)', padding: '4px', borderRadius: '8px' }}>
                        <button className="btn-stepper" onClick={() => handleStepper(ex.id, 'reps', -1)}><Minus size={16} /></button>
                        <div style={{ width: '40px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {setInputs[ex.id]?.reps || 0}
                        </div>
                        <button className="btn-stepper" onClick={() => handleStepper(ex.id, 'reps', 1)}><Plus size={16} /></button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '0.6rem', background: 'transparent', border: '1px solid var(--border-color)' }}
                      onClick={() => setIsAdding(prev => ({...prev, [ex.id]: false}))}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ flex: 2, padding: '0.6rem' }}
                      onClick={() => {
                        handleLogSet(ex.id);
                        setIsAdding(prev => ({...prev, [ex.id]: false}));
                      }}
                    >
                      Save Set {exSets.length + 1}
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  className="btn btn-secondary mt-4" 
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}
                  onClick={() => setIsAdding(prev => ({...prev, [ex.id]: true}))}
                >
                  <Plus size={16} style={{ marginRight: '4px' }} /> Add Set
                </button>
              )}
            </div>
          );
        })
      )}

      {/* Sticky Bottom Finish Button */}
      <div style={{
        position: 'fixed',
        bottom: '80px', // Just above the nav bar
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '400px',
        zIndex: 40
      }}>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1rem', boxShadow: '0 4px 20px rgba(0, 229, 255, 0.4)' }}
          onClick={() => navigate('/reports')}
        >
          Finish Workout
        </button>
      </div>
    </div>
  );
}
