import React, { useState } from 'react';
import { ShieldAlert, Users, Compass } from 'lucide-react';

export default function RoleSelection({ onSelect }) {
  const [role, setRole] = useState('executive');
  const [sessionId, setSessionId] = useState('showroom-1');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sessionId.trim()) return;
    onSelect(role, sessionId.trim());
  };

  return (
    <div className="role-selection-wrapper">
      <div className="glass-card role-selection-card">
        <div className="brand" style={{ justifyContent: 'center', marginBottom: '24px' }}>
          <Compass className="brand-icon" size={36} />
          <div className="brand-title" style={{ textAlign: 'left' }}>
            <h1>Convrse Spaces</h1>
            <p>Sales Kiosk Dashboard</p>
          </div>
        </div>

        <h2 className="role-selection-title">Welcome to Spaces</h2>
        <p className="role-selection-subtitle">Select your device role to start the sales pitch.</p>

        <form onSubmit={handleSubmit}>
          <div className="role-options">
            <button
              type="button"
              className={`role-option-btn ${role === 'executive' ? 'selected' : ''}`}
              onClick={() => setRole('executive')}
            >
              <div className="role-option-icon">
                <ShieldAlert size={24} />
              </div>
              <div className="role-option-details">
                <h3>Sales Executive</h3>
                <p>Controls navigation, image/video playback, and triggers unit bookings.</p>
              </div>
            </button>

            <button
              type="button"
              className={`role-option-btn ${role === 'customer' ? 'selected' : ''}`}
              onClick={() => setRole('customer')}
            >
              <div className="role-option-icon">
                <Users size={24} />
              </div>
              <div className="role-option-details">
                <h3>Customer Display</h3>
                <p>Read-only display. Mirrors the executive's device in real-time.</p>
              </div>
            </button>
          </div>

          <div className="session-input-wrapper">
            <label htmlFor="sessionId">Session / Showroom ID</label>
            <input
              type="text"
              id="sessionId"
              className="session-input"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="e.g. showroom-1"
              required
            />
          </div>

          <button type="submit" className="start-btn">
            Connect & Launch Kiosk
          </button>
        </form>
      </div>
    </div>
  );
}
