import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Lock, Mail, Eye, EyeOff, Shield, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // Smart role detection (simulating a database lookup)
      // In a real app, the backend would verify the password and return the user's role
      const isPrincipal = email.toLowerCase().includes('principal');
      const role = isPrincipal ? 'principal' : 'teacher';
      const name = isPrincipal ? 'Principal User' : 'Teacher User';

      // For this demo, accept any non-empty password
      if (email && password) {
        login(email, password, role, name);
        toast.success(`Welcome back, ${name}!`);
      } else {
        toast.error('Please enter both email and password');
      }
      
      setLoading(false);
    }, 800);
  };

  // Determine button color based on typed email
  const isPrincipalEmail = email.toLowerCase().includes('principal');

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-600/15 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
        className="w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/30">
            <Brain className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">AI Attendance</h1>
          <p className="text-slate-400 mt-1">Smart Face Recognition System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700 shadow-2xl p-8">
          
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-white">Sign In</h2>
            <p className="text-sm text-slate-400 mt-1">Enter your school credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu"
                  required
                  className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder:text-slate-600 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl pl-12 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder:text-slate-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Quick Fill Demo Credentials */}
            <div className="pt-2 border-t border-slate-700/60">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Quick Demo Accounts (Click to Fill)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setEmail('principal@school.edu'); setPassword('admin123'); }}
                  className="px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 rounded-xl text-[11px] font-medium text-emerald-300 text-left transition-all"
                >
                  <span className="font-bold block text-emerald-400">👑 Principal Account</span>
                  principal@school.edu / admin123
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('teacher@school.edu'); setPassword('teacher123'); }}
                  className="px-2.5 py-1.5 bg-primary-950/40 hover:bg-primary-900/60 border border-primary-700/50 rounded-xl text-[11px] font-medium text-primary-300 text-left transition-all"
                >
                  <span className="font-bold block text-primary-400">👨‍🏫 Teacher Account</span>
                  teacher@school.edu / teacher123
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm transition-all shadow-lg mt-4 ${
                isPrincipalEmail 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                  : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'
              } disabled:opacity-60`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" /> Protected by AI Attendance System v2.0
        </p>
      </motion.div>
    </div>
  );
}
