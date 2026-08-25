import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Menu, 
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  UserCheck,
  User
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/formatters';

const BASE_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live-attendance', label: 'Live Attendance', icon: Video },
  { path: '/students', label: 'Students', icon: GraduationCap },
  { path: '/teachers', label: 'Teachers', icon: Users, role: 'principal' },
  { path: '/attendance', label: 'Attendance', icon: ClipboardList },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'My Profile', icon: User },
];

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { sessionActive, darkMode, setDarkMode, user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const currentRoute = NAV_ITEMS.find(item => item.path === location.pathname) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex bg-gray-50 transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 
        ${sidebarCollapsed ? 'w-20' : 'w-72'} 
        bg-slate-900 text-white flex flex-col 
        transition-all duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className={`h-20 flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-8'} bg-slate-950/50 relative group`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-600/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="font-bold text-xl tracking-tight leading-tight whitespace-nowrap overflow-hidden">
                AI<br/><span className="text-primary-400">Attendance</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white border border-slate-700 hidden lg:flex"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 overflow-y-auto space-y-1.5 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' 
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'}
                `}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${!sidebarCollapsed && 'mr-3'}`} />
                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {user?.role === 'principal' && (
            <button
              onClick={() => navigate('/principal')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 rounded-xl text-emerald-400 hover:bg-emerald-900/30 transition-colors`}
              title={sidebarCollapsed ? 'Principal Panel' : undefined}
            >
              <ShieldCheck className={`w-5 h-5 shrink-0 ${!sidebarCollapsed && 'mr-3'}`} />
              {!sidebarCollapsed && <span className="font-medium text-sm">Principal Panel</span>}
            </button>
          )}
          
          {!sidebarCollapsed && user && (
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition-colors`}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className={`w-5 h-5 shrink-0 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 relative">
        {/* Topbar */}
        <header className="sticky top-0 right-0 left-0 h-16 bg-white shadow-sm z-40 flex items-center justify-between px-6 transition-colors duration-300">
          <div className="flex items-center">
            <button 
              className="mr-4 lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">{currentRoute.label}</h1>
          </div>
          
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="hidden md:flex items-center text-sm font-medium text-gray-600">
              <span className="hidden lg:inline-block mr-2">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <span>{formatTime(currentTime.toISOString())}</span>
            </div>
            
            <div className={`hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-semibold ${sessionActive ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${sessionActive ? 'bg-success animate-pulse' : 'bg-gray-400'}`}></div>
              {sessionActive ? 'Session Active' : 'Offline'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
