import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, CheckCircle2, Shield, ScanFace } from 'lucide-react';
import CameraFeed from '../components/CameraFeed';
import toast from 'react-hot-toast';

export default function StudentKiosk() {
  const [authStatus, setAuthStatus] = useState('idle'); // idle, scanning, success
  const [student, setStudent] = useState(null);

  const handleFingerprint = async () => {
    setAuthStatus('scanning');
    try {
      if (window.isSecureContext && window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            rpId: window.location.hostname,
            userVerification: "required",
            timeout: 60000,
          }
        });
        setStudent({ name: 'Muhammad Affan', id: 'ST001', method: 'Touch ID' });
        setAuthStatus('success');
      } else {
        // Mock fallback
        setTimeout(() => {
          setStudent({ name: 'Muhammad Affan', id: 'ST001', method: 'Mock Fingerprint' });
          setAuthStatus('success');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      toast.error('Authentication failed');
      setAuthStatus('idle');
    }
  };

  const handleFaceScan = () => {
    setAuthStatus('scanning');
    setTimeout(() => {
      setStudent({ name: 'Muhammad Affan', id: 'ST001', method: 'Face Match' });
      setAuthStatus('success');
    }, 2000);
  };

  const reset = () => {
    setAuthStatus('idle');
    setStudent(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>

      <div className="z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Panel: Camera (Face Auth) */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700 shadow-2xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <ScanFace className="w-8 h-8 text-primary-400" />
            <div>
              <h2 className="text-2xl font-bold">Face Scan</h2>
              <p className="text-slate-400 text-sm">Look at the camera</p>
            </div>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden bg-black relative border-2 border-slate-700">
             <CameraFeed active={true} className="h-full min-h-[300px] border-none" />
             {authStatus === 'scanning' && !student && (
                <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-primary-400 rounded-lg animate-pulse shadow-[0_0_30px_rgba(96,165,250,0.5)]"></div>
                </div>
             )}
          </div>
          <button 
            onClick={handleFaceScan}
            disabled={authStatus !== 'idle'}
            className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50"
          >
            {authStatus === 'scanning' && !student ? 'Scanning...' : 'Verify Face'}
          </button>
        </div>

        {/* Right Panel: Biometric (Fingerprint) */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-700 shadow-2xl flex flex-col items-center justify-center">
          <Shield className="w-12 h-12 text-slate-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Biometric Terminal</h2>
          <p className="text-slate-400 text-center mb-12">Alternatively, place your finger on the sensor</p>
          
          <div 
            onClick={authStatus === 'idle' ? handleFingerprint : undefined}
            className={`w-40 h-40 rounded-full border-4 flex items-center justify-center relative cursor-pointer transition-all duration-500 shadow-2xl
              ${authStatus === 'scanning' && !student ? 'border-primary-500 fingerprint-scanner shadow-primary-500/50' : 'border-slate-600 hover:border-primary-400 hover:shadow-primary-500/20'}`}
          >
            <Fingerprint className={`w-20 h-20 transition-all duration-300 ${authStatus === 'scanning' ? 'text-primary-400' : 'text-slate-500'}`} />
          </div>
        </div>

      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {authStatus === 'success' && student && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4"
          >
            <div className="bg-emerald-900/40 border border-emerald-500/30 p-10 rounded-3xl text-center max-w-md w-full shadow-[0_0_100px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-24 h-24 text-emerald-400 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white mb-2">Checked In!</h1>
              <p className="text-emerald-300 text-lg mb-6">{student.name} • {student.id}</p>
              <div className="inline-block bg-slate-800 px-4 py-2 rounded-lg text-sm text-slate-300 mb-8 font-medium">
                Verified via {student.method}
              </div>
              <button 
                onClick={reset}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Next Student
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="absolute top-6 left-6 font-bold text-xl tracking-tight text-white flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary-500" /> AI Attendance Kiosk
      </div>
    </div>
  );
}
