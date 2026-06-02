import prisma from '../config/db.js';
import { sendEmail, sendWhatsApp } from '../services/notificationService.js';

// @desc    Send manual notification
// @route   POST /api/notifications/send
// @access  Private/Admin
export const sendNotification = async (req, res) => {
  try {
    const { studentIds, message, subject, type, method } = req.body;

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { user: true }
    });

    const results = [];

    for (const student of students) {
      let emailSuccess = false;
      let waSuccess = false;

      if (method === 'EMAIL' || method === 'BOTH') {
        emailSuccess = await sendEmail(student.user.email, subject || 'Notice - Prakash Library', message);
      }
      if (method === 'WHATSAPP' || method === 'BOTH') {
        waSuccess = await sendWhatsApp(student.phone, message);
      }

      const status = (emailSuccess || waSuccess) ? 'SUCCESS' : 'FAILED';

      const log = await prisma.notification.create({
        data: {
          studentId: student.id,
          message,
          type: type || 'MANUAL',
          deliveryMethod: method,
          sentStatus: status
        }
      });
      results.push(log);
    }

    res.json({ message: 'Notifications sent', results });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
