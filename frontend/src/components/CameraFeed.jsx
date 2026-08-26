import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Camera, AlertCircle, Settings2 } from 'lucide-react';

const CameraFeed = forwardRef(({ streamUrl = '/video_feed', active = false, className = '', forceLocalWebcam = false }, ref) => {
  const [hasError, setHasError] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    captureFrame: async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      let sourceElement = null;
      if (!forceLocalWebcam && !hasError && imgRef.current) {
        sourceElement = imgRef.current;
        canvas.width = imgRef.current.naturalWidth || 640;
        canvas.height = imgRef.current.naturalHeight || 480;
      } else if ((forceLocalWebcam || hasError) && videoRef.current) {
        sourceElement = videoRef.current;
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
      }

      if (!sourceElement || canvas.width === 0) return null;

      if (forceLocalWebcam || hasError) {
        // Handle webcam mirror flip
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      });
    }
  }));

  // Fetch camera devices when local webcam is active
  useEffect(() => {
    if (active && (forceLocalWebcam || hasError)) {
      const getCameras = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true }); // trigger permission
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          setDevices(videoDevices);
          if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
          // Stop the temporary stream
          stream.getTracks().forEach(track => track.stop());
        } catch (err) {
          console.error("Camera access error:", err);
        }
      };
      getCameras();
    }
  }, [active, forceLocalWebcam, hasError]);

  // Activate the selected local webcam
  useEffect(() => {
    if (active && (forceLocalWebcam || hasError) && selectedDeviceId) {
      navigator.mediaDevices.getUserMedia({ 
        video: { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Webcam init error:", err));
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
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
