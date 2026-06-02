import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CreditCard, Bell, Download } from 'lucide-react';

const getPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We get student data. Let's fetch using our API. 
    // Wait, the API `getStudents` by ID requires the student ID, not user ID.
    // In a full implementation, we'd have a specific `/api/students/me` endpoint.
    // For now, let's fetch students with the email of the user to find their profile.
    
    const fetchMyProfile = async () => {
      try {
        const { data } = await axios.get(`/students?search=${user.email}`);
        if (data.students && data.students.length > 0) {
          const myProfile = data.students[0];
          // Fetch full profile with payments
          const fullProfile = await axios.get(`/students/${myProfile.id}`);
          setStudentData(fullProfile.data);
        }
      } catch (error) {
        console.error('Error fetching student profile', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.email) {
      fetchMyProfile();
    }
  }, [user]);

  if (loading) return <div className="p-8 text-text-muted animate-pulse">Loading Profile...</div>;

  if (!studentData) return (
    <div className="glass p-8 rounded-2xl text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-2">Profile Not Found</h2>
      <p className="text-text-muted">Your student profile has not been configured by the admin yet.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">My Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="glass p-6 rounded-2xl md:col-span-1 border-t-4 border-primary">
          <div className="flex flex-col items-center text-center">
            {studentData.profilePhoto ? (
              <img 
                src={getPhotoUrl(studentData.profilePhoto)} 
                alt={studentData.fullName} 
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 mb-4 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 text-gray-400 overflow-hidden flex items-center justify-center border-4 border-gray-300 rounded-full mb-4 shadow-lg">
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            )}
            <h2 className="text-xl font-bold text-text-main">{studentData.fullName}</h2>
            <p className="text-text-muted mb-4">{studentData.studentId}</p>
            
            <div className="w-full border-t border-gray-100 pt-4 mt-2 space-y-2 text-left text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Phone:</span> <span className="font-medium text-text-main">{studentData.phone}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Email:</span> <span className="font-medium text-text-main">{user.email}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Joined:</span> <span className="font-medium text-text-main">{new Date(studentData.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl border flex items-center space-x-4
              ${studentData.feeStatus === 'PAID' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
            `}>
              <div className={`p-3 rounded-xl text-white ${studentData.feeStatus === 'PAID' ? 'bg-green-500' : 'bg-red-500'}`}>
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted">Current Fee Status</p>
                <h3 className={`text-2xl font-bold ${studentData.feeStatus === 'PAID' ? 'text-green-700' : 'text-red-700'}`}>
                  {studentData.feeStatus}
                </h3>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-premium text-white">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted">Next Due Date</p>
                <h3 className="text-2xl font-bold text-text-main">
                  {studentData.nextDueDate ? new Date(studentData.nextDueDate).toLocaleDateString() : 'N/A'}
                </h3>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-text-main mb-4">Payment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-text-muted text-sm">
                    <th className="py-2">Date</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {studentData.payments && studentData.payments.map(payment => (
                    <tr key={payment.id} className="border-b border-gray-50 text-sm">
                      <td className="py-3 text-text-main font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className="text-green-600 font-semibold">₹{payment.paidAmount}</span>
                        {payment.isPartial && (
                          <div className="text-[10px] text-amber-600 font-semibold">Bal: ₹{payment.remainingBalance}</div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          payment.paymentStatus === 'SUCCESS' ? 'bg-green-100 text-green-700 border border-green-200' :
                          payment.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          payment.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                          'bg-red-100 text-red-700 border border-red-200'
                        }`}>{payment.paymentStatus}</span>
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-primary hover:text-secondary inline-flex items-center space-x-1">
                          <Download size={14} /> <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!studentData.payments || studentData.payments.length === 0) && (
                    <tr><td colSpan="4" className="py-4 text-center text-text-muted">No payment history found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
