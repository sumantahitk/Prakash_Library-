import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, Plus, Trash2, X, Upload, Calendar, Phone, Mail, MapPin, CreditCard, User, Clock, CheckCircle, AlertCircle, Edit2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FEE_STATUS_COLORS = {
  PAID:    'bg-green-100 text-green-700 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DUE:     'bg-red-100 text-red-700 border-red-200',
};
const FEE_STATUS_ICONS = {
  PAID:    <CheckCircle size={12} className="text-green-500" />,
  PENDING: <Clock size={12} className="text-yellow-500" />,
  DUE:     <AlertCircle size={12} className="text-red-500" />,
};

const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `http://localhost:5000${path}`;
};

// ─── Student Card ──────────────────────────────────────────────────────────────
const StudentCard = ({ student, onClick }) => (
  <motion.div
    whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(79,70,229,0.15)' }}
    onClick={onClick}
    className="glass rounded-2xl p-5 cursor-pointer border border-white/60 flex flex-col items-center text-center space-y-3 transition-all"
  >
    {student.profilePhoto ? (
      <img src={getPhotoUrl(student.profilePhoto)} alt="" className="w-28 h-28 rounded-2xl object-cover border border-gray-150 shadow-sm" />
    ) : (
      <div className="w-28 h-28 rounded-2xl bg-gray-200 text-gray-400 overflow-hidden flex items-center justify-center border border-gray-300 shadow-sm">
        <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
    )}
    <div>
      <p className="font-bold text-text-main leading-tight">{student.fullName}</p>
      <p className="text-xs text-text-muted font-mono mt-0.5">{student.studentId}</p>
    </div>
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${FEE_STATUS_COLORS[student.feeStatus]}`}>
      {FEE_STATUS_ICONS[student.feeStatus]} {student.feeStatus}
    </span>
  </motion.div>
);

// ─── Add Student Modal ─────────────────────────────────────────────────────────

const generateFrontendId = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const num = Math.floor(1001 + Math.random() * 8998);
  const char1 = letters[Math.floor(Math.random() * letters.length)];
  const char2 = letters[Math.floor(Math.random() * letters.length)];
  return `${num}${char1}${char2}`;
};

const AddStudentModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    studentId: generateFrontendId(),
    fullName: '', email: '', phone: '', address: '', aadhaarNo: '',
    seatNo: '', slot: '4',
    admissionDate: new Date().toISOString().split('T')[0],
    monthlySubscription: '', nextDueDate: '',
  });

  useEffect(() => {
    axios.get('/settings')
      .then(({ data }) => {
        if (data.defaultSubscription) {
          setForm(f => ({ ...f, monthlySubscription: data.defaultSubscription }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend Validation
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return toast.error('Please enter a valid email address.');
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      return toast.error('Phone number must be exactly 10 digits.');
    }
    if (form.aadhaarNo && !/^\d{12}$/.test(form.aadhaarNo)) {
      return toast.error('Aadhaar number must be exactly 12 digits.');
    }
    if (form.seatNo && Number(form.seatNo) <= 0) {
      return toast.error('Seat number must be a positive number.');
    }

    setIsSubmitting(true);
    try {
      await axios.post('/students', form);
      toast.success('Student added!');
      onSaved(); onClose();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Error'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 bg-gradient-premium text-white">
          <h2 className="text-lg font-bold flex items-center gap-2"><Plus size={20}/> Add New Student</h2>
          <button onClick={onClose}><X size={22}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name:'studentId', label:'Student ID', type:'text', readOnly:true },
              { name:'fullName',  label:'Full Name *', type:'text' },
              { name:'email',     label:'Email *', type:'email' },
              { name:'phone',     label:'Phone * (default password)', type:'text' },
              { name:'aadhaarNo', label:'Aadhaar Number', type:'text' },
              { name:'seatNo',    label:'Seat Number', type:'text' },
              { name:'admissionDate', label:'Admission Date', type:'date' },
              { name:'monthlySubscription', label:'Monthly Fee (₹) *', type:'number' },
              { name:'nextDueDate', label:'Next Due Date (auto if blank)', type:'date' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium mb-1">{f.label}</label>
                <input
                  type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                  readOnly={f.readOnly} required={f.label.includes('*')}
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm ${f.readOnly ? 'bg-gray-50 text-text-muted' : ''}`}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1">Time Slot</label>
              <select name="slot" value={form.slot} onChange={handleChange} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm bg-white">
                <option value="4">4 Hours</option>
                <option value="8">8 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <input type="text" name="address" value={form.address} onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm" />
            </div>
          </div>
          <p className="mt-4 text-xs text-text-muted bg-blue-50 border border-blue-100 rounded-lg p-3">
            💡 Next Due Date auto-sets to <strong>1 month from Admission Date</strong> if left blank. Default student password = phone number.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border rounded-xl hover:bg-gray-50 text-text-muted">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-gradient-premium text-white rounded-xl font-semibold hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Add Student'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Students Page ────────────────────────────────────────────────────────
const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feeFilter, setFeeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search, page, limit: 12 });
      if (feeFilter) params.append('feeStatus', feeFilter);
      const { data } = await axios.get(`/students?${params}`);
      setStudents(data.students || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to fetch students'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchStudents, 400);
    return () => clearTimeout(t);
  }, [search, feeFilter, page]);

  const openDetail = (student) => {
    navigate(`/admin/students/${student.id}`);
  };

  const FILTERS = [
    { label: 'All', value: '' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Due', value: 'DUE' },
  ];

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Students</h1>
          <p className="text-sm text-text-muted">{total} students enrolled</p>
        </div>
        <button onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-gradient-premium text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 font-semibold">
          <Plus size={20}/> Add Student
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400 group-focus-within:text-primary transition-colors" size={18}/>
          </div>
          <input type="text" placeholder="Search by name, ID, phone or email..."
            className="w-full pl-10 pr-10 py-2.5 bg-surface/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-sm backdrop-blur-sm"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button key={f.value}
              onClick={() => { setFeeFilter(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                feeFilter === f.value
                  ? 'bg-gradient-premium text-white border-transparent shadow-md'
                  : 'bg-surface text-text-muted border-gray-200 hover:border-primary/50'
              }`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-200"/>
              <div className="h-4 bg-gray-200 rounded w-3/4"/>
              <div className="h-3 bg-gray-100 rounded w-1/2"/>
              <div className="h-5 bg-gray-100 rounded-full w-2/3"/>
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <User size={48} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-text-muted font-medium">No students found</p>
          <p className="text-sm text-text-muted">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {students.map(student => (
            <StudentCard key={student.id} student={student} onClick={() => openDetail(student)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <p className="text-sm text-text-muted">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p-1)}
              className="px-4 py-2 border rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p+1)}
              className="px-4 py-2 bg-gradient-premium text-white rounded-xl text-sm disabled:opacity-40 hover:opacity-90">Next</button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAddOpen && <AddStudentModal onClose={() => setIsAddOpen(false)} onSaved={fetchStudents} />}
      </AnimatePresence>
    </div>
  );
};

export default Students;
