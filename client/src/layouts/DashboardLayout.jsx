import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  DollarSign,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [globalSearch, setGlobalSearch] = React.useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/admin/students`);
      // Use setTimeout to ensure we navigate first, then the students page can pick up a search state if we passed it via context, but for now we'll just navigate to students.
      // Better: navigate with state or query param
      navigate(`/admin/students?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  // Keyboard shortcut for global search
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Payments & Fees', path: '/admin/payments', icon: CreditCard },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
    { name: 'Revenue Panel', path: '/admin/revenue', icon: DollarSign },
  ];

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : studentLinks;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-surface border-r border-gray-100 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex items-center gap-2.5 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
          <div className="w-14 h-14 shrink-0 rounded-full shadow-md relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all bg-surface">
            <img src="/logo.png" alt="Prakash Library" className="w-full h-full object-cover scale-[1.15]" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[17px] font-extrabold text-text-main tracking-tight leading-tight">Prakash Library</h2>
            <p className="text-[9px] uppercase tracking-[0.1em] text-text-muted font-bold mt-0.5">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-text-muted hover:bg-gray-50 hover:text-text-main'
                }`
              }
            >
              <link.icon size={20} />
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-surface h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center md:hidden gap-3">
            <Menu
              className="text-text-muted cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            />
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain rounded-full shadow-sm border border-gray-100" />
              <h2 className="text-lg font-bold text-text-main tracking-tight">Prakash Library</h2>
            </div>
          </div>
          <div className="hidden md:flex flex-1 max-w-xl mx-auto justify-center">
            <div className="w-full relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              </div>
              <input
                id="global-search-input"
                type="text"
                placeholder="Global search students, payments..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={handleGlobalSearch}
                className="w-full pl-11 pr-20 py-2.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all text-sm text-text-main placeholder-gray-400 shadow-sm inset-y-0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <div className="hidden lg:flex items-center gap-1 opacity-60">
                  <kbd className="bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-sm">CTRL</kbd>
                  <kbd className="bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-sm">K</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-auto">
            <button className="p-2 text-text-muted hover:bg-gray-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : user?.role === 'ADMIN' ? (
                <img
                  src="/logo.png"
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 overflow-hidden flex items-center justify-center border border-gray-300">
                  <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-text-main">{user?.name}</p>
                <p className="text-xs text-text-muted capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
