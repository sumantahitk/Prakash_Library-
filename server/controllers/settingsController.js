import fs from 'fs';
import path from 'path';

const settingsPath = path.resolve('config', 'settings.json');

// Helper to read settings
const readSettingsFile = () => {
  try {
    const data = fs.readFileSync(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Default fallback settings
    return {
      libraryName: "Prakash Library",
      adminEmail: "admin@gmail.com",
      defaultSubscription: 500,
      lateFeePerDay: 10,
      revenuePin: "9999",
      emailNotificationsEnabled: true,
      whatsappNotificationsEnabled: false
    };
  }
};

// Helper to write settings
const writeSettingsFile = (data) => {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf8');
};

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private/Admin
export const getSettings = (req, res) => {
  try {
    const settings = readSettingsFile();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to read settings', error: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = (req, res) => {
  try {
    const current = readSettingsFile();
    const updated = {
      ...current,
      ...req.body
    };
    
    // Type casting
    if (updated.defaultSubscription !== undefined) updated.defaultSubscription = parseFloat(updated.defaultSubscription);
    if (updated.lateFeePerDay !== undefined) updated.lateFeePerDay = parseFloat(updated.lateFeePerDay);
    if (updated.emailNotificationsEnabled !== undefined) updated.emailNotificationsEnabled = updated.emailNotificationsEnabled === true || updated.emailNotificationsEnabled === 'true';
    if (updated.whatsappNotificationsEnabled !== undefined) updated.whatsappNotificationsEnabled = updated.whatsappNotificationsEnabled === true || updated.whatsappNotificationsEnabled === 'true';

    writeSettingsFile(updated);
    
    // Optionally update revenue pin in environment memory or other places if configured
    if (updated.revenuePin) {
      process.env.REVENUE_PIN = updated.revenuePin;
    }

    res.json({ message: 'Settings updated successfully', settings: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
};

// @desc    Update Secret PIN
// @route   PUT /api/settings/pin
// @access  Private/Admin
export const updatePin = (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    
    if (!currentPin || !newPin) {
      return res.status(400).json({ message: 'Current PIN and New PIN are required' });
    }

    const current = readSettingsFile();
    
    // Verify current PIN
    if (current.revenuePin !== currentPin) {
      return res.status(400).json({ message: 'Current Secret PIN is incorrect' });
    }

    // Update PIN
    const updated = {
      ...current,
      revenuePin: newPin
    };

    writeSettingsFile(updated);
    
    // Update process.env if necessary
    process.env.REVENUE_PIN = newPin;

    res.json({ message: 'Secret PIN updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update Secret PIN', error: error.message });
  }
};

// @desc    Update Admin Profile Photo
// @route   POST /api/settings/admin-photo
// @access  Private/Admin
export const updateAdminPhoto = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }
    
    const current = readSettingsFile();
    const updated = {
      ...current,
      adminPhoto: req.file.path
    };

    writeSettingsFile(updated);
    
    res.json({ message: 'Admin photo updated successfully', adminPhoto: req.file.path });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update admin photo', error: error.message });
  }
};
