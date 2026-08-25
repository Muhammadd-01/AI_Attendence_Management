import React, { useState, useEffect, useRef } from 'react';
import CameraFeed from './CameraFeed';
import toast from 'react-hot-toast';
import { Camera, Check, Play, Square, Loader, Upload, ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFaceImage } from '../services/supabase';

export default function FaceCapture({ personId, personName, bucket = 'student-faces', onComplete, onClose }) {
  const [tab, setTab] = useState('camera');
  const [imagesCaptured, setImagesCaptured] = useState(0);
  const [bestImageUrl, setBestImageUrl] = useState(null);
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const maxImages = 100;
  const minRequired = 20;
  
  const cameraRef = useRef(null);
  const isCapturingRef = useRef(false);

  useEffect(() => {
    let interval;
    if (autoMode && imagesCaptured < maxImages) {
      interval = setInterval(() => {
        if (!isCapturingRef.current) {
          handleCapture();
        }
      }, 500); // 500ms delay between shots
    }
    return () => clearInterval(interval);
  }, [autoMode, imagesCaptured]);

  const handleCapture = async () => {
    if (loading || imagesCaptured >= maxImages || isCapturingRef.current) return;
    
    setLoading(true);
    isCapturingRef.current = true;
    
    try {
      if (cameraRef.current) {
        const blob = await cameraRef.current.captureFrame();
        if (blob) {
          // Upload to Supabase
          const url = await uploadFaceImage(personId, blob, imagesCaptured + 1, bucket);
          if (!bestImageUrl || imagesCaptured === 0) {
            setBestImageUrl(url);
          }
          
          setImagesCaptured(prev => {
            const next = prev + 1;
            if (next === maxImages) {
              setAutoMode(false);
              toast.success('Max images captured!');
            }
            return next;
          });
        } else {
          toast.error("Failed to capture frame");
        }
      }
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Error saving image to Supabase");
      setAutoMode(false);
    } finally {
      setLoading(false);
      isCapturingRef.current = false;
    }
  };

  const getGuideContent = () => {
    if (imagesCaptured < 25) return { text: "Look straight at the camera", icon: <Camera className="w-8 h-8 mx-auto mb-2 text-white/80" /> };
    if (imagesCaptured < 50) return { text: "Turn your head slowly LEFT", icon: <ArrowLeft className="w-8 h-8 mx-auto mb-2 text-white/80 animate-pulse" /> };
    if (imagesCaptured < 75) return { text: "Turn your head slowly RIGHT", icon: <ArrowRight className="w-8 h-8 mx-auto mb-2 text-white/80 animate-pulse" /> };
    if (imagesCaptured < 90) return { text: "Tilt your head slightly UP", icon: <ArrowUp className="w-8 h-8 mx-auto mb-2 text-white/80 animate-pulse" /> };
    return { text: "Make different facial expressions", icon: <Check className="w-8 h-8 mx-auto mb-2 text-success animate-bounce" /> };
  };

  const guide = getGuideContent();

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 relative rounded-xl overflow-hidden shadow-inner bg-black">
        <CameraFeed ref={cameraRef} active={true} className="h-64 md:h-[400px] border-none shadow-none" />
        
        {/* Dynamic Overlay Guide */}
        {tab === 'camera' && imagesCaptured < maxImages && autoMode && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-black/40">
            <AnimatePresence mode="wait">
              <motion.div
                key={guide.text}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.2, y: -20 }}
                className="text-center bg-black/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-2xl"
              >
                {guide.icon}
                <p className="text-white font-semibold text-lg drop-shadow-md">{guide.text}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
      <div className="w-full md:w-80 flex flex-col space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-1">Face Registration</h3>
          <p className="text-sm text-gray-500">Registering faces for {personName || 'Person'}</p>
        </div>
        
        <div className="flex rounded-lg bg-gray-100 p-1 mb-2">
          <button onClick={() => setTab('camera')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'camera' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500'}`}>Camera</button>
          <button onClick={() => setTab('upload')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'upload' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500'}`}>Upload</button>
        </div>

        {tab === 'camera' ? (
          <>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">{imagesCaptured} / {maxImages}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${imagesCaptured >= minRequired ? 'bg-success' : 'bg-primary-500'}`} 
                  style={{ width: `${(imagesCaptured / maxImages) * 100}%` }}
                ></div>
              </div>
              {imagesCaptured < minRequired && (
                <p className="text-xs text-warning mt-2">Need at least {minRequired} images to train</p>
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium text-gray-700">Instructions:</p>
              <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
                <li>Look straight at the camera</li>
                <li>Turn your head slowly left and right</li>
                <li>Tilt your head slightly up and down</li>
                <li>Make different facial expressions</li>
              </ul>
            </div>

            <div className="mt-auto pt-4 space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={handleCapture}
                  disabled={loading || autoMode || imagesCaptured >= maxImages}
                  className="flex-1 flex items-center justify-center py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading && !autoMode ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                  Capture
                </button>
                <button
                  onClick={() => setAutoMode(!autoMode)}
                  disabled={imagesCaptured >= maxImages}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-white font-medium transition-colors ${autoMode ? 'bg-danger hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {autoMode ? <><Square className="w-4 h-4 mr-2" /> Stop</> : <><Play className="w-4 h-4 mr-2" /> Auto</>}
                </button>
              </div>
              <button
                onClick={() => {
                  if (imagesCaptured >= minRequired) {
                    if (onComplete) onComplete(bestImageUrl, imagesCaptured);
                  } else {
                    toast.error(`Please capture at least ${minRequired} images`);
                  }
                }}
                className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-white font-medium transition-colors ${imagesCaptured >= minRequired ? 'bg-success hover:bg-emerald-600' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                <Check className="w-4 h-4 mr-2" />
                Done
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">Click to upload images</p>
              <p className="text-xs text-gray-500 mt-1">Select multiple .jpg or .png files</p>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                id="file-upload" 
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  if (files.length > 0) {
                    setLoading(true);
                    try {
                      let uploadedCount = 0;
                      let firstUrl = bestImageUrl;
                      for (const file of files) {
                        if (imagesCaptured + uploadedCount >= maxImages) break;
                        const url = await uploadFaceImage(personId, file, imagesCaptured + uploadedCount + 1, bucket);
                        if (!firstUrl) firstUrl = url;
                        uploadedCount++;
                      }
                      if (firstUrl) setBestImageUrl(firstUrl);
                      setImagesCaptured(prev => Math.min(maxImages, prev + uploadedCount));
                      toast.success(`${uploadedCount} images uploaded successfully!`);
                    } catch (err) {
                      console.error("Upload error:", err);
                      toast.error("Failed to upload some images");
                    } finally {
                      setLoading(false);
                    }
                  }
                }} 
              />
              <label htmlFor="file-upload" className="mt-4 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-100 flex items-center">
                {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? 'Uploading...' : 'Select Files'}
              </label>
            </div>
            
            <div className="mt-auto pt-4">
               <button
                onClick={() => {
                  if (imagesCaptured >= minRequired) {
                    if (onComplete) onComplete(bestImageUrl, imagesCaptured);
                  } else {
                    toast.error(`Please upload at least ${minRequired} images`);
                  }
                }}
                className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-white font-medium transition-colors ${imagesCaptured >= minRequired ? 'bg-success hover:bg-emerald-600' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                <Check className="w-4 h-4 mr-2" />
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
