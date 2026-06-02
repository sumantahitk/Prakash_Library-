import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Lock, Unlock, DollarSign, TrendingUp, Calendar, CreditCard, 
  RefreshCw, Users, AlertCircle, ChevronRight 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, colorClass, gradient }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass p-6 rounded-2xl flex items-center justify-between border-l-4 ${colorClass} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
  >
    <div>
      <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold text-text-main">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${gradient} shadow-md`}>
      <Icon size={24} />
    </div>
  </motion.div>
);

const Revenue = () => {
  const [pin, setPin] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Try automatic authentication if PIN is saved in sessionStorage
  useEffect(() => {
    if (isAuthorized) handleRefresh();
  }, [historyFilter]);

  useEffect(() => {
    const savedPin = sessionStorage.getItem('revenue_pin');
    if (savedPin) {
      verifyPin(savedPin);
    }
  }, []);

  const verifyPin = async (enteredPin) => {
    setLoading(true);
    try {
      const response = await axios.get('/payments/revenue', {
        headers: { 'x-revenue-pin': enteredPin }
      });
      setData(response.data);
      setIsAuthorized(true);
      sessionStorage.setItem('revenue_pin', enteredPin);
      toast.success('Access Granted');
    } catch (error) {
      console.error(error);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin('');
      sessionStorage.removeItem('revenue_pin');
      toast.error(error.response?.data?.message || 'Access Denied: Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num) => {
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleLock = () => {
    sessionStorage.removeItem('revenue_pin');
    setIsAuthorized(false);
    setData(null);
    setPin('');
    toast.success('Revenue panel locked');
  };

  const handleRefresh = async () => {
    const savedPin = sessionStorage.getItem('revenue_pin');
    if (savedPin) {
      setLoading(true);
      try {
        const response = await axios.get(`/payments/revenue?filter=${historyFilter}`, {
          headers: { 'x-revenue-pin': savedPin }
        });
        setData(response.data);
        toast.success('Data refreshed');
      } catch (err) {
        toast.error('Failed to refresh data');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadReport = async () => {
    const savedPin = sessionStorage.getItem('revenue_pin');
    if (!savedPin) return;

    setIsDownloadingCsv(true);
    try {
      const response = await axios.get(`/payments/monthly-report?month=${reportMonth}&year=${reportYear}`, {
        headers: { 'x-revenue-pin': savedPin }
      });
      
      const payments = response.data;
      if (payments.length === 0) {
        toast.error('No transactions found for this month.');
        setIsDownloadingCsv(false);
        return;
      }

      // Convert to CSV
      const headers = ['Date', 'Student Name', 'Student ID', 'Phone', 'Paid Amount', 'Status', 'Remaining Balance'];
      const csvRows = payments.map(p => {
        const date = new Date(p.paymentDate).toLocaleString('en-IN');
        return `"${date}","${p.student?.fullName || 'N/A'}","${p.student?.studentId || 'N/A'}","${p.student?.phone || 'N/A'}","${p.paidAmount}","${p.paymentStatus}","${p.remainingBalance}"`;
      });
      
      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Prakash_Revenue_Report_${reportMonth}_${reportYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report downloaded!');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const handleDownloadPDF = async () => {
    const savedPin = sessionStorage.getItem('revenue_pin');
    if (!savedPin) return;

    setIsDownloadingPdf(true);
    try {
      const response = await axios.get(`/payments/monthly-report?month=${reportMonth}&year=${reportYear}`, {
        headers: { 'x-revenue-pin': savedPin }
      });
      
      const payments = response.data;
      if (payments.length === 0) {
        toast.error('No transactions found for this month.');
        setIsDownloadingPdf(false);
        return;
      }

      const doc = new jsPDF();
      doc.text(`Prakash Library - Revenue Report (${reportMonth}/${reportYear})`, 14, 15);

      const tableColumn = ["Date", "Student Name", "Student ID", "Phone", "Amount", "Status"];
      const tableRows = [];

      payments.forEach(p => {
        const date = new Date(p.paymentDate).toLocaleString('en-IN');
        const rowData = [
          date,
          p.student?.fullName || 'N/A',
          p.student?.studentId || 'N/A',
          p.student?.phone || 'N/A',
          `Rs ${p.paidAmount}`,
          p.paymentStatus
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246] } // theme primary color
      });

      doc.save(`Prakash_Revenue_Report_${reportMonth}_${reportYear}.pdf`);
      toast.success('PDF downloaded!');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // PIN Gate Screen
  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-3xl max-w-md w-full border border-gray-200/50 shadow-2xl relative overflow-hidden text-center"
        >
          {/* Decorative background shapes */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>

          <div className="relative z-10 space-y-6">
            {/* Lock Icon */}
            <div className="mx-auto w-16 h-16 bg-gradient-premium rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Lock size={28} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-text-main">Private Financial Panel</h2>
              <p className="text-xs text-text-muted max-w-xs mx-auto">
                Authentication required. Enter the 4-digit secret PIN.
              </p>
            </div>

            {/* PIN Code Dots Indicator */}
            <motion.div 
              animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-4 py-2"
            >
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-4.5 h-4.5 rounded-full border-2 transition-all duration-200 ${
                    i < pin.length 
                      ? 'bg-gradient-premium border-transparent scale-110 shadow-sm' 
                      : 'border-gray-300 bg-transparent'
                  }`}
                />
              ))}
            </motion.div>

            {/* Virtual Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  disabled={loading}
                  className="w-16 h-16 rounded-2xl glass hover:bg-gradient-premium hover:text-white transition-all text-lg font-bold text-text-main flex items-center justify-center active:scale-95 shadow-sm border border-gray-100 disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="w-16 h-16 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center active:scale-95"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress(0)}
                disabled={loading}
                className="w-16 h-16 rounded-2xl glass hover:bg-gradient-premium hover:text-white transition-all text-lg font-bold text-text-main flex items-center justify-center active:scale-95 shadow-sm border border-gray-100 disabled:opacity-50"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={loading}
                className="w-16 h-16 rounded-2xl text-xs font-bold text-text-muted hover:bg-gray-100 transition-colors flex items-center justify-center active:scale-95"
              >
                DELETE
              </button>
            </div>

            {loading && (
              <div className="text-xs text-primary font-semibold flex items-center justify-center gap-1.5 animate-pulse mt-2">
                <RefreshCw size={12} className="animate-spin" /> Verifying...
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Loaded Dashboard Screen
  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
            <Unlock className="text-green-500" size={24} />
            Private Revenue Board
          </h1>
          <p className="text-xs text-text-muted mt-0.5">Sensitive financial analytics & charts</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-text-main rounded-xl transition-all"
            title="Refresh statistics"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleLock}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <Lock size={14} /> Lock Dashboard
          </button>
        </div>
      </div>

      {/* Financial Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Revenue" 
          value={`₹${data?.todayRevenue || 0}`} 
          icon={CreditCard} 
          colorClass="border-blue-500"
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard 
          title="This Month's Revenue" 
          value={`₹${data?.monthlyRevenue || 0}`} 
          icon={Calendar} 
          colorClass="border-amber-500"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard 
          title="Total Lifetime Revenue" 
          value={`₹${data?.totalRevenue || 0}`} 
          icon={DollarSign} 
          colorClass="border-green-500"
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard 
          title="Partial Payment Records" 
          value={data?.partialPayments || 0} 
          icon={AlertCircle} 
          colorClass="border-purple-500"
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
        />
      </div>

      {/* Main Grid: Revenue Charts & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Graph */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass p-6 rounded-2xl space-y-4"
        >
          <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Monthly Revenue Growth
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthlyChart || []}>
                <defs>
                  <linearGradient id="colorRevenuePrivate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenuePrivate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Detailed Breakdown Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-2xl space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-text-main border-b border-gray-100 pb-3">
              Partial Payments
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Prakash Library's partial payment system allows students to split their monthly fees (e.g. pay ₹100 instead of ₹500 subscription and pay the remaining balance later).
            </p>
            <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle size={18} />
                <span className="font-bold text-xs">Financial Note</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                When a student registers a partial payment, their status is set to PENDING and their remaining balance is tracked. Only when the full remaining balance is paid does their status change to PAID and their due date advance.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
              <span className="text-text-muted font-medium">Total Transactions:</span>
              <span className="font-bold text-text-main">{data?.totalPayments || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg">
              <span className="text-text-muted font-medium">Average Paid Value:</span>
              <span className="font-bold text-green-600">₹{data?.averagePayment || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2 bg-amber-50 border border-amber-200/50 rounded-lg">
              <span className="text-amber-800 font-bold">Outstanding Dues:</span>
              <span className="font-extrabold text-amber-800">₹{data?.totalOutstanding || 0}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass p-6 rounded-2xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4">
          <h3 className="text-lg font-bold text-text-main">Recent Financial Transactions</h3>
          <select 
            value={historyFilter} 
            onChange={(e) => setHistoryFilter(e.target.value)}
            className="p-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm"
          >
            <option value="">Default (Last 10)</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-150 text-text-muted pb-2">
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Student</th>
                <th className="py-2.5 text-center">Account Status</th>
                <th className="py-2.5">Paid Amount</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Outstanding Bal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.recentTransactions && data.recentTransactions.map(t => (
                <tr key={t.id} className="text-text-main hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 font-medium">
                    {t.paymentDate ? new Date(t.paymentDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </td>
                  <td className="py-3">
                    <p className="font-bold flex items-center gap-1.5 flex-wrap">
                      {t.student?.fullName}
                      {t.student?.studentId && (
                        <span className="text-[10px] text-text-muted font-mono bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-200">
                          {t.student.studentId}
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="py-3 text-center">
                    {t.student && t.student.isActive !== false ? (
                      <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full font-bold">Active</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full font-bold">Deleted</span>
                    )}
                  </td>
                  <td className="py-3 font-extrabold text-green-600">
                    ₹{t.paidAmount}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${
                      t.paymentStatus === 'SUCCESS' ? 'text-green-600 bg-green-50 border-green-200' :
                      t.paymentStatus === 'PARTIAL' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                      t.paymentStatus === 'PENDING' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                      'text-red-600 bg-red-50 border-red-200'
                    }`}>
                      {t.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-text-muted">
                    {t.isPartial ? `₹${t.remainingBalance}` : '—'}
                  </td>
                </tr>
              ))}
              {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-text-muted">No transactions logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Monthly Report Generator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass p-6 rounded-2xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
          <div>
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              Monthly Transaction Report
            </h3>
            <p className="text-xs text-text-muted mt-1">Export detailed payment history for accounting</p>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <select 
              value={reportMonth} 
              onChange={e => setReportMonth(e.target.value)}
              className="bg-transparent font-bold text-sm outline-none text-text-main cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('en-IN', { month: 'long' })}</option>
              ))}
            </select>
            <select 
              value={reportYear} 
              onChange={e => setReportYear(e.target.value)}
              className="bg-transparent font-bold text-sm outline-none text-text-main cursor-pointer border-l border-gray-300 pl-3"
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleDownloadReport}
                disabled={isDownloadingCsv || isDownloadingPdf}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-50"
              >
                {isDownloadingCsv ? 'Generating...' : 'Download CSV'}
              </button>
              
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloadingCsv || isDownloadingPdf}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-50"
              >
                {isDownloadingPdf ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Revenue;
