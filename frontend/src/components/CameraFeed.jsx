import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Camera, AlertCircle } from 'lucide-react';

const CameraFeed = forwardRef(({ streamUrl = '/video_feed', active = false, className = '' }, ref) => {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    captureFrame: async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      let sourceElement = null;
      if (!hasError && imgRef.current) {
        sourceElement = imgRef.current;
        canvas.width = imgRef.current.naturalWidth || 640;
        canvas.height = imgRef.current.naturalHeight || 480;
      } else if (hasError && videoRef.current) {
        sourceElement = videoRef.current;
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
      }

      if (!sourceElement || canvas.width === 0) return null;

      if (hasError) {
        // Handle webcam mirror flip
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.85);
      });
    }
  }));

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
          ref={imgRef}
          src={streamUrl} 
          crossOrigin="anonymous"
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
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});

export default CameraFeed;
