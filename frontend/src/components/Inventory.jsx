import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldAlert } from 'lucide-react';

export default function Inventory({
  role,
  selectedTower,
  onTowerChange,
  selectedUnitId,
  onUnitSelect,
  bookingModalOpen,
  onBookingModalOpenChange,
  onAddToast,
  apiHost
}) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Local booking form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${apiHost}/api/inventory`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch inventory');
        return res.json();
      })
      .then((data) => {
        setUnits(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiHost]);

  // Sync update listener
  useEffect(() => {
    const handleUpdate = (e) => {
      const updatedUnit = e.detail;
      setUnits((prevUnits) =>
        prevUnits.map((u) => (u._id === updatedUnit._id ? updatedUnit : u))
      );
    };

    const handleReset = (e) => {
      setUnits(e.detail);
    };

    window.addEventListener('socket-inventory-updated', handleUpdate);
    window.addEventListener('socket-inventory-reset', handleReset);
    return () => {
      window.removeEventListener('socket-inventory-updated', handleUpdate);
      window.removeEventListener('socket-inventory-reset', handleReset);
    };
  }, []);

  const handleTowerClick = (tower) => {
    if (role !== 'executive') return;
    onTowerChange(tower);
  };

  const handleUnitClick = (unit) => {
    if (role !== 'executive') return;
    if (unit.status === 'Booked') {
      onAddToast(`Unit ${unit.unitNumber} is already booked by ${unit.customerName}`, 'info');
      return;
    }
    onUnitSelect(unit._id);
    onBookingModalOpenChange(true);
  };

  const handleCloseModal = () => {
    if (role !== 'executive') return;
    onBookingModalOpenChange(false);
    onUnitSelect(null);
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (role !== 'executive') return;
    if (!customerName || !customerPhone) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiHost}/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: selectedUnitId,
          customerName,
          customerPhone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      onAddToast(`Unit successfully booked for ${customerName}!`, 'success');
      handleCloseModal();
    } catch (err) {
      onAddToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="state-container">
        <div className="spinner"></div>
        <p>Loading inventory board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-container">
        <p className="error-text">Error: {error}</p>
      </div>
    );
  }

  const towers = ['Tower A', 'Tower B', 'Tower C'];
  const filteredUnits = units.filter((u) => u.tower === selectedTower);
  const activeUnit = units.find((u) => u._id === selectedUnitId);

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="tower-selector">
          {towers.map((t) => (
            <button
              key={t}
              className={`tower-btn ${selectedTower === t ? 'active' : ''}`}
              onClick={() => handleTowerClick(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="legend">
          <div className="legend-item">
            <span className="status-dot available"></span>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <span className="status-dot booked"></span>
            <span>Booked</span>
          </div>
        </div>
      </div>

      <div className="unit-grid">
        {filteredUnits.map((unit) => (
          <div
            key={unit._id}
            className={`unit-card ${unit.status.toLowerCase()} ${
              selectedUnitId === unit._id ? 'selected' : ''
            }`}
            onClick={() => handleUnitClick(unit)}
          >
            <div className="unit-number">{unit.unitNumber}</div>
            <div className="unit-status">{unit.status}</div>
          </div>
        ))}
      </div>

      {bookingModalOpen && activeUnit && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="glass-card booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h3>Book Unit {activeUnit.unitNumber} ({activeUnit.tower})</h3>
              {role === 'executive' && (
                <button className="modal-close" style={{ position: 'static' }} onClick={handleCloseModal}>
                  <X size={18} />
                </button>
              )}
            </div>

            {role === 'executive' ? (
              <form onSubmit={handleBookSubmit} className="booking-form">
                <div className="form-group">
                  <label htmlFor="customerName">Customer Name</label>
                  <input
                    type="text"
                    id="customerName"
                    className="form-input"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="customerPhone">Phone Number</label>
                  <input
                    type="tel"
                    id="customerPhone"
                    className="form-input"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                        Booking...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Sales Executive is filling out the booking form...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
