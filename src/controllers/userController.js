import userService from '../services/userService.js';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/helpers.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = userService.listUsers({ page, limit });
  paginatedResponse(res, { ...result, page, limit });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = userService.getUser(Number(req.params.id));
  successResponse(res, user);
});

export const updateRole = asyncHandler(async (req, res) => {
  const user = userService.updateRole(
    Number(req.params.id),
    req.body.role,
    req.user,
  );
  successResponse(res, user);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const user = userService.updateStatus(
    Number(req.params.id),
    req.body.status,
    req.user,
  );
  successResponse(res, user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  userService.deleteUser(Number(req.params.id), req.user);
  successResponse(res, { message: 'User deleted successfully.' }, 200);
});
