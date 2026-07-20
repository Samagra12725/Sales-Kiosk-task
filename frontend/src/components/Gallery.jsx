import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';

export default function Gallery({
  role,
  previewImageId,
  onPreviewChange,
  apiHost
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${apiHost}/api/gallery`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch gallery');
        return res.json();
      })
      .then((data) => {
        setImages(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiHost]);

  const handleCardClick = (id) => {
    if (role !== 'executive') return; // customer is read-only
    onPreviewChange(id);
  };

  const handleClose = () => {
    if (role !== 'executive') return;
    onPreviewChange(null);
  };

  if (loading) {
    return (
      <div className="state-container">
        <div className="spinner"></div>
        <p>Loading project gallery...</p>
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

  const activePreviewImage = images.find((img) => img._id === previewImageId);

  return (
    <div>
      <div className="gallery-grid">
        {images.map((image) => (
          <div
            key={image._id}
            className="gallery-card"
            onClick={() => handleCardClick(image._id)}
          >
            <img src={image.url} alt={image.title} loading="lazy" />
            <div className="gallery-overlay">
              <h3>{image.title}</h3>
            </div>
          </div>
        ))}
      </div>

      {activePreviewImage && (
        <div className="modal-backdrop" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleClose}>
              <X size={20} />
            </button>
            <img
              src={activePreviewImage.url}
              alt={activePreviewImage.title}
              className="modal-img"
            />
            <div className="modal-caption">{activePreviewImage.title}</div>
          </div>
        </div>
      )}
    </div>
  );
}
