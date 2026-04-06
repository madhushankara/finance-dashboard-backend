import authService from '../services/authService.js';
import { asyncHandler, successResponse } from '../utils/helpers.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  successResponse(res, result, 201);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  successResponse(res, result);
});

export const getMe = asyncHandler(async (req, res) => {
  const profile = authService.getProfile(req.user.id);
  successResponse(res, profile);
});
