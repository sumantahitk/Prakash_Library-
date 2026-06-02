import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, CheckCircle, Clock, AlertCircle, CreditCard, History, Loader2, X, RotateCcw } from 'lucide-react';

const FEE_STATUS_COLORS = {
  PAID:    'bg-green-100 text-green-700 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DUE:     'bg-red-100 text-red-700 border-red-200',
};

const Payments = () => {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('ALL');
  
  // Revert Modal State
  const [showRevertModal, setShowRevertModal] = useState(null); // stores payment ID
  const [revertPin, setRevertPin] = useState('');

  // Load recent payment history
  useEffect(() => {
    axios.get('/payments').then(({ data }) => {
      setPayments(data);
    }).catch(() => {}).finally(() => setHistLoading(false));
  }, []);

  // Debounced search for students
  useEffect(() => {
    if (!search.trim()) { setResults([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/students?search=${search}&limit=8`);
        setResults(data.students || []);
        setShowDropdown(true);
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setPayAmount(student.remainingBalance > 0 ? student.remainingBalance : student.monthlySubscription);
    setNewStatus(student.feeStatus);
    setSearch(student.fullName);
    setShowDropdown(false);
    setResults([]);
  };

  const clearSelection = () => {
    setSelectedStudent(null);
    setSearch('');
    setPayAmount('');
    setNewStatus('');
  };

  // Record a real payment (mark as PAID or PARTIAL depending on amount)
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const { data } = await axios.post('/payments', {
        studentId: selectedStudent.id,
        paidAmount: payAmount,
        dueDate: selectedStudent.nextDueDate || new Date().toISOString(),
      });
      toast.success(data.message || `Payment of ₹${payAmount} recorded successfully`);
      const { data: fresh } = await axios.get('/payments');
      setPayments(fresh);
      clearSelection();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally { setLoading(false); }
  };

  // Just update fee status without recording a payment
  const handleStatusChange = async () => {
    if (!selectedStudent || !newStatus) return;
    setLoading(true);
    try {
      await axios.put(`/students/${selectedStudent.id}`, { feeStatus: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      clearSelection();
    } catch {
      toast.error('Failed to update status');
    } finally { setLoading(false); }
  };

  const handleRevertPayment = async (e) => {
    e.preventDefault();
    if (!revertPin) return;

    if (!window.confirm('EXTRA CONFIRMATION: Are you sure you want to revert this payment? This will record a refund and revert the student balance.')) return;
    
    setLoading(true);
    try {
      await axios.post(`/payments/${showRevertModal}/revert`, { secretPin: revertPin });
      toast.success('Payment reverted successfully');
      setShowRevertModal(null);
      setRevertPin('');
      const { data } = await axios.get('/payments');
      setPayments(data);
      if (selectedStudent) {
         clearSelection();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revert payment. Incorrect PIN?');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (historyFilter === 'ALL') return true;
    if (historyFilter === 'REFUND') return p.paidAmount < 0;
    return p.paymentStatus === historyFilter && p.paidAmount >= 0;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Fee Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Quick Action Panel ─────────────────── */}
        <div className="glass p-6 rounded-2xl space-y-5">
          <h2 className="font-bold text-text-main flex items-center gap-2">
            <CreditCard className="text-primary" size={20}/> Collect / Update Fee
          </h2>

          {/* Student Search */}
          <div className="relative">
            <label className="text-sm font-medium block mb-1">Search Student</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400 group-focus-within:text-primary transition-colors" size={18}/>
              </div>
              <input
                type="text"
                placeholder="Type student name, ID or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (!e.target.value) clearSelection(); }}
                className="w-full pl-10 pr-10 py-3 bg-surface/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-sm backdrop-blur-sm"
              />
              {search && (
                <button onClick={() => { setSearch(''); clearSelection(); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {showDropdown && results.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                {results.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectStudent(s)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-text-main text-sm">{s.fullName}</p>
                      <p className="text-xs text-text-muted">{s.studentId} · {s.phone}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${FEE_STATUS_COLORS[s.feeStatus]}`}>
                      {s.feeStatus}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Student Card */}
          {selectedStudent && (
            <div className="bg-gradient-premium/10 border border-primary/20 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-text-main">{selectedStudent.fullName}</p>
                  <p className="text-xs text-text-muted">{selectedStudent.studentId} · Monthly: ₹{selectedStudent.monthlySubscription}</p>
                  {selectedStudent.remainingBalance > 0 && (
                    <p className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1 inline-block">
                      Remaining Balance: ₹{selectedStudent.remainingBalance}
                    </p>
                  )}
                  <p className="text-xs text-text-muted mt-1">Next Due: {selectedStudent.nextDueDate ? new Date(selectedStudent.nextDueDate).toLocaleDateString('en-IN') : '—'}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${FEE_STATUS_COLORS[selectedStudent.feeStatus]}`}>
                  {selectedStudent.feeStatus}
                </span>
              </div>

              {/* Record Payment */}
              <div className="border-t border-primary/10 pt-4">
                {selectedStudent.feeStatus === 'PAID' && selectedStudent.remainingBalance <= 0 ? (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center justify-center">
                    <p className="text-sm font-bold text-green-800 flex items-center gap-1.5">✅ Already Paid for Current Cycle</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-text-main mb-2">Record Payment</p>
                    <form onSubmit={handleRecordPayment} className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-semibold">₹</span>
                        <input
                          type="number"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          required
                          className="w-full pl-7 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                        />
                      </div>
                      <button type="submit" disabled={loading}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Mark Paid'}
                      </button>
                    </form>
                  </>
                )}
              </div>

              <button onClick={clearSelection} className="text-xs text-text-muted hover:text-red-500 transition-colors">
                ✕ Clear selection
              </button>
            </div>
          )}
        </div>

        {/* ── Recent Payments History ──────────────── */}
        <div className="glass p-6 rounded-2xl flex flex-col h-full max-h-[700px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h2 className="font-bold text-text-main flex items-center gap-2 shrink-0">
              <History className="text-secondary" size={20}/> Recent Payment History
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar shrink-0">
              {['ALL', 'SUCCESS', 'PARTIAL', 'REFUND'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setHistoryFilter(filter)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all whitespace-nowrap ${
                    historyFilter === filter ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {filter.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {histLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3 border rounded-xl">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2"/>
                    <div className="h-3 bg-gray-100 rounded w-1/3"/>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"/>
                </div>
              ))
            ) : filteredPayments.length === 0 ? (
              <p className="text-center text-text-muted py-10">No payments found.</p>
            ) : (
              filteredPayments.map(p => {
                const ageInHours = (new Date() - new Date(p.paymentDate)) / (1000 * 60 * 60);
                const canUndo = ageInHours <= 24;
                return (
                <div key={p.id} className={`flex items-center justify-between p-3 border border-gray-100 rounded-xl transition-colors group ${p.paidAmount < 0 ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                  <div>
                    <p className="font-semibold text-text-main text-sm flex items-center gap-1.5 flex-wrap">
                      {p.student?.fullName}
                      {p.student?.studentId && (
                        <span className="text-[10px] font-mono bg-gray-100 text-text-muted border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">
                          {p.student.studentId}
                        </span>
                      )}
                      {p.student && p.student.isActive === false && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-bold shadow-sm">Deleted</span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right flex flex-col items-end">
                      <p className={`font-bold ${p.paidAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {p.paidAmount < 0 ? '-' : ''}₹{Math.abs(p.paidAmount)}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${
                        p.paymentStatus === 'SUCCESS' ? 'text-green-600 bg-green-50 border-green-200' :
                        p.paymentStatus === 'PARTIAL' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                        p.paymentStatus === 'PENDING' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                        'text-red-600 bg-red-50 border-red-200'
                      }`}>
                        {p.paidAmount < 0 ? 'REFUND' : p.paymentStatus}
                      </span>
                      {(p.isPartial || p.paidAmount < 0) && (
                        <p className={`text-[10px] font-semibold mt-0.5 ${p.paidAmount < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                          Remaining Bal: ₹{p.remainingBalance}
                        </p>
                      )}
                    </div>
                    {canUndo && p.paidAmount > 0 && p.paymentStatus !== 'FAILED' && (
                      <button
                        onClick={() => {
                          setShowRevertModal(p.id);
                          setRevertPin('');
                        }}
                        title="Revert this payment (Requires PIN)"
                        className="p-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 text-xs font-bold border border-red-200 hover:border-red-600 shrink-0"
                      >
                        <RotateCcw size={14} /> Revert
                      </button>
                    )}
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
        </div>

      {/* REVERT PIN MODAL */}
      {showRevertModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <RotateCcw size={32} />
              </div>
              <h3 className="text-xl font-bold text-red-600">Revert Transaction?</h3>
              <p className="text-sm text-red-500/80 font-medium mt-1">This will issue a refund.</p>
            </div>
            
            <form onSubmit={handleRevertPayment} className="p-6">
              <label className="block text-sm font-bold text-text-main mb-2">
                Enter Secret PIN to Continue
              </label>
              <input
                type="password"
                required
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={revertPin}
                onChange={(e) => setRevertPin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[1em] font-bold text-xl p-4 border-2 border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
              />
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRevertModal(null)}
                  className="py-3 px-4 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || revertPin.length !== 4}
                  className="py-3 px-4 font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payments;
