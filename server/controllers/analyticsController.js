import prisma from '../config/db.js';

// @desc    Dashboard overview (NO revenue totals — those are private)
// @route   GET /api/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res) => {
  try {
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalStudents, paidStudents, pendingStudents, dueStudents, todayRev, newToday] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.student.count({ where: { feeStatus: 'PAID', isActive: true } }),
      prisma.student.count({ where: { feeStatus: 'PENDING', isActive: true } }),
      prisma.student.count({ where: { feeStatus: 'DUE', isActive: true } }),
      prisma.payment.aggregate({ _sum: { paidAmount: true }, where: { paymentDate: { gte: todayStart } } }),
      prisma.student.count({ where: { createdAt: { gte: todayStart }, isActive: true } }),
    ]);

    res.json({
      totalStudents,
      paidStudents,
      pendingStudents,
      dueStudents,
      todayRevenue:   Math.max(0, todayRev._sum.paidAmount || 0),
      newAdmissionsToday: newToday,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
