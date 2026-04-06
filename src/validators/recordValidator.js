import Joi from 'joi';

export const createRecordSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
  type: Joi.string().valid('income', 'expense').required().messages({
    'any.only': 'Type must be either income or expense',
    'any.required': 'Type is required',
  }),
  category: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'Category is required',
  }),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format',
      'any.required': 'Date is required',
    }),
  description: Joi.string().trim().max(500).allow('', null).optional(),
});

export const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  type: Joi.string().valid('income', 'expense').optional(),
  category: Joi.string().trim().min(1).max(100).optional(),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Date must be in YYYY-MM-DD format' }),
  description: Joi.string().trim().max(500).allow('', null).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const recordIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Record ID must be a number',
  }),
});

export const listRecordsQuerySchema = Joi.object({
  type: Joi.string().valid('income', 'expense').optional(),
  category: Joi.string().trim().optional(),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minAmount: Joi.number().positive().optional(),
  maxAmount: Joi.number().positive().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('date', 'amount', 'created_at', 'category', 'type').default('date'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});
