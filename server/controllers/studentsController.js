import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import path from 'path';

// Helper to generate a unique Student ID: 4 digits (>1000) followed by 2 random uppercase letters
const generateUniqueStudentId = async () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  while (true) {
    const num = Math.floor(1001 + Math.random() * 8998); // 1001 to 9999
    const char1 = letters[Math.floor(Math.random() * letters.length)];
    const char2 = letters[Math.floor(Math.random() * letters.length)];
    const newId = `${num}${char1}${char2}`;

    const existing = await prisma.student.findUnique({ where: { studentId: newId } });
    if (!existing) {
      return newId;
    }
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private/Admin
export const createStudent = async (req, res) => {
  try {
    const {
      studentId,
      fullName,
      email,
      phone,
      address,
      aadhaarNo,
      seatNo,
      slot,
      monthlySubscription,
      admissionDate,
      nextDueDate
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !monthlySubscription) {
      return res.status(400).json({ message: 'Full name, email, phone, and monthly subscription are required.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }
    if (aadhaarNo && !/^\d{12}$/.test(aadhaarNo)) {
      return res.status(400).json({ message: 'Aadhaar number must be exactly 12 digits.' });
    }
    if (seatNo && Number(seatNo) <= 0) {
      return res.status(400).json({ message: 'Seat number must be a positive number.' });
    }

    // Check if user/student already exists
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Default password for students is their phone number
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(phone, salt);

    // Admission date: use provided date but keep current exact time
    let admDate = new Date();
    if (admissionDate) {
      const d = new Date(admissionDate);
      if (!isNaN(d)) {
        admDate.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }

    // Next due date: use provided or auto-set to 1 month after admission
    const dueDate = nextDueDate
      ? new Date(nextDueDate)
      : (() => { const d = new Date(admDate); d.setMonth(d.getMonth() + 1); return d; })();
    dueDate.setUTCHours(0, 0, 0, 0);

    // Use frontend provided studentId if available and unique, otherwise auto-generate
    let finalStudentId = studentId;
    if (finalStudentId) {
      const existingId = await prisma.student.findUnique({ where: { studentId: finalStudentId } });
      if (existingId) finalStudentId = null; // Collision detected, force auto-generation
    }
    
    if (!finalStudentId) {
      finalStudentId = await generateUniqueStudentId();
    }

    // Create User and Student profile atomically
    const newStudent = await prisma.user.create({
      data: {
        name: fullName,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        student: {
          create: {
            studentId: finalStudentId,
            fullName,
            phone,
            address,
            aadhaarNo,
            seatNo,
            slot,
            admissionDate: admDate,
            monthlySubscription: parseFloat(monthlySubscription || 0),
            feeStatus: 'PENDING',
            nextDueDate: dueDate
          }
        }
      },
      include: {
        student: true
      }
    });

    res.status(201).json(newStudent.student);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all students with search & pagination
// @route   GET /api/students
// @access  Private/Admin
export const getStudents = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10, feeStatus } = req.query;
    
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const where = {
      AND: [
        {
          OR: [
            { fullName: { contains: search } },
            { studentId: { contains: search } },
            { phone: { contains: search } },
            { user: { email: { contains: search } } }
          ]
        },
        { isActive: true },
        ...(feeStatus ? [{ feeStatus }] : [])
      ]
    };

    const students = await prisma.student.findMany({
      where,
      skip,
      take: pageSize,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.student.count({ where });

    res.json({
      students,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get student by ID (Full profile with all payments)
// @route   GET /api/students/:id
// @access  Private/Admin
export const getStudentById = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { email: true, createdAt: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
        notifications: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });

    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update student details (including feeStatus, nextDueDate, profilePhoto)
// @route   PUT /api/students/:id
// @access  Private/Admin
export const updateStudent = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      aadhaarNo,
      monthlySubscription,
      feeStatus,
      nextDueDate,
      seatNo,
      slot
    } = req.body;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }
    if (aadhaarNo && !/^\d{12}$/.test(aadhaarNo)) {
      return res.status(400).json({ message: 'Aadhaar number must be exactly 12 digits.' });
    }
    if (seatNo !== undefined && seatNo !== '' && Number(seatNo) <= 0) {
      return res.status(400).json({ message: 'Seat number must be a positive number.' });
    }

    // Handle profile photo upload via Multer (Cloudinary storage returns the URL in req.file.path)
    const profilePhoto = req.file ? req.file.path : undefined;

    const updateData = {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      address: address === undefined ? undefined : (address === '' ? null : address),
      aadhaarNo: aadhaarNo === undefined ? undefined : (aadhaarNo === '' ? null : aadhaarNo),
      ...(monthlySubscription !== undefined && monthlySubscription !== '' && { monthlySubscription: parseFloat(monthlySubscription) }),
      ...(feeStatus && { feeStatus }),
      ...(nextDueDate !== undefined && { nextDueDate: nextDueDate === '' ? null : (() => { const d = new Date(nextDueDate); d.setUTCHours(0, 0, 0, 0); return d; })() }),
      ...(profilePhoto && { profilePhoto }),
      seatNo: seatNo === undefined ? undefined : (seatNo === '' ? null : seatNo),
      slot: slot === undefined ? undefined : (slot === '' ? null : slot)
    };

    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: updateData,
      include: { user: { select: { email: true } } }
    });

    // Also update User name and email if changed
    if (fullName || email) {
      await prisma.user.update({
        where: { id: student.userId },
        data: { 
          ...(fullName && { name: fullName }),
          ...(email && { email })
        }
      });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
export const deleteStudent = async (req, res) => {
  try {
    const pin = req.headers['x-revenue-pin'];
    const expectedPin = process.env.REVENUE_PIN || '9999';
    
    if (pin !== expectedPin) {
      return res.status(403).json({ message: 'Invalid Secret PIN. Deletion Denied.' });
    }

    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const timestamp = Date.now();

    // Free up unique fields by appending timestamp
    await prisma.user.update({
      where: { id: student.userId },
      data: { email: `${student.userId}-deleted-${timestamp}@deleted.com` }
    });

    // Soft delete on student
    await prisma.student.update({
      where: { id: student.id },
      data: { 
        isActive: false,
        studentId: `${student.studentId}-deleted-${timestamp}`
      }
    });

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
