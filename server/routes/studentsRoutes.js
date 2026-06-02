import express from 'express';
import { 
  createStudent, 
  getStudents, 
  getStudentById, 
  updateStudent, 
  deleteStudent 
} from '../controllers/studentsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, adminOnly, createStudent)
  .get(protect, adminOnly, getStudents);

router.route('/:id')
  .get(protect, adminOnly, getStudentById)
  .put(protect, adminOnly, upload.single('profilePhoto'), updateStudent)
  .delete(protect, adminOnly, deleteStudent);

export default router;
