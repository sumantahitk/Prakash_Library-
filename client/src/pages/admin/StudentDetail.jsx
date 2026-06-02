import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, Edit2, Trash2, Calendar, Phone, Mail, MapPin, 
  CreditCard, User, Clock, CheckCircle, AlertCircle, Upload, Save, X, Bell, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FEE_STATUS_COLORS = {
  PAID:    'bg-green-100 text-green-700 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DUE:     'bg-red-100 text-red-700 border-red-200',
};

const FEE_STATUS_ICONS = {
  PAID:    <CheckCircle size={14} className="text-green-500" />,
  PENDING: <Clock size={14} className="text-yellow-500" />,
  DUE:     <AlertCircle size={14} className="text-red-500" />,
};

const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'payments', 'notifications'
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    aadhaarNo: '',
    monthlySubscription: '',
    feeStatus: '',
    nextDueDate: '',
    seatNo: '',
    slot: '',
  });
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef();

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/students/${id}`);
      setStudent(data);
      setForm({
        fullName: data.fullName,
        email: data.user?.email || '',
        phone: data.phone,
        address: data.address || '',
        aadhaarNo: data.aadhaarNo || '',
        monthlySubscription: data.monthlySubscription,
        feeStatus: data.feeStatus,
        nextDueDate: data.nextDueDate ? data.nextDueDate.split('T')[0] : '',
        seatNo: data.seatNo || '',
        slot: data.slot || '4',
      });
      setPhotoPreview(data.profilePhoto ? getPhotoUrl(data.profilePhoto) : null);
    } catch (error) {
      toast.error('Failed to load student details');
      navigate('/admin/students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Frontend Validation
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      return toast.error('Phone number must be exactly 10 digits.');
    }
    if (form.aadhaarNo && !/^\d{12}$/.test(form.aadhaarNo)) {
      return toast.error('Aadhaar number must be exactly 12 digits.');
    }
    if (form.seatNo && Number(form.seatNo) <= 0) {
      return toast.error('Seat number must be a positive number.');
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('profilePhoto', photoFile);
      
      const { data } = await axios.put(`/students/${id}`, fd);
      
      toast.success('Student records updated successfully!');
      setEditMode(false);
      setPhotoFile(null);
      // reload full profile
      fetchStudentDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setDeletePin('');
  };

  const confirmDelete = async () => {
    if (!deletePin || deletePin.length !== 4) {
      toast.error('Please enter a valid 4-digit PIN');
      return;
    }
    
    if (!window.confirm('EXTRA CONFIRMATION: Are you absolutely sure you want to delete this student and all their records? This action cannot be undone.')) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/students/${id}`, {
        headers: { 'x-revenue-pin': deletePin }
      });
      toast.success('Student removed successfully');
      navigate('/admin/students');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-muted animate-pulse font-medium">Loading student details...</p>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button 
          onClick={() => navigate('/admin/students')}
          className="flex items-center gap-2 text-text-muted hover:text-text-main font-semibold text-sm transition-colors w-fit"
        >
          <ArrowLeft size={16} /> Back to Students list
        </button>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <>
              <button 
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-gradient-premium text-white font-bold text-xs rounded-xl shadow hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                <Edit2 size={14} /> Edit Profile
              </button>
              <button 
                onClick={handleDeleteClick}
                className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete Student
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => { setEditMode(false); setPhotoPreview(student.profilePhoto ? getPhotoUrl(student.profilePhoto) : null); setPhotoFile(null); }}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-text-muted font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <X size={14} /> Cancel
              </button>
              <button 
                form="detail-edit-form"
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-xs rounded-xl shadow disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main details display grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Card Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl flex flex-col items-center text-center space-y-4 relative overflow-hidden border border-white/60">
            {/* Background premium decoration */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
            <div className="absolute left-0 bottom-0 w-24 h-24 bg-secondary/5 rounded-full blur-xl"></div>

            <div className="relative cursor-pointer group" onClick={() => editMode && fileRef.current?.click()}>
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="" 
                  className={`w-32 h-32 rounded-3xl object-cover border-4 transition-all duration-300 shadow-md ${
                    editMode ? 'border-primary/50 group-hover:opacity-75' : 'border-white'
                  }`}
                />
              ) : (
                <div className={`w-32 h-32 rounded-3xl bg-gray-200 text-gray-400 overflow-hidden flex items-center justify-center border-4 transition-all duration-300 shadow-md ${
                  editMode ? 'border-primary/50 group-hover:opacity-75' : 'border-white'
                }`}>
                  <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              )}
              {editMode && (
                <div className="absolute inset-0 rounded-3xl bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={24} />
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="space-y-1 z-10">
              <h2 className="text-xl font-extrabold text-text-main tracking-tight">{student.fullName}</h2>
              <p className="text-xs font-mono text-text-muted">{student.studentId}</p>
            </div>

            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-xs font-bold shadow-sm z-10 bg-white">
              {FEE_STATUS_ICONS[student.feeStatus]}
              <span className={`text-[11px] uppercase ${
                student.feeStatus === 'PAID' ? 'text-green-600' :
                student.feeStatus === 'PENDING' ? 'text-yellow-600' :
                'text-red-600'
              }`}>{student.feeStatus}</span>
            </div>

            <div className="w-full border-t border-gray-100 pt-4 space-y-3 text-left text-xs z-10">
              <div className="flex justify-between">
                <span className="text-text-muted font-medium">Join Date:</span>
                <span className="font-semibold text-text-main">
                  {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-IN') : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted font-medium">Monthly Fee:</span>
                <span className="font-semibold text-text-main">₹{student.monthlySubscription}</span>
              </div>
              {student.remainingBalance > 0 && (
                <div className="flex justify-between items-center bg-amber-50 border border-amber-100 px-2 py-1.5 rounded-lg">
                  <span className="text-amber-800 font-bold">Owes Balance:</span>
                  <span className="font-extrabold text-amber-800">₹{student.remainingBalance}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Tabs and Information views */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl overflow-hidden border border-white/60 flex flex-col min-h-[450px]">
            {/* Tabs Selector Navigation */}
            <div className="flex bg-gray-50/50 border-b border-gray-100 px-4 pt-3 gap-2 shrink-0">
              {[
                { id: 'details', label: 'Details Profile', count: null },
                { id: 'payments', label: 'Payments list', count: student.payments?.length },
                { id: 'notifications', label: 'Alert logs', count: student.notifications?.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={editMode}
                  className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-t border-x -mb-[-1px] ${
                    activeTab === tab.id
                      ? 'bg-white border-gray-200 text-primary border-b-white z-10'
                      : 'border-transparent text-text-muted hover:text-text-main hover:bg-gray-100/50 disabled:opacity-50'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="text-[10px] bg-gray-100 text-text-muted px-1.5 py-0.5 rounded-full font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content view area */}
            <div className="p-6 flex-1 bg-white">
              {!editMode ? (
                <AnimatePresence mode="wait">
                  {/* DETAILS TAB */}
                  {activeTab === 'details' && (
                    <motion.div 
                      key="details-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Identity & Contact</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <CreditCard size={16} className="text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-text-muted font-medium">Student ID Number</p>
                              <p className="text-sm font-bold text-text-main">{student.studentId}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <User size={16} className="text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-text-muted font-medium">Aadhaar Identification</p>
                              <p className="text-sm font-bold text-text-main">{student.aadhaarNo || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Mail size={16} className="text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-text-muted font-medium">Email Address</p>
                              <p className="text-sm font-bold text-text-main">{student.user?.email || 'No email registered'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Phone size={16} className="text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-text-muted font-medium">Phone Number</p>
                              <p className="text-sm font-bold text-text-main">{student.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <MapPin size={16} className="text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-text-muted font-medium">Address</p>
                              <p className="text-sm font-bold text-text-main">{student.address || 'No address specified'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Facility & Subscription</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Calendar size={16} className="text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-text-muted font-medium">Next Billing Due Date</p>
                              <p className="text-sm font-bold text-text-main">
                                {student.nextDueDate ? new Date(student.nextDueDate).toLocaleDateString('en-IN') : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <MapPin size={16} className="text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-text-muted font-medium">Seat Number</p>
                              <p className="text-sm font-bold text-text-main">{student.seatNo || 'Unassigned'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Clock size={16} className="text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-text-muted font-medium">Time Slot</p>
                              <p className="text-sm font-bold text-text-main">{student.slot ? `${student.slot} Hours` : '4 Hours'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <CreditCard size={16} className="text-primary shrink-0" />
                            <div>
                              <p className="text-[10px] text-text-muted font-medium">Payment Outstanding Status</p>
                              <span className={`inline-block text-xs font-extrabold mt-1 px-2.5 py-0.5 rounded-full border ${FEE_STATUS_COLORS[student.feeStatus]}`}>
                                {student.feeStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* PAYMENTS TAB */}
                  {activeTab === 'payments' && (
                    <motion.div 
                      key="payments-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Transaction History</h3>
                      {student.payments?.length === 0 ? (
                        <div className="text-center py-10">
                          <CreditCard size={32} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-xs text-text-muted">No transaction receipts recorded.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {student.payments.map(p => (
                            <div key={p.id} className={`flex justify-between items-center p-3 border border-gray-100 rounded-xl transition-colors ${p.paidAmount < 0 ? 'bg-red-50/50' : 'hover:bg-gray-50/50'}`}>
                              <div>
                                <p className={`font-bold text-sm ${p.paidAmount < 0 ? 'text-red-600' : 'text-text-main'}`}>
                                  {p.paidAmount < 0 ? '-' : ''}₹{Math.abs(p.paidAmount)}
                                </p>
                                <p className="text-[10px] text-text-muted">
                                  Paid: {p.paymentDate ? new Date(p.paymentDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                </p>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                  p.paymentStatus === 'SUCCESS' ? 'text-green-700 bg-green-50 border-green-200' :
                                  p.paymentStatus === 'PARTIAL' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                                  p.paymentStatus === 'PENDING' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
                                  'text-red-700 bg-red-50 border-red-200'
                                }`}>{p.paidAmount < 0 ? 'REFUND' : p.paymentStatus}</span>
                                {(p.isPartial || p.paidAmount < 0) && (
                                  <span className={`text-[10px] font-semibold mt-0.5 ${p.paidAmount < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                                    Remaining Bal: ₹{p.remainingBalance}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* NOTIFICATIONS TAB */}
                  {activeTab === 'notifications' && (
                    <motion.div 
                      key="notifications-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Alert Log (Last 5 Alerts)</h3>
                      {student.notifications?.length === 0 ? (
                        <div className="text-center py-10">
                          <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-xs text-text-muted">No notifications sent yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {student.notifications.map(n => (
                            <div key={n.id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors space-y-1.5">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">{n.type}</span>
                                <span className="text-text-muted">{n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN') : '—'}</span>
                              </div>
                              <p className="text-xs text-text-main font-medium leading-relaxed">{n.message}</p>
                              <div className="flex items-center gap-4 text-[10px] text-text-muted border-t border-gray-50 pt-1.5 mt-1">
                                <span>Method: <strong className="text-text-main">{n.deliveryMethod}</strong></span>
                                <span>Status: <strong className={n.sentStatus === 'SUCCESS' ? 'text-green-600' : 'text-red-500'}>{n.sentStatus}</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                /* INLINE EDIT FORM */
                <form id="detail-edit-form" onSubmit={handleSave} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="font-extrabold text-sm text-text-main uppercase tracking-wider">Update Student Profile</h3>
                    <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">Edit Mode</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1">Full Name</label>
                      <input 
                        type="text" 
                        name="fullName" 
                        value={form.fullName} 
                        onChange={handleChange} 
                        required
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1">Email Address</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={form.email} 
                        onChange={handleChange} 
                        required
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1">Phone Number (Passcode)</label>
                      <input 
                        type="text" 
                        name="phone" 
                        value={form.phone} 
                        onChange={handleChange} 
                        required
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1">Aadhaar Card No.</label>
                      <input 
                        type="text" 
                        name="aadhaarNo" 
                        value={form.aadhaarNo} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1">Seat Number</label>
                      <input 
                        type="text" 
                        name="seatNo" 
                        value={form.seatNo} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1">Time Slot</label>
                      <select 
                        name="slot" 
                        value={form.slot} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-semibold bg-white"
                      >
                        <option value="4">4 Hours</option>
                        <option value="8">8 Hours</option>
                        <option value="12">12 Hours</option>
                        <option value="24">24 Hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1">Monthly Fee (₹)</label>
                      <input 
                        type="number" 
                        name="monthlySubscription" 
                        value={form.monthlySubscription} 
                        onChange={handleChange} 
                        required
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-muted block mb-1">Next Due Date</label>
                      <input 
                        type="date" 
                        name="nextDueDate" 
                        value={form.nextDueDate} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-semibold"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-text-muted block mb-1">Address Detail</label>
                      <input 
                        type="text" 
                        name="address" 
                        value={form.address} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-semibold"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-text-muted block mb-2">Billing Fee Status</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['PAID', 'PENDING', 'DUE'].map(s => (
                          <button 
                            type="button" 
                            key={s}
                            onClick={() => setForm({ ...form, feeStatus: s })}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              form.feeStatus === s
                                ? s === 'PAID' ? 'bg-green-500 text-white border-green-500 shadow-sm'
                                  : s === 'DUE' ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                  : 'bg-yellow-400 text-white border-yellow-400 shadow-sm'
                                : 'bg-gray-50 text-text-muted border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-main">Delete Student?</h3>
              <p className="text-sm text-text-muted">
                This will hide the student from your main lists but keep their payment history intact. 
                <br/><strong className="text-red-500">Requires Secret PIN.</strong>
              </p>
              
              <input 
                type="password" 
                maxLength="4"
                placeholder="Enter 4-digit PIN"
                value={deletePin}
                onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[1em] font-mono text-2xl p-4 border-2 border-red-100 rounded-xl focus:border-red-500 focus:ring-0 outline-none bg-red-50/30"
              />

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-text-main font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting || deletePin.length !== 4}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <span className="animate-pulse">Deleting...</span> : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDetail;
