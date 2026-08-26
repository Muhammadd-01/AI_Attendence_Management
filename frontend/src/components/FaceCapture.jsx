import React, { useState, useEffect, useRef } from 'react';
import CameraFeed from './CameraFeed';
import toast from 'react-hot-toast';
import { Camera, Check, Play, Square, Loader, Upload, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFaceImage, getStudentFaces } from '../services/supabase';

export default function FaceCapture({ personId, personName, bucket = 'student-faces', onComplete, onClose }) {
  const [tab, setTab] = useState('camera');
  const [imagesCaptured, setImagesCaptured] = useState(0);
  const [bestImageUrl, setBestImageUrl] = useState(null);
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAutoTraining, setIsAutoTraining] = useState(false);
  const maxImages = 100;
  const minRequired = 10;
  
  const cameraRef = useRef(null);
  const isCapturingRef = useRef(false);
  const autoTrainingRef = useRef(false);

  const isTeacher = bucket === 'teacher-faces' || String(personId).startsWith('TCH');

  // Automatically trigger AI Training on all Supabase images & backend dataset
  const triggerAutoTrain = async (imageCount = imagesCaptured) => {
    if (autoTrainingRef.current) return;
    autoTrainingRef.current = true;
    setIsAutoTraining(true);
    const toastId = toast.loading(`Training AI neural face model on ${imageCount} photos...`);

    try {
      // 1. Fetch all stored public image URLs from Supabase for this person
      let supaUrls = [];
      try {
        supaUrls = await getStudentFaces(personId, bucket);
      } catch (e) {
        console.warn("Could not list from Supabase bucket:", e);
      }

      // 2. Trigger backend training with the Supabase URLs
      const trainEndpoint = isTeacher
        ? `/api/teachers/${personId}/train`
        : `/api/students/${personId}/train`;

      const res = await fetch(trainEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_urls: supaUrls })
      });

      let json = {};
      try {
        const text = await res.text();
        json = text ? JSON.parse(text) : {};
      } catch (e) {
        json = {};
      }

      if (res.ok && (json.success || json.data?.success)) {
        toast.success(`AI Face Model auto-trained on ${imageCount} photos! You will now be automatically recognized by the camera.`, { id: toastId, duration: 4000 });
        if (onComplete) {
          onComplete(bestImageUrl || (supaUrls.length > 0 ? supaUrls[0] : null), imageCount);
        }
      } else {
        const errMsg = json.error || json.message || (res.status === 502 ? 'Backend server not responding (502). Please ensure backend is running on port 5001.' : 'AI training failed.');
        toast.error(errMsg, { id: toastId });
      }
    } catch (err) {
      console.error("Auto training error:", err);
      toast.error('Network error during AI auto-training. Ensure backend is running.', { id: toastId });
    } finally {
      setIsAutoTraining(false);
      autoTrainingRef.current = false;
    }
  };

  useEffect(() => {
    let interval;
    if (autoMode && imagesCaptured < maxImages) {
      interval = setInterval(() => {
        if (!isCapturingRef.current && !autoTrainingRef.current) {
          handleCapture();
        }
      }, 400); // 400ms fast capture burst
    }
    return () => clearInterval(interval);
  }, [autoMode, imagesCaptured]);

  const handleCapture = async () => {
    if (loading || imagesCaptured >= maxImages || isCapturingRef.current || autoTrainingRef.current) return;
    
    setLoading(true);
    isCapturingRef.current = true;
    
    try {
      if (cameraRef.current) {
        const blob = await cameraRef.current.captureFrame();
        if (blob) {
          // Upload to Supabase storage
          uploadFaceImage(personId, blob, imagesCaptured + 1, bucket)
            .then(currentUrl => {
              if (currentUrl && (!bestImageUrl || imagesCaptured === 0)) {
                setBestImageUrl(currentUrl);
              }
              setImagesCaptured(prev => {
                const next = prev + 1;
                if (next === maxImages) {
                  setAutoMode(false);
                  setTimeout(() => triggerAutoTrain(100), 400);
                }
                return next;
              });
            })
            .catch((err) => {
              if (err.message && err.message.includes('Bucket Not Found')) {
                toast.error(err.message, { duration: 6000 });
              }
            })
            .finally(() => {
              isCapturingRef.current = false;
              setLoading(false);
            });
        } else {
          isCapturingRef.current = false;
          setLoading(false);
        }
      } else {
        isCapturingRef.current = false;
        setLoading(false);
      }
    } catch (err) {
      console.error("Capture error:", err);
      setAutoMode(false);
      isCapturingRef.current = false;
      setLoading(false);
    }
  };

  const handleDoneClick = () => {
    if (imagesCaptured < minRequired) {
      return toast.error(`Please capture at least ${minRequired} sample photos to train the AI`);
    }
    triggerAutoTrain(imagesCaptured);
  };

  const getGuideContent = () => {
    if (imagesCaptured < 20) return { text: "Look straight at the camera", icon: <Camera className="w-8 h-8 mx-auto mb-2 text-white/80" /> };
    if (imagesCaptured < 45) return { text: "Turn your head slowly LEFT", icon: <ArrowLeft className="w-8 h-8 mx-auto mb-2 text-white/80 animate-pulse" /> };
    if (imagesCaptured < 70) return { text: "Turn your head slowly RIGHT", icon: <ArrowRight className="w-8 h-8 mx-auto mb-2 text-white/80 animate-pulse" /> };
    if (imagesCaptured < 90) return { text: "Tilt your head slightly UP", icon: <ArrowUp className="w-8 h-8 mx-auto mb-2 text-white/80 animate-pulse" /> };
    return { text: "Finishing 100 photo dataset...", icon: <Check className="w-8 h-8 mx-auto mb-2 text-emerald-400 animate-bounce" /> };
  };

  const guide = getGuideContent();

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 relative rounded-2xl overflow-hidden shadow-inner bg-black min-h-[360px] flex items-center justify-center">
        <CameraFeed ref={cameraRef} active={true} forceLocalWebcam={true} className="w-full h-full object-cover" />
        
        {/* Dynamic Overlay Guide */}
        {tab === 'camera' && imagesCaptured < maxImages && autoMode && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-black/40">
            <AnimatePresence mode="wait">
              <motion.div
                key={guide.text}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.2, y: -20 }}
                className="text-center bg-black/70 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-2xl"
              >
                {guide.icon}
                <p className="text-white font-semibold text-base drop-shadow-md">{guide.text}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="w-full md:w-80 flex flex-col space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Automatic Face AI Training</h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              SUPABASE AI
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Capturing 100 face images for <strong>{personName || personId}</strong></p>
        </div>
        
        <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
          <button onClick={() => setTab('camera')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${tab === 'camera' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-white' : 'text-gray-500'}`}>Live Camera</button>
          <button onClick={() => setTab('upload')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${tab === 'upload' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-white' : 'text-gray-500'}`}>Upload Photos</button>
        </div>

        {tab === 'camera' ? (
          <>
            <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Dataset Samples</span>
                <span className="text-xs font-mono font-bold text-gray-600 dark:text-slate-400">{imagesCaptured} / {maxImages}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-300 ${imagesCaptured >= minRequired ? 'bg-emerald-500' : 'bg-primary-500'}`} 
                  style={{ width: `${(imagesCaptured / maxImages) * 100}%` }}
                ></div>
              </div>
              {imagesCaptured === maxImages ? (
                <p className="text-[11px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100 images saved! Auto-training in progress...
                </p>
              ) : imagesCaptured >= minRequired ? (
                <p className="text-[11px] text-emerald-500 font-medium mt-2">✓ {imagesCaptured} photos captured • Ready to auto-train</p>
              ) : (
                <p className="text-[11px] text-amber-500 font-medium mt-2">Auto-captures 100 images to train AI</p>
              )}
            </div>

            <div className="flex flex-col space-y-1.5 text-xs text-gray-500">
              <p className="font-semibold text-gray-700 dark:text-slate-300">Automatic Process:</p>
              <ul className="text-[11px] list-disc pl-4 space-y-1">
                <li>Click <strong>Start 100-Photo Burst</strong></li>
                <li>System captures photos and uploads to Supabase</li>
                <li>AI automatically trains on all 100 images upon completion</li>
              </ul>
            </div>

            <div className="mt-auto pt-4 space-y-2.5">
              <div className="flex space-x-2">
                <button
                  onClick={handleCapture}
                  disabled={loading || autoMode || imagesCaptured >= maxImages || isAutoTraining}
                  className="flex-1 flex items-center justify-center py-2.5 px-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loading && !autoMode ? <Loader className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Camera className="w-3.5 h-3.5 mr-1.5" />}
                  Single Shot
                </button>
                <button
                  onClick={() => setAutoMode(!autoMode)}
                  disabled={imagesCaptured >= maxImages || isAutoTraining}
                  className={`flex-1 flex items-center justify-center py-2.5 px-3 rounded-xl text-white text-xs font-bold transition-all shadow-sm ${autoMode ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'} disabled:opacity-50`}
                >
                  {autoMode ? <><Square className="w-3.5 h-3.5 mr-1.5" /> Stop Burst</> : <><Play className="w-3.5 h-3.5 mr-1.5" /> Start 100 Burst</>}
                </button>
              </div>

              <button
                onClick={handleDoneClick}
                disabled={imagesCaptured < minRequired || isAutoTraining}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-bold text-xs transition-all shadow-md ${
                  imagesCaptured >= minRequired && !isAutoTraining
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                    : 'bg-gray-300 dark:bg-slate-800 text-gray-500 cursor-not-allowed shadow-none'
                }`}
              >
                {isAutoTraining ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Auto-Training AI on Supabase Images...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 mr-2" />
                    Complete & Train AI ({imagesCaptured} samples)
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full space-y-4">
            <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-xs font-bold text-gray-700 dark:text-slate-200">Upload Face Photos</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Upload photos to automatically save to Supabase & train AI</p>
              
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
                    const toastId = toast.loading(`Uploading ${files.length} images to Supabase...`);
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
                      const totalNow = Math.min(maxImages, imagesCaptured + uploadedCount);
                      setImagesCaptured(totalNow);
                      toast.success(`${uploadedCount} photos saved to Supabase! Auto-training AI now...`, { id: toastId });
                      
                      setTimeout(() => triggerAutoTrain(totalNow), 600);
                    } catch (err) {
                      console.error("Upload error:", err);
                      toast.error("Failed to upload some images", { id: toastId });
                    } finally {
                      setLoading(false);
                    }
                  }
                }} 
              />
              <label htmlFor="file-upload" className="mt-3 px-4 py-2 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold cursor-pointer hover:bg-primary-100 flex items-center">
                {loading ? <Loader className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Select Photos
              </label>
            </div>
            
            <div className="mt-auto pt-4">
              <button
                onClick={handleDoneClick}
                disabled={imagesCaptured < minRequired || isAutoTraining}
                className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-bold text-xs transition-all shadow-md ${
                  imagesCaptured >= minRequired && !isAutoTraining
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                    : 'bg-gray-300 dark:bg-slate-800 text-gray-500 cursor-not-allowed shadow-none'
                }`}
              >
                {isAutoTraining ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Auto-Training AI on Supabase Images...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 mr-2" />
                    Complete & Train AI ({imagesCaptured} samples)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
