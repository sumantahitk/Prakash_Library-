import cron from 'node-cron';
import prisma from '../config/db.js';
import { sendEmail, sendWhatsApp } from '../services/notificationService.js';

export const initCronJobs = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily due checking cron job at 9:00 AM...');
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const in3Days = new Date(today);
      in3Days.setDate(today.getDate() + 3);

      const dueStudents = await prisma.student.findMany({
        where: {
          nextDueDate: { lte: in3Days },
          isActive: true
        },
        include: { user: true }
      });

      for (const student of dueStudents) {
        const dueDate = new Date(student.nextDueDate);
        dueDate.setUTCHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let message = '';
        let type = '';

        if (diffDays === 3) {
          message = `Hello ${student.fullName}, your monthly subscription payment of ₹${student.monthlySubscription} is due on ${dueDate.toDateString()}. Please pay before the due date to avoid interruption.`;
          type = 'REMINDER';
        } else if (diffDays <= 0) {
          // If diffDays <= 0, they are due or overdue.
          // Check if we need to bill them (feeStatus !== DUE). If feeStatus is PENDING (partial payment)
          // and they are past due, we don't re-bill them for the same cycle unless nextDueDate is hit.
          // To cleanly bill recurring cycles, we add to remainingBalance and push nextDueDate forward by 1 month.
          if (student.feeStatus !== 'DUE' || diffDays <= -30) {
             const newNextDue = new Date(dueDate);
             newNextDue.setMonth(newNextDue.getMonth() + 1);
             newNextDue.setUTCHours(0, 0, 0, 0);

             await prisma.student.update({
               where: { id: student.id },
               data: {
                 feeStatus: 'DUE',
                 remainingBalance: { increment: student.monthlySubscription },
                 nextDueDate: newNextDue
               }
             });
          }

          if (diffDays === 0) {
            message = `URGENT: Hello ${student.fullName}, your monthly subscription payment of ₹${student.monthlySubscription} is due TODAY. Please clear your dues immediately.`;
            type = 'URGENT';
          } else {
            message = `OVERDUE ALERT: Hello ${student.fullName}, your monthly subscription payment was due on ${dueDate.toDateString()}. Your fee status is OVERDUE. Please pay immediately.`;
            type = 'OVERDUE';
          }
        }

        if (message) {
          const emailSuccess = await sendEmail(student.user.email, `Subscription Notice - Prakash Library`, message);
          const waSuccess = await sendWhatsApp(student.phone, message);
          
          await prisma.notification.create({
            data: {
              studentId: student.id,
              message,
              type,
              deliveryMethod: 'BOTH',
              sentStatus: (emailSuccess || waSuccess) ? 'SUCCESS' : 'FAILED'
            }
          });
        }
      }
    } catch (error) {
      console.error('Cron Job Error:', error);
    }
  });
  console.log('Cron scheduler initialized.');
};
