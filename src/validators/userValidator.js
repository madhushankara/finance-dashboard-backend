import Joi from 'joi';

export const updateRoleSchema = Joi.object({
  role: Joi.string().valid('viewer', 'analyst', 'admin').required().messages({
    'any.only': 'Role must be one of: viewer, analyst, admin',
    'any.required': 'Role is required',
  }),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required().messages({
    'any.only': 'Status must be either active or inactive',
    'any.required': 'Status is required',
  }),
});

export const userIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'User ID must be a number',
    'number.positive': 'User ID must be positive',
  }),
});

export const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
