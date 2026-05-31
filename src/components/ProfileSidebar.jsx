import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Camera, Mail, Trash2, LogOut, Settings } from 'lucide-react';

export default function ProfileSidebar({ isOpen, onClose }) {
  const { user, updateProfile, updateEmail, uploadAvatar, deleteAccount, signOut } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [displayName, setDisplayName] = useState(user?.user_metadata?.displayName || '');
  const [contactNo, setContactNo] = useState(user?.user_metadata?.contactNo || '');
  const [bodyweight, setBodyweight] = useState(user?.user_metadata?.bodyweight || '');
  const [goal, setGoal] = useState(user?.user_metadata?.goal || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccess('');
    } else {
      setSuccess(msg);
      setError('');
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        displayName,
        contactNo,
        bodyweight,
        goal
      });
      showMessage('Profile updated successfully!');
    } catch (err) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (email === user?.email) return;
    setLoading(true);
    try {
      await updateEmail(email);
      showMessage('Verification links sent to both your old and new email addresses. Please verify to complete the change.');
    } catch (err) {
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      await uploadAvatar(file);
      showMessage('Profile photo updated!');
    } catch (err) {
      showMessage('Failed to upload photo. Ensure you ran the Supabase SQL setup!', true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you ABSOLUTELY sure you want to delete your account? This action cannot be undone and all your workout data will be permanently erased.");
    if (!confirmDelete) return;
    
    setLoading(true);
    try {
      await deleteAccount();
      // user is signed out automatically
    } catch (err) {
      showMessage('Failed to delete account. Ensure the delete_user SQL function exists.', true);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          zIndex: 100, transition: 'opacity 0.3s'
        }}
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div 
        className="glass-panel"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '380px',
          zIndex: 101, display: 'flex', flexDirection: 'column',
          borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none',
          overflowY: 'auto', padding: '1.5rem',
          transform: 'translateX(0)', transition: 'transform 0.3s ease'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ margin: 0 }}>Profile & Settings</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {error && <div style={{ background: 'rgba(255, 50, 50, 0.1)', color: '#ff5555', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--primary-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{success}</div>}

        {/* Avatar Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-color)',
              border: '2px solid var(--primary-color)', display: 'flex', justifyContent: 'center', alignItems: 'center',
              position: 'relative', cursor: 'pointer', overflow: 'hidden'
            }}
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'var(--text-secondary)', fontSize: '2rem' }}>{displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}</span>
            )}
            <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', padding: '4px', textAlign: 'center' }}>
              <Camera size={14} color="#fff" />
            </div>
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} style={{ display: 'none' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Tap to change photo</p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Display Name</label>
            <input type="text" className="input-field" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Yash" />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Contact Number</label>
            <input type="tel" className="input-field" value={contactNo} onChange={e => setContactNo(e.target.value)} placeholder="e.g. +1 234 567 8900" />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="input-label">Bodyweight</label>
              <input type="number" className="input-field" value={bodyweight} onChange={e => setBodyweight(e.target.value)} placeholder="kg/lbs" />
            </div>
            <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="input-label">Primary Goal</label>
              <select className="input-field" value={goal} onChange={e => setGoal(e.target.value)} style={{ WebkitAppearance: 'none' }}>
                <option value="">Select Goal</option>
                <option value="Hypertrophy">Hypertrophy</option>
                <option value="Strength">Strength</option>
                <option value="Endurance">Endurance</option>
                <option value="Weight Loss">Weight Loss</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>Save Profile</button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

        {/* Email Settings */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> Email Settings</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <input type="email" className="input-field" style={{ flex: 1, padding: '0.6rem 1rem' }} value={email} onChange={e => setEmail(e.target.value)} />
            <button onClick={handleUpdateEmail} className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }} disabled={loading || email === user?.email}>Update</button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

        {/* Danger Zone */}
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button 
            onClick={signOut} 
            className="btn btn-secondary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}
          >
            <LogOut size={18} /> Sign Out
          </button>
          <button 
            onClick={handleDeleteAccount} 
            className="btn" 
            style={{ width: '100%', background: 'rgba(255, 50, 50, 0.1)', color: '#ff5555', border: '1px solid rgba(255, 50, 50, 0.3)', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            disabled={loading}
          >
            <Trash2 size={18} /> Delete Account
          </button>
        </div>
      </div>
    </>
  );
}
