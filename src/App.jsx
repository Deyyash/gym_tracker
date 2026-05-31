import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Dumbbell, Calendar, LayoutDashboard, BarChart, Clock } from 'lucide-react';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';

import Dashboard from './components/Dashboard';
import WorkoutPlans from './components/WorkoutPlans';
import WorkoutSession from './components/WorkoutSession';
import History from './components/History';
import Reports from './components/Reports';

function AppContent() {
  const { session } = useAuth();

  if (!session) {
    return <Auth />;
  }

  return (
    <Router>
      <div className="flex-col" style={{ minHeight: '100vh', display: 'flex', width: '100%' }}>
        {/* Main Content */}
        <main className="container" style={{ flex: 1, paddingBottom: '90px', paddingTop: '2rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plans" element={<WorkoutPlans />} />
            <Route path="/session" element={<WorkoutSession />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>

        {/* Mobile Tab Navigation */}
        <nav className="glass-panel" style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '95%',
          maxWidth: '500px',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '0.75rem',
          zIndex: 50
        }}>
          <Link to="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <LayoutDashboard size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Home</span>
          </Link>
          <Link to="/plans" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <Calendar size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Plans</span>
          </Link>
          <Link to="/session" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <Dumbbell size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Workout</span>
          </Link>
          <Link to="/history" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <Clock size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>History</span>
          </Link>
          <Link to="/reports" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <BarChart size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Reports</span>
          </Link>
        </nav>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
