import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, UserCheck, AlertCircle, CreditCard, ArrowRight,
  UserPlus, Bell, DollarSign, Calendar, Lock, Unlock, X, TrendingUp, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

const StatCard = ({ title, value, icon: Icon, colorClass, gradient, onClick, locked }) => (
  <motion.div 
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={onClick ? { scale: 0.98 } : {}}
    onClick={onClick}
    className={`glass p-6 rounded-2xl flex items-center justify-between border-l-4 ${colorClass} transition-all duration-300 shadow-sm hover:shadow-xl ${onClick ? 'cursor-pointer hover:bg-gray-50/50' : ''}`}
  >
    <div className="space-y-1">
      <p className="text-text-muted text-sm font-bold uppercase tracking-wider">
        {title} 
      </p>
      {locked ? (
        <div className="flex items-center gap-3 text-gray-400 opacity-80">
           <h3 className="text-3xl font-extrabold tracking-widest mt-1">****</h3>
        </div>
      ) : (
        <h3 className="text-3xl font-extrabold text-text-main tracking-tight">{value}</h3>
      )}
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${gradient} shadow-lg shadow-${colorClass.split('-')[1]}-500/30`}>
      <Icon size={28} />
    </div>
  </motion.div>
);

const AnalogClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secAngle = seconds * 6;
  const minAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="flex items-center gap-5 bg-white px-6 py-2 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <svg width="56" height="56" viewBox="0 0 100 100" className="drop-shadow-sm">
        <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#f3f4f6" strokeWidth="4" />
        {/* Hour markers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
          <line key={angle} x1="50" y1="8" x2="50" y2="16" stroke={angle % 90 === 0 ? "#6b7280" : "#d1d5db"} strokeWidth={angle % 90 === 0 ? "4" : "2"} strokeLinecap="round" transform={`rotate(${angle} 50 50)`} />
        ))}
        {/* Hour Hand */}
        <line x1="50" y1="50" x2="50" y2="28" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" transform={`rotate(${hourAngle} 50 50)`} />
        {/* Minute Hand */}
        <line x1="50" y1="50" x2="50" y2="16" stroke="#4b5563" strokeWidth="3" strokeLinecap="round" transform={`rotate(${minAngle} 50 50)`} />
        {/* Second Hand */}
        <line x1="50" y1="50" x2="50" y2="12" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${secAngle} 50 50)`} />
        <circle cx="50" cy="50" r="3.5" fill="#ef4444" />
      </svg>
      <div className="flex flex-col justify-center">
        <span className="text-lg font-extrabold text-text-main leading-tight tracking-tight">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-[11px] text-green-600 font-bold tracking-wide uppercase flex items-center gap-1.5 mt-0.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Live Sync
        </span>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [dueStudents, setDueStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Revenue PIN State
  const [revenueUnlocked, setRevenueUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, dueRes] = await Promise.all([
          axios.get('/analytics'),
          axios.get('/payments/due')
        ]);
        setStats(analyticsRes.data);
        setDueStudents(dueRes.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();

    if (sessionStorage.getItem('revenue_pin')) {
      setRevenueUnlocked(true);
    }
  }, []);

  const handleUnlockRevenue = async (e) => {
    e.preventDefault();
    setPinLoading(true);
    setPinError('');
    try {
       // Validate PIN against revenue endpoint
       await axios.get('/payments/revenue', { headers: { 'x-revenue-pin': pinInput } });
       sessionStorage.setItem('revenue_pin', pinInput);
       setRevenueUnlocked(true);
       setShowPinModal(false);
       setPinInput('');
       toast.success('Revenue unlocked!');
    } catch {
       setPinError('Invalid Secret PIN');
    } finally {
       setPinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div>
        <p className="text-text-muted animate-pulse font-bold tracking-wide">Loading your workspace...</p>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="space-y-8 pb-10"
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm font-semibold text-primary/80 flex items-center gap-1 sm:gap-2 mt-1 bg-primary/5 inline-flex px-2 sm:px-3 py-1 rounded-full">
            <Calendar size={14} /> {todayStr}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <AnalogClock />
        </div>
      </motion.div>

      {/* Top Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={stats?.totalStudents || 0} 
          icon={Users} 
          colorClass="border-blue-500"
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard 
          title="Paid Students" 
          value={stats?.paidStudents || 0} 
          icon={UserCheck} 
          colorClass="border-green-500"
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard 
          title="Due Students" 
          value={stats?.dueStudents || 0} 
          icon={AlertCircle} 
          colorClass="border-red-500"
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
        />
        <StatCard 
          title="Today's Revenue" 
          value={`₹${stats?.todayRevenue || 0}`} 
          icon={revenueUnlocked ? Eye : EyeOff} 
          colorClass="border-purple-500"
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
          locked={!revenueUnlocked}
          onClick={() => {
            if (!revenueUnlocked) {
              setShowPinModal(true);
            } else {
              setRevenueUnlocked(false);
              sessionStorage.removeItem('revenue_pin');
              toast.success('Revenue locked');
            }
          }}
        />
      </motion.div>

      {/* Dashboard Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Columns (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Welcome Premium Action Card */}
          <motion.div variants={itemVariants} className="bg-gradient-premium text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute left-1/4 bottom-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mb-10 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div className="space-y-3 max-w-lg">
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                  <TrendingUp size={12} /> Workspace Hub
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  Prakash Library Desk
                </h2>
                <p className="text-sm text-white/90 font-medium leading-relaxed">
                  Easily register new members, track pending subscriptions, search transactions, and send bulk notifications from your command center.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row xl:flex-col gap-3 shrink-0 w-full md:w-auto">
                <button 
                  onClick={() => navigate('/admin/students')} 
                  className="px-5 py-3.5 bg-white text-primary font-extrabold text-sm rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} /> Add New Student
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate('/admin/payments')} 
                    className="flex-1 px-5 py-3.5 bg-white/20 text-white font-bold text-sm rounded-2xl hover:bg-white/30 backdrop-blur-sm transition-all border border-white/20 flex items-center justify-center gap-2"
                  >
                    <CreditCard size={18} /> Fees
                  </button>
                  <button 
                    onClick={() => navigate('/admin/notifications')} 
                    className="flex-1 px-5 py-3.5 bg-white/20 text-white font-bold text-sm rounded-2xl hover:bg-white/30 backdrop-blur-sm transition-all border border-white/20 flex items-center justify-center gap-2"
                  >
                    <Bell size={18} /> Notify
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Due Students Quick List */}
          <motion.div variants={itemVariants} className="glass p-6 md:p-8 rounded-3xl space-y-6 shadow-sm border border-white/50">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="font-extrabold text-lg text-text-main flex items-center gap-2">
                <div className="p-2 bg-red-100 text-red-500 rounded-xl">
                  <AlertCircle size={20} className="animate-pulse" />
                </div>
                Urgent Actions (Due Students)
              </h3>
              <button 
                onClick={() => navigate('/admin/notifications')} 
                className="text-xs px-4 py-2 bg-primary/10 text-primary font-extrabold rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-1.5"
              >
                Send Notice <ArrowRight size={14} />
              </button>
            </div>

            <div className="divide-y divide-gray-50/80">
              {dueStudents.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-green-50/50 border border-green-100">
                  <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheck size={32} />
                  </div>
                  <h4 className="font-extrabold text-green-700 text-lg mb-1">All Clear!</h4>
                  <p className="text-sm font-medium text-green-600/80">No students are currently due. Excellent work!</p>
                </div>
              ) : (
                dueStudents.map(student => (
                  <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-4 group">
                    <div className="flex items-center gap-4">
                      {student.profilePhoto ? (
                      <img 
                        src={getPhotoUrl(student.profilePhoto)} 
                        alt={student.fullName} 
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm group-hover:border-primary/20 transition-all"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm shrink-0 group-hover:border-primary/20 transition-all">
                        <UserCheck size={24} className="text-gray-300" />
                      </div>
                    )}
                      <div>
                        <h4 className="font-bold text-base text-text-main group-hover:text-primary transition-colors">{student.fullName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono font-medium text-text-muted bg-gray-100 px-2 py-0.5 rounded-md">{student.studentId}</span>
                          <span className="text-xs text-text-muted font-medium">{student.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full pl-16 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-black text-red-500">₹{student.monthlySubscription}</p>
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mt-0.5">
                          Due: {student.nextDueDate ? new Date(student.nextDueDate).toLocaleDateString('en-IN') : '—'}
                        </p>
                      </div>
                      <button 
                        onClick={() => navigate('/admin/notifications')}
                        className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Send notification"
                      >
                        <Bell size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          
          {/* Highlight: New Admissions */}
          <motion.div variants={itemVariants} className="glass p-6 rounded-3xl flex items-center gap-5 border-l-4 border-primary">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
              <UserPlus size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">New Admissions Today</p>
              <h3 className="text-4xl font-black text-text-main">{stats?.newAdmissionsToday || 0}</h3>
            </div>
          </motion.div>

          {/* Fee Status Distribution */}
          <motion.div variants={itemVariants} className="glass p-6 rounded-3xl space-y-6">
            <h3 className="font-extrabold text-text-main border-b border-gray-100 pb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Fee Distribution
            </h3>
            
            <div className="space-y-5">
              {/* Paid Status bar */}
              <div className="group">
                <div className="flex justify-between mb-2 text-xs font-bold">
                  <span className="text-green-600 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Paid Students</span>
                  <span className="text-text-main">{stats?.paidStudents || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80" 
                    style={{ width: stats?.totalStudents ? `${(stats.paidStudents / stats.totalStudents) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>

              {/* Pending Status bar */}
              <div className="group">
                <div className="flex justify-between mb-2 text-xs font-bold">
                  <span className="text-amber-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Pending Students</span>
                  <span className="text-text-main">{stats?.pendingStudents || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80" 
                    style={{ width: stats?.totalStudents ? `${(stats.pendingStudents / stats.totalStudents) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>

              {/* Due Status bar */}
              <div className="group">
                <div className="flex justify-between mb-2 text-xs font-bold">
                  <span className="text-red-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Due / Overdue</span>
                  <span className="text-text-main">{stats?.dueStudents || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80" 
                    style={{ width: stats?.totalStudents ? `${(stats.dueStudents / stats.totalStudents) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Secret PIN Modal for Today's Revenue */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl shadow-2xl p-6 w-full max-w-sm relative"
            >
              <button 
                onClick={() => setShowPinModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="text-center space-y-4 mb-6">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <Lock size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-text-main">Unlock Revenue</h3>
                  <p className="text-sm text-text-muted mt-1 font-medium">Enter your 4-digit Secret PIN</p>
                </div>
              </div>

              <form onSubmit={handleUnlockRevenue} className="space-y-4">
                <input 
                  type="password" 
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  maxLength={4}
                  required
                  placeholder="• • • •"
                  className="w-full text-center tracking-[1em] text-2xl font-bold p-4 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none transition-all bg-gray-50"
                  autoFocus
                />
                {pinError && <p className="text-xs text-red-500 font-bold text-center">{pinError}</p>}
                
                <button 
                  type="submit" 
                  disabled={pinInput.length < 4 || pinLoading}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {pinLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Verify & Unlock'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
