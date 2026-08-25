import React, { useState, useEffect, useRef } from 'react';
import { Camera, AlertCircle } from 'lucide-react';

export default function CameraFeed({ streamUrl = '/video_feed', active = false, className = '' }) {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  // Fallback to local webcam if backend stream is not available
  useEffect(() => {
    if (active && hasError && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Webcam access denied:", err));
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [active, hasError]);

  if (!active) {
    return (
      <div className={`bg-gray-100 flex flex-col items-center justify-center rounded-xl overflow-hidden border border-gray-200 ${className}`}>
        <Camera className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-500 font-medium">Camera Off</p>
      </div>
    );
  }

  return (
    <div className={`bg-black rounded-xl overflow-hidden relative shadow-inner ${className}`}>
      <div className="absolute top-4 left-4 z-10 flex items-center bg-black/50 backdrop-blur px-3 py-1.5 rounded-full">
        <div className="w-2 h-2 bg-danger rounded-full live-dot mr-2"></div>
        <span className="text-white text-xs font-semibold uppercase tracking-wider">Live</span>
      </div>
      
      {!hasError ? (
        <img 
          src={streamUrl} 
          alt="Backend Camera Feed" 
          className="w-full h-full object-cover"
          onError={() => {
            setTimeout(() => setHasError(true), 0);
          }}
        />
      ) : (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover transform -scale-x-100"
        />
      )}
    </div>
  );
}
