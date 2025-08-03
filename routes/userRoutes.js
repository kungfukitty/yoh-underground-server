import express from 'express';
import { authenticateToken, checkAdmin } from '../middleware/authMiddleware.js';
import {
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// All /api/users routes require a valid token…
router.use(authenticateToken);

// …but only admins can list, update or delete other users:
router.get('/',           checkAdmin, getAllUsers);
router.get('/:id',        checkAdmin, getUserById);
router.put('/:id',        checkAdmin, updateUser);
router.delete('/:id',     checkAdmin, deleteUser);

export default router;
