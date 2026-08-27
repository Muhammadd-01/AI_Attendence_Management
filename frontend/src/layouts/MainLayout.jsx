import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  GraduationCap, 
  ClipboardList, 
  FileText, 
  BarChart3, 
  Settings, 
  Brain, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  BookOpen, 
  ChevronDown,
  ScanFace,
  Fingerprint
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/formatters';
import ConfirmDialog from '../components/ConfirmDialog';

const NAV_ITEMS_DEF = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/live-attendance', label: 'Live AI (Students)', icon: Video, liveHighlight: true, hideForStudent: true },
  { path: '/kiosk', label: 'Faculty Check-In', icon: ScanFace, kioskHighlight: true, role: 'principal' },
  { path: '/classes', label: 'Classes', icon: BookOpen, hideForStudent: true },
  { path: '/students', label: 'Students', icon: GraduationCap, hideForStudent: true },
  { path: '/teachers', label: 'Faculty', icon: Users, role: 'principal' },
  { path: '/attendance', label: 'Records', icon: ClipboardList, role: 'principal' },
  { path: '/reports', label: 'Reports', icon: FileText, role: 'principal' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, role: 'principal' },
  { path: '/settings', label: 'Settings', icon: Settings, role: 'principal' },
];

export default function MainLayout() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { sessionActive, darkMode, setDarkMode, user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = NAV_ITEMS_DEF.filter(item => {
    if (user?.role === 'student' && item.hideForStudent) return false;
    if (item.role && item.role !== user?.role) return false;
    return true;
  });

  const currentRoute = navItems.find(item => item.path === location.pathname) || { label: 'Studio Workspace' };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 relative selection:bg-primary-500/20 pb-28">
      
      {/* Top Floating Vision Bar */}
      <header className="pt-4 sm:pt-6 pb-2 px-3 sm:px-6 max-w-7xl mx-auto w-full z-40">
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all">
          
          {/* Brand & Current Module */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/30 group-hover:scale-105 transition-transform shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-sm tracking-tight text-slate-900 dark:text-white">
                    AI ATTENDANCE
                  </span>
                  <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 rounded-md border border-primary-200/60 dark:border-primary-800/50">
                    STUDIO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {user?.role === 'principal' ? '👑 Principal Authority' : '👨‍🏫 Faculty Session'} • <span className="text-primary-600 dark:text-primary-400 font-semibold">{currentRoute.label}</span>
                </p>
              </div>
            </button>
          </div>

          {/* Quick Launch Terminal + Indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Kiosk Launch Button */}
            {user?.role === 'principal' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/kiosk')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all"
              >
                <ScanFace className="w-3.5 h-3.5" />
                <span>Face & Fingerprint Terminal</span>
              </motion.button>
            )}

            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
              <span>{formatTime(currentTime.toISOString())}</span>
            </div>

            {/* Online Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>

            {/* Vision Active Indicator */}
            {sessionActive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 text-[11px] font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                <span className="live-dot" />
                <span className="hidden sm:inline">Live</span>
              </div>
            )}

            {/* Theme Switcher */}
            <motion.button
              whileTap={{ scale: 0.9, rotate: 15 }}
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </motion.button>

            {/* Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-2 sm:pr-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl hover:bg-slate-200/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {(user.name || 'U').charAt(0)}
                  </div>
                  <span className="hidden sm:block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-primary-500" /> My Profile {user?.role !== 'student' && '& Touch ID'}
                      </button>
                      {user?.role === 'principal' && (
                        <button
                          onClick={() => { navigate('/kiosk'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        >
                          <ScanFace className="w-3.5 h-3.5" /> Face & Fingerprint Terminal
                        </button>
                      )}
                      <button
                        onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Expansive Canvas */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 pt-3">
        <Outlet />
      </main>

      {/* Perfectly Balanced Floating Bottom Dock with Sliding Active Pill */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[96vw]">
        <nav className="glass-dock rounded-full px-2.5 py-1.5 flex items-center justify-center gap-1 shadow-2xl border border-slate-700/60 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-colors duration-200 shrink-0 ${
                  isActive 
                    ? 'text-white font-bold' 
                    : item.kioskHighlight
                      ? 'text-emerald-400 hover:text-white'
                      : 'text-slate-400 hover:text-white'
                }`}
                title={item.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeDockPill"
                    className="absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full shadow-md shadow-primary-600/30 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${isActive ? 'text-white scale-105' : ''}`} />
                <span className={`${isActive ? 'inline' : 'hidden xl:inline'} text-[11px] sm:text-xs font-medium`}>
                  {item.label}
                </span>
                
                {item.liveHighlight && sessionActive && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          navigate('/login');
        }}
        title="Sign Out of Session?"
        message="Are you sure you want to log out of AI Attendance Manager? Any unsaved changes may be lost."
        confirmLabel="Yes, Sign Out"
        danger={true}
      />
    </div>
  );
}
