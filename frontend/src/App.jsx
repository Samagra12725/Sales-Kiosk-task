import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Compass, Image, Video, Layers, RefreshCw, LogOut } from 'lucide-react';
import RoleSelection from './components/RoleSelection';
import Gallery from './components/Gallery';
import Videos from './components/Videos';
import Inventory from './components/Inventory';

const API_HOST = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

export default function App() {
  const [role, setRole] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Synced States
  const [activeTab, setActiveTab] = useState('gallery');
  const [previewImageId, setPreviewImageId] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [selectedTower, setSelectedTower] = useState('Tower A');
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Video Action Sync State (direct playback control)
  const [videoAction, setVideoAction] = useState(null);

  // Local non-synced Toast messages
  const [toasts, setToasts] = useState([]);

  const socketRef = useRef(null);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Connect socket once session is selected
  useEffect(() => {
    if (!sessionId || !role) return;

    const socket = io(API_HOST);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('join-session', { sessionId, role });
      addToast(`Connected to session: ${sessionId}`, 'success');
    });

    // Listen to session state syncing (primarily for Customer display)
    socket.on('session-state-sync', (state) => {
      if (role === 'customer') {
        if (state.activeTab !== undefined) setActiveTab(state.activeTab);
        if (state.previewImageId !== undefined) setPreviewImageId(state.previewImageId);
        if (state.activeVideoId !== undefined) setActiveVideoId(state.activeVideoId);
        if (state.selectedTower !== undefined) setSelectedTower(state.selectedTower);
        if (state.selectedUnitId !== undefined) setSelectedUnitId(state.selectedUnitId);
        if (state.bookingModalOpen !== undefined) setBookingModalOpen(state.bookingModalOpen);
      }
    });

    // Listen to video actions (play/pause/seek)
    socket.on('video-action', (data) => {
      if (role === 'customer') {
        setVideoAction(data);
      }
    });

    // Listen to live inventory updates
    socket.on('inventory-updated', (updatedUnit) => {
      // Dispatch a custom window event for the Inventory component to receive
      window.dispatchEvent(
        new CustomEvent('socket-inventory-updated', { detail: updatedUnit })
      );
      addToast(`Unit ${updatedUnit.unitNumber} (${updatedUnit.tower}) has been booked!`, 'info');
    });

    socket.on('inventory-reset', (updatedUnits) => {
      window.dispatchEvent(
        new CustomEvent('socket-inventory-reset', { detail: updatedUnits })
      );
      addToast('All unit bookings have been cleared.', 'info');
    });

    socket.on('disconnect', () => {
      addToast('Disconnected from server. Reconnecting...', 'error');
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, role]);

  // Sync actions helper (Executive only)
  const syncState = (updates) => {
    if (role !== 'executive' || !socketRef.current) return;
    socketRef.current.emit('update-session-state', {
      sessionId,
      updates
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    syncState({ activeTab: tab });
  };

  const handlePreviewChange = (imageId) => {
    setPreviewImageId(imageId);
    syncState({ previewImageId: imageId });
  };

  const handleVideoSelect = (videoId) => {
    setActiveVideoId(videoId);
    syncState({ activeVideoId: videoId });
  };

  const handleEmitVideoAction = (action, time = 0) => {
    if (role !== 'executive' || !socketRef.current) return;
    socketRef.current.emit('video-action', {
      sessionId,
      action,
      data: { action, time }
    });
  };

  const handleTowerChange = (tower) => {
    setSelectedTower(tower);
    syncState({ selectedTower: tower });
  };

  const handleUnitSelect = (unitId) => {
    setSelectedUnitId(unitId);
    syncState({ selectedUnitId: unitId });
  };

  const handleBookingModalOpenChange = (isOpen) => {
    setBookingModalOpen(isOpen);
    syncState({ bookingModalOpen: isOpen });
  };

  const handleResetInventory = async () => {
    if (role !== 'executive') return;
    if (!window.confirm('Are you sure you want to reset all bookings?')) return;

    try {
      const response = await fetch(`${API_HOST}/api/reset`, { method: 'POST' });
      if (response.ok) {
        addToast('Inventory reset successfully', 'success');
      } else {
        throw new Error('Reset failed');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDisconnectSession = () => {
    setRole(null);
    setSessionId(null);
  };

  if (!role || !sessionId) {
    return <RoleSelection onSelect={(r, s) => { setRole(r); setSessionId(s); }} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <Compass className="brand-icon" size={32} />
          <div className="brand-title">
            <h1>Convrse Spaces</h1>
            <p>Interactive Sales Kiosk</p>
          </div>
        </div>

        <div className="session-info glass">
          <div className={`role-badge ${role}`}>
            {role === 'executive' ? 'Executive Mode' : 'Customer Display'}
          </div>
          <span className="session-badge">ID: {sessionId}</span>
          <button className="control-btn" onClick={handleDisconnectSession} title="Leave Session">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => handleTabChange('gallery')}
          disabled={role === 'customer'}
        >
          <Image size={18} />
          Gallery
        </button>
        <button
          className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => handleTabChange('videos')}
          disabled={role === 'customer'}
        >
          <Video size={18} />
          Videos
        </button>
        <button
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => handleTabChange('inventory')}
          disabled={role === 'customer'}
        >
          <Layers size={18} />
          Inventory
        </button>
      </nav>

      {/* Main View Area */}
      <main className="content-area glass-card">
        {activeTab === 'gallery' && (
          <Gallery
            role={role}
            previewImageId={previewImageId}
            onPreviewChange={handlePreviewChange}
            apiHost={API_HOST}
          />
        )}

        {activeTab === 'videos' && (
          <Videos
            role={role}
            activeVideoId={activeVideoId}
            onVideoSelect={handleVideoSelect}
            videoAction={videoAction}
            onEmitVideoAction={handleEmitVideoAction}
            apiHost={API_HOST}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            role={role}
            selectedTower={selectedTower}
            onTowerChange={handleTowerChange}
            selectedUnitId={selectedUnitId}
            onUnitSelect={handleUnitSelect}
            bookingModalOpen={bookingModalOpen}
            onBookingModalOpenChange={handleBookingModalOpenChange}
            onAddToast={addToast}
            apiHost={API_HOST}
          />
        )}
      </main>

      {/* Executive Control Tools */}
      {role === 'executive' && (
        <div className="control-bar">
          <button className="control-btn reset-btn" onClick={handleResetInventory}>
            <RefreshCw size={14} />
            Reset All Bookings
          </button>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
