import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

export default function Videos({
  role,
  activeVideoId,
  onVideoSelect,
  videoAction,
  onEmitVideoAction,
  apiHost
}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch(`${apiHost}/api/videos`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch videos');
        return res.json();
      })
      .then((data) => {
        setVideos(data);
        if (data.length > 0 && !activeVideoId) {
          onVideoSelect(data[0]._id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiHost, activeVideoId, onVideoSelect]);

  const activeVideo = videos.find((v) => v._id === activeVideoId);

  // Sync video element states based on videoAction from Socket
  useEffect(() => {
    if (!videoRef.current || !videoAction) return;
    const videoEl = videoRef.current;
    const { action, time } = videoAction;

    if (action === 'play') {
      videoEl.play().catch((e) => console.log('Playback error:', e));
    } else if (action === 'pause') {
      videoEl.pause();
    } else if (action === 'seek') {
      if (Math.abs(videoEl.currentTime - time) > 1.5) {
        videoEl.currentTime = time;
      }
    }
  }, [videoAction]);

  const handleVideoSelect = (id) => {
    if (role !== 'executive') return;
    onVideoSelect(id);
  };

  const handlePlay = () => {
    if (role !== 'executive') return;
    onEmitVideoAction('play');
  };

  const handlePause = () => {
    if (role !== 'executive') return;
    onEmitVideoAction('pause');
  };

  const handleTimeUpdate = () => {
    if (role !== 'executive' || !videoRef.current) return;
    // Debounce/Throttle time updates to avoid flooding sockets
    const currentTime = videoRef.current.currentTime;
    if (Math.floor(currentTime) % 2 === 0) {
      onEmitVideoAction('seek', currentTime);
    }
  };

  if (loading) {
    return (
      <div className="state-container">
        <div className="spinner"></div>
        <p>Loading project walkthroughs...</p>
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

  return (
    <div className="videos-container">
      <div className="video-player-wrapper">
        <div className="video-player-container">
          {activeVideo ? (
            <video
              ref={videoRef}
              src={activeVideo.url}
              controls={role === 'executive'}
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <div className="state-container">
              <p>No video selected</p>
            </div>
          )}
        </div>
        {activeVideo && (
          <div className="video-info">
            <h2>{activeVideo.title}</h2>
            <p>Convrse Spaces Walkthrough Experience</p>
          </div>
        )}
      </div>

      <div className="video-list">
        <h3>Walkthrough Library</h3>
        {videos.map((vid) => (
          <div
            key={vid._id}
            className={`video-item ${vid._id === activeVideoId ? 'active' : ''}`}
            onClick={() => handleVideoSelect(vid._id)}
          >
            <div className="video-item-thumbnail">
              <img src={vid.thumbnail} alt={vid.title} />
            </div>
            <div className="video-item-info">
              <h4>{vid.title}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
