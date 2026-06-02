import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Send, Mail, MessageSquare, Search, Users, CheckCircle, X } from 'lucide-react';

const AUDIENCE_FILTERS = [
  { label: 'All Students',   value: '',        icon: '👥' },
  { label: 'Due Students',   value: 'DUE',     icon: '⚠️' },
  { label: 'Pending',        value: 'PENDING', icon: '⏳' },
  { label: 'Paid',           value: 'PAID',    icon: '✅' },
];

const Notifications = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [displayedStudents, setDisplayedStudents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [audienceFilter, setAudienceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [method, setMethod] = useState('EMAIL');
  const [sending, setSending] = useState(false);

  // Fetch full student list (up to 200)
  useEffect(() => {
    const fetch = async () => {
      try {
        const params = new URLSearchParams({ limit: 200 });
        if (audienceFilter) params.append('feeStatus', audienceFilter);
        const { data } = await axios.get(`/students?${params}`);
        const students = data.students || [];
        setAllStudents(students);
        setDisplayedStudents(students);
        // Auto-select all when filter changes
        setSelected(new Set(students.map(s => s.id)));
      } catch { }
    };
    fetch();
  }, [audienceFilter]);

  // Local search filter on top of already-fetched list
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    if (!q) { setDisplayedStudents(allStudents); return; }
    setDisplayedStudents(allStudents.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      (s.user?.email || '').toLowerCase().includes(q)
    ));
  }, [searchQuery, allStudents]);

  const toggleStudent = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === displayedStudents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(displayedStudents.map(s => s.id)));
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (selected.size === 0) return toast.error('Select at least one student');
    setSending(true);
    try {
      await axios.post('/notifications/send', {
        studentIds: [...selected],
        subject,
        message,
        type: 'MANUAL',
        method,
      });
      toast.success(`Notification sent to ${selected.size} student${selected.size > 1 ? 's' : ''}!`);
      setSubject('');
      setMessage('');
    } catch { toast.error('Failed to send notifications'); }
    finally { setSending(false); }
  };

  const METHODS = [
    { value: 'EMAIL',     label: 'Email',     icon: <Mail size={16}/>,           color: 'border-blue-300 text-blue-600 bg-blue-50' },
    { value: 'WHATSAPP',  label: 'WhatsApp',  icon: <MessageSquare size={16}/>,  color: 'border-green-300 text-green-600 bg-green-50' },
    { value: 'BOTH',      label: 'Both',      icon: <Send size={16}/>,            color: 'border-purple-300 text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Send Notifications</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── LEFT: Audience Selector ───────────────── */}
        <div className="lg:col-span-2 glass p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-text-main flex items-center gap-2">
              <Users size={18} className="text-secondary"/> Select Audience
            </h2>
            <span className="text-sm bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">
              {selected.size} selected
            </span>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setAudienceFilter(f.value); setSearchQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  audienceFilter === f.value
                    ? 'bg-gradient-premium text-white border-transparent shadow-md'
                    : 'bg-surface text-text-muted border-gray-200 hover:border-primary/40'
                }`}
              >
                <span>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>

          {/* Search inside the list */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400 group-focus-within:text-primary transition-colors" size={16}/>
            </div>
            <input 
              type="text" 
              placeholder="Search student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-surface/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-sm backdrop-blur-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Select All Row */}
          <label className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
            <input
              type="checkbox"
              checked={selected.size === displayedStudents.length && displayedStudents.length > 0}
              onChange={toggleAll}
              className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
            />
            <div>
              <p className="font-semibold text-text-main text-sm">Select All ({displayedStudents.length})</p>
              <p className="text-xs text-text-muted">
                {audienceFilter ? `Filtered: ${audienceFilter}` : 'All enrolled students'}
              </p>
            </div>
          </label>

          {/* Student Checklist */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {displayedStudents.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-6">No students match your filter.</p>
            ) : (
              displayedStudents.map(s => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    selected.has(s.id) ? 'border-primary/30 bg-primary/5' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main truncate">{s.fullName}</p>
                    <p className="text-xs text-text-muted">{s.studentId}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    s.feeStatus === 'PAID' ? 'bg-green-100 text-green-600'
                    : s.feeStatus === 'DUE' ? 'bg-red-100 text-red-600'
                    : 'bg-yellow-100 text-yellow-600'
                  }`}>{s.feeStatus}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: Compose Message ──────────────────── */}
        <div className="lg:col-span-3 glass p-6 rounded-2xl space-y-5">
          <h2 className="font-bold text-text-main flex items-center gap-2">
            <Send size={18} className="text-primary"/> Compose Message
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Subject */}
            <div>
              <label className="text-sm font-medium block mb-1">Subject (for Email)</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Library Holiday Notice — Prakash Library"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium block mb-1">Message</label>
              <textarea
                required
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm resize-none"
              />
              <p className="text-xs text-text-muted mt-1">You can use {'{name}'} to personalise with student names.</p>
            </div>

            {/* Delivery Method */}
            <div>
              <label className="text-sm font-medium block mb-2">Delivery Method</label>
              <div className="flex gap-3">
                {METHODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      method === m.value
                        ? `${m.color} border-current shadow-sm`
                        : 'bg-gray-50 text-text-muted border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary before send */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle size={18} className="text-green-500 shrink-0"/>
                <p className="text-sm text-green-700">
                  Ready to send to <strong>{selected.size}</strong> student{selected.size > 1 ? 's' : ''} via <strong>{method === 'BOTH' ? 'Email + WhatsApp' : method}</strong>.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || selected.size === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-premium text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            >
              {sending ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Sending...</span>
              ) : (
                <><Send size={18}/> Send Notification to {selected.size} Student{selected.size !== 1 ? 's' : ''}</>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Notifications;
