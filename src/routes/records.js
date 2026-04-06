import { Router } from 'express';
import {
  createRecord, getRecord, listRecords, updateRecord, deleteRecord,
} from '../controllers/recordController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createRecordSchema, updateRecordSchema, recordIdParamSchema, listRecordsQuerySchema,
} from '../validators/recordValidator.js';

const router = Router();

// all record routes require at least authentication
router.use(authenticate);

// read access — analyst + admin
router.get('/', authorize('analyst', 'admin'), validate(listRecordsQuerySchema, 'query'), listRecords);
router.get('/:id', authorize('analyst', 'admin'), validate(recordIdParamSchema, 'params'), getRecord);

// write access — admin only
router.post('/', authorize('admin'), validate(createRecordSchema), createRecord);
router.put('/:id', authorize('admin'), validate(recordIdParamSchema, 'params'), validate(updateRecordSchema), updateRecord);
router.delete('/:id', authorize('admin'), validate(recordIdParamSchema, 'params'), deleteRecord);

export default router;
