import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Settings as SettingsIcon, Save, Key, Library, CreditCard, Lock, BellRing, Loader2, Upload, Camera
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { user, updateUser } = useAuth();
  // Config states
  const [config, setConfig] = useState({
    libraryName: 'Prakash Library',
    adminEmail: 'admin@prakash.com',
    defaultSubscription: 500,
    lateFeePerDay: 10,
    revenuePin: '9999',
    emailNotificationsEnabled: true,
    whatsappNotificationsEnabled: false
  });
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Profile Photo Upload States
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileRef = React.useRef(null);

  // Security password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  // Secret PIN change states
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Fetch settings from server on load
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/settings');
      setConfig(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load settings from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      await axios.put('/settings', config);
      toast.success('System configuration saved successfully!');
      fetchSettings(); // reload
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New password and confirm password do not match');
    }

    setSecurityLoading(true);
    try {
      await axios.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Administrator password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Current password verification failed');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handlePinChange = async (e) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      return toast.error('New PIN and confirm PIN do not match');
    }
    if (newPin.length !== 4) {
      return toast.error('Secret PIN must be exactly 4 digits');
    }

    setPinLoading(true);
    try {
      await axios.put('/settings/pin', {
        currentPin,
        newPin
      });
      toast.success('Secret PIN updated successfully!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify current Secret PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePhoto', file);

    setPhotoLoading(true);
    try {
      const res = await axios.post('/settings/admin-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile photo updated successfully!');
      if (res.data.adminPhoto) {
        updateUser({ profilePhoto: res.data.adminPhoto });
      }
    } catch (err) {
      toast.error('Failed to upload profile photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-muted animate-pulse font-medium">Loading settings dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h1 className="text-2xl font-extrabold text-text-main flex items-center tracking-tight">
          <SettingsIcon className="mr-3 text-primary animate-spin-slow" size={28} /> Control Center Settings
        </h1>
        <span className="text-xs text-text-muted">Global configuration & security</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 max-w-7xl">

        {/* --- LEFT COLUMN --- */}
        <div className="flex-1 space-y-6">

          {/* 0. PROFILE PHOTO UPLOAD */}
          <div className="glass p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/60">
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-6">
              <div
                className="relative cursor-pointer group"
                onClick={() => !photoLoading && fileRef.current?.click()}
              >
                <img
                  src={user?.profilePhoto || '/logo.png'}
                  alt="Admin Profile"
                  className={`w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg transition-all duration-300 ${photoLoading ? 'opacity-50' : 'group-hover:border-primary/50 group-hover:opacity-80'}`}
                />
                {!photoLoading && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                )}
                {photoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                    <Loader2 size={24} className="text-primary animate-spin" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main">Admin Profile Picture</h2>
                <p className="text-sm text-text-muted mt-1">Click the image to upload a new photo. Uses system logo by default.</p>
              </div>
            </div>
          </div>

          {/* 1. GENERAL CONFIGURATION */}
          <div className="glass p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/60">
            <h2 className="text-lg font-bold text-text-main flex items-center border-b border-gray-100 pb-3">
              <Library className="mr-2 text-secondary" size={20} /> Library Configuration
            </h2>
            <form onSubmit={handleSaveGeneral} className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Library Name</label>
                  <input
                    type="text"
                    name="libraryName"
                    value={config.libraryName}
                    onChange={handleConfigChange}
                    required
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Admin Contact Email</label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={config.adminEmail}
                    onChange={handleConfigChange}
                    required
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-sm"
                  />
                </div>

                {/* Billing settings */}
                <div className="border-t border-gray-50 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1 flex items-center gap-1">
                      <CreditCard size={14} className="text-primary" /> Default Subscription (₹)
                    </label>
                    <input
                      type="number"
                      name="defaultSubscription"
                      value={config.defaultSubscription}
                      onChange={handleConfigChange}
                      required
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1 flex items-center gap-1">
                      <CreditCard size={14} className="text-red-500" /> Late Fee / Overdue per day (₹)
                    </label>
                    <input
                      type="number"
                      name="lateFeePerDay"
                      value={config.lateFeePerDay}
                      onChange={handleConfigChange}
                      required
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-sm"
                    />
                  </div>
                </div>



                {/* Notification Toggles */}
                <div className="border-t border-gray-50 pt-4 space-y-3">
                  <label className="block text-xs font-semibold text-text-muted mb-1 flex items-center gap-1">
                    <BellRing size={14} className="text-amber-500" /> Automated Alert Services
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-text-main">
                      <input
                        type="checkbox"
                        name="emailNotificationsEnabled"
                        checked={config.emailNotificationsEnabled}
                        onChange={handleConfigChange}
                        className="w-4.5 h-4.5 accent-primary cursor-pointer"
                      />
                      <span>Enable SMTP Email Reminders</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-text-main">
                      <input
                        type="checkbox"
                        name="whatsappNotificationsEnabled"
                        checked={config.whatsappNotificationsEnabled}
                        onChange={handleConfigChange}
                        className="w-4.5 h-4.5 accent-primary cursor-pointer"
                      />
                      <span>Enable WhatsApp API alerts (Twilio Sandbox)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-150 mt-6">
                <button
                  type="submit"
                  disabled={savingGeneral}
                  className="px-6 py-3 bg-gradient-premium text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {savingGeneral ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Configuration</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="flex-1 space-y-6">

          {/* Security Settings */}
          <div className="glass p-6 rounded-3xl h-fit border border-white/60 space-y-6">
            <h2 className="text-lg font-bold text-text-main flex items-center border-b border-gray-100 pb-3">
              <Key className="mr-2 text-green-500" size={20} /> Administrator Security Password
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-sm"
                />
              </div>

              <div className="pt-6 border-t border-gray-150 mt-6">
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="w-full px-6 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {securityLoading ? <Loader2 size={18} className="animate-spin" /> : <><Lock size={18} /> Update Password</>}
                </button>
              </div>
            </form>
          </div>

          {/* Secret PIN Settings */}
          <div className="glass p-6 rounded-3xl h-fit border border-white/60 space-y-6">
            <h2 className="text-lg font-bold text-text-main flex items-center border-b border-gray-100 pb-3">
              <Lock className="mr-2 text-purple-500" size={20} /> Secret Revenue PIN
            </h2>
            <form onSubmit={handlePinChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Current Secret PIN</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="••••"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-sm tracking-widest text-center"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">New PIN</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="••••"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-sm tracking-widest text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Confirm New PIN</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="••••"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-sm tracking-widest text-center"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pinLoading}
                  className="w-full px-6 py-3 bg-gradient-premium text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {pinLoading ? <Loader2 size={18} className="animate-spin" /> : <><Lock size={18} /> Update Secret PIN</>}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
