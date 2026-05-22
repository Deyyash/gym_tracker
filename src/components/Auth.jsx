import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Dumbbell } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the confirmation link!');
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex-col items-center justify-center" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div className="flex flex-col items-center gap-2 mb-8">
          <div style={{ background: 'var(--surface-color-light)', padding: '1rem', borderRadius: '50%' }}>
            <Dumbbell size={40} color="var(--primary-color)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: 0 }}>Gym Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Sign in to continue</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 60, 60, 0.1)', border: '1px solid rgba(255, 60, 60, 0.3)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', color: '#ff6b6b', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ backgroundColor: 'rgba(60, 255, 100, 0.1)', border: '1px solid rgba(60, 255, 100, 0.3)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', color: '#51cf66', fontSize: '0.875rem' }}>
            {message}
          </div>
        )}

        <form>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input-field"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group mb-6" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input-field"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex-col gap-4">
            <button
              className="btn btn-primary"
              style={{ width: '100%', opacity: isLoading ? 0.7 : 1 }}
              onClick={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Sign In'}
            </button>
            <button
              className="btn btn-secondary mt-4"
              style={{ width: '100%', opacity: isLoading ? 0.7 : 1 }}
              onClick={handleSignUp}
              disabled={isLoading}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
