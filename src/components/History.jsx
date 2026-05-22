import React, { useState, useEffect, useMemo } from 'react';
import { useGymData } from '../hooks/useGymData';
import { Search, Calendar, ChevronDown, ChevronUp, Clock } from 'lucide-react';

export default function History() {
  const { fetchHistoryLogs, fetchActivePlan } = useGymData();
  const [activePlan, setActivePlan] = useState(null);
  
  const [dateFilter, setDateFilter] = useState('');
  const [exerciseFilter, setExerciseFilter] = useState('');
  
  const [historyData, setHistoryData] = useState([]);
  const [expandedDates, setExpandedDates] = useState({});

  useEffect(() => {
    loadActivePlan();
  }, [fetchActivePlan]);

  useEffect(() => {
    loadHistory();
  }, [dateFilter, exerciseFilter, fetchHistoryLogs]);

  const loadActivePlan = async () => {
    const plan = await fetchActivePlan();
    setActivePlan(plan);
  };

  const loadHistory = async () => {
    const data = await fetchHistoryLogs(dateFilter, exerciseFilter);
    setHistoryData(data);
  };

  // Get unique exercise names from active plan
  const availableExercises = useMemo(() => {
    if (!activePlan || !activePlan.workout_days) return [];
    const names = new Set();
    activePlan.workout_days.forEach(day => {
      day.exercises?.forEach(ex => {
        names.add(ex.name);
      });
    });
    return Array.from(names).sort();
  }, [activePlan]);

  // Group history data by date
  const groupedByDate = useMemo(() => {
    const groups = {};
    historyData.forEach(set => {
      const date = set.attendance_logs.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(set);
    });
    
    // Sort dates descending
    return Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).map(date => ({
      date,
      sets: groups[date]
    }));
  }, [historyData]);

  const toggleDate = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const clearFilters = () => {
    setDateFilter('');
    setExerciseFilter('');
  };

  return (
    <div style={{ paddingBottom: '100px' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>History</h1>
      </div>

      <div className="glass-panel mb-6" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Filters</h3>
        
        <div className="flex gap-4 flex-col">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={14} /> Date
            </label>
            <input 
              type="date" 
              className="input-field" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={14} /> Exercise Name
            </label>
            <select 
              className="input-field" 
              value={exerciseFilter}
              onChange={(e) => setExerciseFilter(e.target.value)}
              style={{ WebkitAppearance: 'none', background: 'var(--bg-color)' }}
            >
              <option value="">All Exercises</option>
              {availableExercises.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {(dateFilter || exerciseFilter) && (
          <button 
            className="btn btn-secondary mt-4" 
            onClick={clearFilters}
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="flex-col gap-4">
        {groupedByDate.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
            No workout history found for these filters.
          </p>
        ) : (
          groupedByDate.map(group => {
            const isExpanded = expandedDates[group.date];
            
            // Group the sets within this date by exercise name
            const setsByExercise = {};
            group.sets.forEach(set => {
              const exName = set.exercises.name;
              if (!setsByExercise[exName]) setsByExercise[exName] = [];
              setsByExercise[exName].push(set);
            });

            const uniqueExercisesCount = Object.keys(setsByExercise).length;

            return (
              <div key={group.date} className="glass-panel" style={{ padding: '0', overflow: 'hidden', marginBottom: '1rem' }}>
                {/* Header (Clickable) */}
                <div 
                  className="flex justify-between items-center cursor-pointer" 
                  onClick={() => toggleDate(group.date)}
                  style={{ padding: '1.25rem', background: isExpanded ? 'rgba(0, 229, 255, 0.05)' : 'transparent' }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {new Date(group.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {uniqueExercisesCount} {uniqueExercisesCount === 1 ? 'Exercise' : 'Exercises'} • {group.sets.length} {group.sets.length === 1 ? 'Set' : 'Sets'}
                    </div>
                  </div>
                  <div>
                    {isExpanded ? <ChevronUp size={20} color="var(--primary-color)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {Object.keys(setsByExercise).map(exName => (
                      <div key={exName} style={{ marginTop: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--primary-color)' }}>{exName}</h4>
                        <div className="flex-col gap-2">
                          {setsByExercise[exName].map((set, idx) => (
                            <div key={set.id} className="flex justify-between items-center" style={{ 
                              background: 'var(--bg-color)', 
                              padding: '0.5rem 1rem', 
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)'
                            }}>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Set {idx + 1}</span>
                              <div className="flex gap-4">
                                <span style={{ fontWeight: '500' }}>{set.weight} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>kg</span></span>
                                <span style={{ fontWeight: '500' }}>{set.reps} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>reps</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
