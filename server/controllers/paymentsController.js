import prisma from '../config/db.js';
import fs from 'fs';
import path from 'path';

const settingsPath = path.resolve('config', 'settings.json');
const getSecretPin = () => {
  try {
    const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return data.revenuePin || '9999';
  } catch (err) {
    return '9999';
  }
};

// @desc    Add payment (full or partial)
// @route   POST /api/payments
// @access  Private/Admin
export const addPayment = async (req, res) => {
  try {
    const { studentId, paidAmount, dueDate, fineAmount } = req.body;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const totalDue = student.monthlySubscription + (parseFloat(fineAmount) || 0);
    const paid     = parseFloat(paidAmount);

    // How much was already outstanding before this payment?
    const previousBalance = student.remainingBalance > 0 ? student.remainingBalance : totalDue;
    const newBalance      = Math.max(0, previousBalance - paid);
    const isPartial       = newBalance > 0;

    // Record the payment transaction
    const payment = await prisma.payment.create({
      data: {
        studentId,
        studentName:      student.fullName,
        libraryStudentId: student.studentId,
        totalDue,
        paidAmount:       paid,
        remainingBalance: newBalance,
        isPartial,
        paymentStatus:    isPartial ? 'PARTIAL' : 'SUCCESS',
        paymentDate:      new Date(),
        dueDate:          dueDate ? new Date(dueDate) : new Date(),
        fineAmount:       parseFloat(fineAmount) || 0,
      }
    });

    // Update student status and balance
    let newFeeStatus  = isPartial ? 'PENDING' : 'PAID';
    let nextDueDateUp = {};

    if (!isPartial) {
      let shouldAdvance = false;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      const currentNextDue = student.nextDueDate ? new Date(student.nextDueDate) : new Date();
      currentNextDue.setUTCHours(0, 0, 0, 0);

      if (student.feeStatus === 'PAID') {
        // Paying early for the next cycle
        shouldAdvance = true;
      } else if (currentNextDue <= today) {
        // Paying a due balance where the due date has already passed or is today
        shouldAdvance = true;
      } else {
        // PENDING/DUE but nextDueDate is ALREADY in the future (e.g., just registered)
        shouldAdvance = false;
      }

      if (shouldAdvance) {
        const base = new Date(currentNextDue);
        base.setMonth(base.getMonth() + 1);
        nextDueDateUp = { nextDueDate: base };
      }
    }

    await prisma.student.update({
      where: { id: studentId },
      data: {
        feeStatus:        newFeeStatus,
        remainingBalance: newBalance,
        ...nextDueDateUp
      }
    });

    res.status(201).json({
      payment,
      remainingBalance: newBalance,
      isPartial,
      message: isPartial
        ? `Partial payment of ₹${paid} recorded. Remaining balance: ₹${newBalance}`
        : `Full payment of ₹${paid} recorded. Subscription cleared!`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Revert / Refund a payment
// @route   POST /api/payments/:id/revert
// @access  Private/Admin
export const revertPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { secretPin } = req.body;

    // 1. Verify Secret PIN
    const currentPin = getSecretPin();
    if (secretPin !== currentPin) {
      return res.status(401).json({ message: 'Invalid Secret PIN' });
    }

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Check if already reverted
    if (payment.paymentStatus === 'FAILED' || payment.paidAmount < 0) {
      return res.status(400).json({ message: 'This payment has already been reversed.' });
    }

    // Ensure payment is less than 24 hours old
    const ageInHours = (new Date() - new Date(payment.paymentDate)) / (1000 * 60 * 60);
    if (ageInHours > 24) {
      return res.status(400).json({ message: 'Cannot revert payments older than 24 hours' });
    }

    const student = await prisma.student.findUnique({ where: { id: payment.studentId } });
    if (!student) return res.status(404).json({ message: 'Associated student not found' });

    // Calculate reverted balance
    const revertedBalance = student.remainingBalance + payment.paidAmount;
    
    // Determine reverted fee status
    let revertedFeeStatus = 'DUE';
    if (revertedBalance <= 0) {
      revertedFeeStatus = 'PAID';
    } else if (revertedBalance < student.monthlySubscription) {
      revertedFeeStatus = 'PENDING';
    }

    // Determine reverted next due date if it was a full payment
    let nextDueDateUp = {};
    if (!payment.isPartial && student.nextDueDate) {
      const base = new Date(student.nextDueDate);
      base.setMonth(base.getMonth() - 1);
      nextDueDateUp = { nextDueDate: base };
    }

    // Run creation of negative payment and student update in a transaction
    await prisma.$transaction([
      prisma.student.update({
        where: { id: student.id },
        data: {
          feeStatus: revertedFeeStatus,
          remainingBalance: revertedBalance,
          ...nextDueDateUp
        }
      }),
      prisma.payment.create({
        data: {
          studentId: payment.studentId,
          studentName: student.fullName,
          libraryStudentId: student.studentId,
          totalDue: payment.totalDue,
          paidAmount: -Math.abs(payment.paidAmount),
          remainingBalance: revertedBalance,
          isPartial: false,
          paymentStatus: 'FAILED', // Using FAILED to represent reversed/refunded
          paymentDate: new Date(),
          dueDate: payment.dueDate,
          fineAmount: 0
        }
      }),
      // Also optionally mark the old payment as FAILED so it's known it was reverted
      prisma.payment.update({
        where: { id },
        data: { paymentStatus: 'FAILED' }
      })
    ]);

    res.json({ message: 'Payment successfully reverted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private/Admin
export const getPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: { select: { fullName: true, studentId: true } }
      },
      orderBy: { paymentDate: 'desc' },
      take: 100
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get due students (feeStatus DUE or past nextDueDate)
// @route   GET /api/payments/due
// @access  Private/Admin
export const getDueStudents = async (req, res) => {
  try {
    const today = new Date();
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { feeStatus: 'DUE' },
          { feeStatus: 'PENDING', nextDueDate: { lt: today } }
        ]
      },
      orderBy: { nextDueDate: 'asc' }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get revenue stats (private, PIN-gated on frontend)
// @route   GET /api/payments/revenue
// @access  Private/Admin
export const getRevenue = async (req, res) => {
  try {
    const pin = req.headers['x-revenue-pin'];
    const expectedPin = process.env.REVENUE_PIN || '9999';
    
    if (pin !== expectedPin) {
      return res.status(403).json({ message: 'Invalid Revenue PIN. Access Denied.' });
    }

    const { filter } = req.query;

    const now       = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart  = new Date(now.getFullYear(), 0, 1);

    const [
      todayRev, 
      monthRev, 
      totalRev, 
      partialCount, 
      totalPayments,
      avgPayment,
      outstandingAggregate,
      recentPayments
    ] = await Promise.all([
      prisma.payment.aggregate({ _sum: { paidAmount: true }, where: { paymentDate: { gte: todayStart } } }),
      prisma.payment.aggregate({ _sum: { paidAmount: true }, where: { paymentDate: { gte: monthStart } } }),
      prisma.payment.aggregate({ _sum: { paidAmount: true } }),
      prisma.payment.count({ where: { isPartial: true } }),
      prisma.payment.count(),
      prisma.payment.aggregate({ _avg: { paidAmount: true } }),
      prisma.student.aggregate({ _sum: { remainingBalance: true } }),
      (() => {
        let recentWhere = {};
        if (filter === 'today') recentWhere = { paymentDate: { gte: todayStart } };
        else if (filter === '7days') recentWhere = { paymentDate: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        else if (filter === '30days') recentWhere = { paymentDate: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        
        return prisma.payment.findMany({
          take: filter ? 50 : 10,
          where: recentWhere,
          orderBy: { paymentDate: 'desc' },
          include: { student: { select: { fullName: true, studentId: true, isActive: true } } }
        });
      })()
    ]);

    // Monthly breakdown for chart (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const agg  = await prisma.payment.aggregate({
        _sum: { paidAmount: true },
        where: { paymentDate: { gte: d, lt: dEnd } }
      });
      monthlyData.push({
        name:    d.toLocaleString('en-IN', { month: 'short' }),
        revenue: agg._sum.paidAmount || 0
      });
    }

    res.json({
      todayRevenue:      Math.max(0, todayRev._sum.paidAmount || 0),
      monthlyRevenue:    Math.max(0, monthRev._sum.paidAmount || 0),
      totalRevenue:      Math.max(0, totalRev._sum.paidAmount || 0),
      partialPayments:   partialCount,
      totalPayments,
      averagePayment:    Math.round(avgPayment._avg.paidAmount || 0),
      totalOutstanding:  outstandingAggregate._sum.remainingBalance || 0,
      recentTransactions: recentPayments,
      monthlyChart:      monthlyData,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get monthly report
// @route   GET /api/payments/monthly-report
// @access  Private/Admin
export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query; // e.g. month=5, year=2026

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Convert month (1-indexed from frontend) to Date boundaries
    const targetMonth = parseInt(month, 10);
    const targetYear = parseInt(year, 10);

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 1); // First day of next month

    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        student: {
          select: { fullName: true, studentId: true, phone: true, isActive: true }
        }
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
