import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Camera, AlertCircle, Settings2 } from 'lucide-react';

const CameraFeed = forwardRef(({ streamUrl = '/api/recognition/video_feed', active = true, className = '', forceLocalWebcam = true }, ref) => {
  const [hasError, setHasError] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    captureFrame: async () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      
      let sourceElement = null;
      if (!forceLocalWebcam && !hasError && imgRef.current) {
        sourceElement = imgRef.current;
        canvas.width = imgRef.current.naturalWidth || 640;
        canvas.height = imgRef.current.naturalHeight || 480;
      } else if (videoRef.current && videoRef.current.readyState >= 2) {
        sourceElement = videoRef.current;
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
      }

      if (!sourceElement || canvas.width === 0) return null;

      // Draw frame to canvas
      ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.85);
      });
    }
  }));

  // Auto-connect and activate local webcam with 0ms delay
  useEffect(() => {
    let stream = null;
    let isMounted = true;

    if (active && (forceLocalWebcam || hasError)) {
      const constraints = selectedDeviceId 
        ? { video: { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } }
        : { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } };

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
          .then(s => {
            if (!isMounted) {
              s.getTracks().forEach(t => t.stop());
              return;
            }
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.play().catch(() => {});
            }
            // Enumerate devices once permission is granted
            navigator.mediaDevices.enumerateDevices().then(devs => {
              if (!isMounted) return;
              const videoDevs = devs.filter(d => d.kind === 'videoinput');
              setDevices(videoDevs);
            }).catch(() => {});
          })
          .catch(err => {
            console.error("Webcam init error:", err);
            setHasError(true);
          });
      }
    }

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [active, forceLocalWebcam, hasError, selectedDeviceId]);

  if (!active) {
    return (
      <div className={`bg-slate-900 flex flex-col items-center justify-center rounded-xl overflow-hidden border border-slate-800 ${className}`}>
        <Camera className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-slate-500 font-medium">Camera Off</p>
      </div>
    );
  }

  return (
    <div className={`bg-black rounded-xl overflow-hidden relative shadow-inner flex flex-col ${className}`}>
      
      {/* Settings Overlay for Local Webcam */}
      {(forceLocalWebcam || hasError) && devices.length > 1 && (
        <div className="absolute top-2 right-2 z-20">
          <select 
            className="bg-black/70 backdrop-blur text-white text-xs py-1 px-2 rounded-md outline-none border border-white/20 focus:border-primary-500"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.substring(0,5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 flex items-center bg-black/50 backdrop-blur px-3 py-1.5 rounded-full">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
        <span className="text-white text-xs font-semibold uppercase tracking-wider">Live</span>
      </div>
      
      {!forceLocalWebcam && !hasError ? (
        <img 
          ref={imgRef}
          src={streamUrl} 
          alt="Live Camera Feed" 
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
          onError={() => setHasError(true)}
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
