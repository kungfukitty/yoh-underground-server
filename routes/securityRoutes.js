import { Router } from 'express';
import { authenticateToken, checkAdmin } from '../middleware/authMiddleware.js';
import {
  getLoginLogs,
  getAdminActions,
  getAccessLogs,
  getPermissionChanges,
  exportUserData,
  deleteUserData,
  getAlerts
} from '../controllers/securityController.js';

const router = Router();
router.use(authenticateToken, checkAdmin);

// Logs
router.get('/logins', getLoginLogs);
router.get('/admin-actions', getAdminActions);
router.get('/access-logs', getAccessLogs);
router.get('/permission-changes', getPermissionChanges);

// Privacy Tools
router.post('/export-user-data', exportUserData);
router.delete('/delete-user-data/:userId', deleteUserData);

// Alerts
router.get('/alerts', getAlerts);

export default router;
