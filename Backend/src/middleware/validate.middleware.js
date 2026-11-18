/**
 * Zod Schema Validation Middleware Factory
 * 
 * WHY:
 * 1. Guarantees that any request passing through this middleware has valid data
 *    matching the expected types, formats, and business validation rules.
 * 2. Assigns Zod's parsed/stripped/coerced values back onto req.body, req.query, and req.params,
 *    ensuring controllers work exclusively with safe, cleaned data.
 */
function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace with validated, sanitized, and coerced data
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = validate;
