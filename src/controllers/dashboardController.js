import dashboardService from '../services/dashboardService.js';
import { asyncHandler, successResponse } from '../utils/helpers.js';

export const getSummary = asyncHandler(async (_req, res) => {
  const summary = dashboardService.getSummary();
  successResponse(res, summary);
});

export const getCategoryTotals = asyncHandler(async (_req, res) => {
  const totals = dashboardService.getCategoryTotals();
  successResponse(res, totals);
});

export const getMonthlyTrends = asyncHandler(async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const trends = dashboardService.getMonthlyTrends(year);
  successResponse(res, trends);
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const recent = dashboardService.getRecentActivity(limit);
  successResponse(res, recent);
});
