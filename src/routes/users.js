import { Router } from 'express';
import {
  listUsers, getUser, updateRole, updateStatus, deleteUser,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  updateRoleSchema, updateStatusSchema, userIdParamSchema, listUsersQuerySchema,
} from '../validators/userValidator.js';

const router = Router();

// all user‑management routes require admin access
router.use(authenticate, authorize('admin'));

router.get('/', validate(listUsersQuerySchema, 'query'), listUsers);
router.get('/:id', validate(userIdParamSchema, 'params'), getUser);
router.patch('/:id/role', validate(userIdParamSchema, 'params'), validate(updateRoleSchema), updateRole);
router.patch('/:id/status', validate(userIdParamSchema, 'params'), validate(updateStatusSchema), updateStatus);
router.delete('/:id', validate(userIdParamSchema, 'params'), deleteUser);

export default router;
