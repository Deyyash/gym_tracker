import React, { useState, useEffect, useMemo } from 'react';
import { useGymData } from '../hooks/useGymData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Reports() {
  const { fetchRecentActivity, fetchExerciseHistory } = useGymData();
  
  const [activity, setActivity] = useState([]);
  const [history, setHistory] = useState([]);
  const [exerciseName, setExerciseName] = useState('Barbell Squat');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [exerciseName]);

  const loadData = async () => {
    const act = await fetchRecentActivity();
    setActivity(act);
  };

  const loadChartData = async () => {
    const hist = await fetchExerciseHistory(exerciseName);
    setHistory(hist);
  };

  // Transform history data for the chart to calculate Estimated 1RM (Epley formula)
  const chartData = useMemo(() => {
    const grouped = {};
    history.forEach(row => {
      const date = row.attendance_logs?.date;
      if (!date) return;
      if (!grouped[date]) {
        grouped[date] = { date, estimated1RM: 0 };
      }
      const current1RM = row.weight * (1 + (row.reps / 30));
      grouped[date].estimated1RM = Math.max(grouped[date].estimated1RM, Math.round(current1RM));
    });
    
    // Fallback data if none exists so chart isn't empty in demo
    if (Object.keys(grouped).length === 0) {
      return [
        { date: 'Jan 01', estimated1RM: 100 },
        { date: 'Jan 06', estimated1RM: 120 },
        { date: 'Jan 12', estimated1RM: 230 },
        { date: 'Jan 18', estimated1RM: 180 },
        { date: 'Jan 22', estimated1RM: 350 },
        { date: 'Jan 28', estimated1RM: 200 },
        { date: 'Jan 30', estimated1RM: 384 },
      ]
    }
    
    return Object.values(grouped).sort((a,b) => new Date(a.date) - new Date(b.date));
  }, [history]);

  // Generate a 28-day visual calendar grid
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    // Offset to start on a Sunday (0)
    const currentDayOfWeek = today.getDay();
    const daysToLookBack = 28 + currentDayOfWeek - 1; // Show exactly 4 rows
    
    for (let i = daysToLookBack; i >= - (6 - currentDayOfWeek); i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isFuture = d > today;
      const attended = activity.some(a => a.date === dateStr);
      
      days.push({ 
        dateStr, 
        dayNum: d.getDate(),
        attended,
        isFuture
      });
    }
    return days.slice(-28); // Keep exactly 4 weeks
  }, [activity]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>Progress Report</h2>
      </div>

      {/* Progress Chart (1RM Volume) */}
      <div className="glass-panel" style={{ padding: '1.5rem', paddingBottom: '0.5rem' }}>
        <div className="flex justify-between items-center">
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Workout Volume</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Trailing 30 days</span>
        </div>
        
        <div style={{ width: '100%', height: 250, marginTop: '2rem', marginLeft: '-20px' }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--border-color)" tick={{fill: 'var(--text-secondary)', fontSize: 10}} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--border-color)" tick={{fill: 'var(--text-secondary)', fontSize: 10}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--primary-color)' }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                formatter={(value) => [`${value}`, 'Volume']}
              />
              <Area type="monotone" dataKey="estimated1RM" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#color1RM)" activeDot={{ r: 6, fill: '#fff', stroke: 'var(--primary-color)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel mt-4" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Calendar</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          {WEEKDAYS_SHORT.map((day, idx) => (
            <span key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{day}</span>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
          {calendarDays.map((day, idx) => (
            <div key={idx} style={{ 
              height: '36px',
              borderRadius: '8px', 
              background: day.attended ? 'var(--text-secondary)' : 'var(--surface-color-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              color: day.attended ? 'var(--bg-color)' : (day.isFuture ? 'rgba(255,255,255,0.2)' : 'var(--text-primary)'),
              fontWeight: day.attended ? 'bold' : 'normal'
            }}>
              {day.dayNum}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
