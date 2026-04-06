import AppError from '../utils/AppError.js';

/**
 * Middleware factory: validate `req[source]` against a Joi schema.
 *
 * @param {import('joi').ObjectSchema} schema  – compiled Joi schema
 * @param {'body'|'query'|'params'} source     – which part of the request to validate
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,   // collect ALL errors, not just the first
      stripUnknown: true,  // silently drop extra fields
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return next(new AppError('Validation failed.', 422, details));
    }

    // replace with the cleaned / coerced value
    req[source] = value;
    next();
  };
}
