import recordService from '../services/recordService.js';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/helpers.js';

export const createRecord = asyncHandler(async (req, res) => {
  const record = recordService.create(req.body, req.user.id);
  successResponse(res, record, 201);
});

export const getRecord = asyncHandler(async (req, res) => {
  const record = recordService.getById(Number(req.params.id));
  successResponse(res, record);
});

export const listRecords = asyncHandler(async (req, res) => {
  const result = recordService.list(req.query);
  const { page = 1, limit = 20 } = req.query;
  paginatedResponse(res, { ...result, page: Number(page), limit: Number(limit) });
});

export const updateRecord = asyncHandler(async (req, res) => {
  const record = recordService.update(Number(req.params.id), req.body, req.user.id);
  successResponse(res, record);
});

export const deleteRecord = asyncHandler(async (req, res) => {
  recordService.delete(Number(req.params.id), req.user.id);
  successResponse(res, { message: 'Record deleted successfully.' });
});
