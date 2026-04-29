const { body, param, validationResult } = require('express-validator');

// Sanitization helpers
const sanitizeString = (value) => {
  if (typeof value === 'string') {
    return value.trim().replace(/[<>]/g, '');
  }
  return value;
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

// Enhanced validation rules with security measures
const validationRules = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email address required'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be 8-128 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    body('full_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be 2-100 characters long')
      .custom(sanitizeString),
    body('role').isIn(['admin', 'ss_secretary', 'viewer']).withMessage('Invalid role specified'),
  ],

  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email address required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ max: 128 })
      .withMessage('Password too long'),
  ],

  createClass: [
    body('quarter_id').isUUID(4).withMessage('Valid quarter ID required'),
    body('class_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Class name must be 2-100 characters long')
      .custom(sanitizeString),
    body('teacher_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Teacher name must be 2-100 characters long')
      .custom(sanitizeString),
    body('secretary_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Secretary name must be 2-100 characters long')
      .custom(sanitizeString),
    body('secretary_id').optional().isUUID(4).withMessage('Valid secretary ID required'),
    body('church_name')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Church name must be 2-200 characters long')
      .custom(sanitizeString),
  ],

  createQuarter: [
    body('name').isIn(['Q1', 'Q2', 'Q3', 'Q4']).withMessage('Quarter must be Q1, Q2, Q3, or Q4'),
    body('year').isInt({ min: 2020, max: 2100 }).withMessage('Year must be between 2020 and 2100'),
    body('start_date').isISO8601().withMessage('Valid start date required'),
    body('end_date')
      .isISO8601()
      .withMessage('Valid end date required')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.start_date)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
  ],

  weeklyData: [
    body('class_id').isUUID(4).withMessage('Valid class ID required'),
    body('week_number')
      .isInt({ min: 1, max: 13 })
      .withMessage('Week number must be between 1 and 13'),
    body('sabbath_date').isISO8601().withMessage('Valid Sabbath date required'),
    body('total_attendance')
      .optional()
      .isInt({ min: 0, max: 1000 })
      .withMessage('Total attendance must be between 0 and 1000'),
    body('member_visits')
      .optional()
      .isInt({ min: 0, max: 500 })
      .withMessage('Member visits must be between 0 and 500'),
    body('members_conducted_bible_studies')
      .optional()
      .isInt({ min: 0, max: 500 })
      .withMessage('Bible studies must be between 0 and 500'),
    body('offering_global_mission')
      .optional()
      .isFloat({ min: 0, max: 1000000 })
      .withMessage('Global mission offering must be a positive number'),
    body('offering_lesson_english')
      .optional()
      .isFloat({ min: 0, max: 1000000 })
      .withMessage('English lesson offering must be a positive number'),
    body('offering_lesson_luganda')
      .optional()
      .isFloat({ min: 0, max: 1000000 })
      .withMessage('Luganda lesson offering must be a positive number'),
    body('offering_morning_watch')
      .optional()
      .isFloat({ min: 0, max: 1000000 })
      .withMessage('Morning watch offering must be a positive number'),
    body('secretary_notes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Secretary notes must be less than 2000 characters')
      .custom(sanitizeString),
    body('members_summary')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Members summary must be less than 2000 characters')
      .custom(sanitizeString),
  ],

  // Additional validation rules for other endpoints
  updateClass: [
    param('id').isUUID(4).withMessage('Valid class ID required'),
    body('class_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Class name must be 2-100 characters long')
      .custom(sanitizeString),
    body('teacher_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Teacher name must be 2-100 characters long')
      .custom(sanitizeString),
    body('secretary_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Secretary name must be 2-100 characters long')
      .custom(sanitizeString),
  ],

  updateUser: [
    param('id').isUUID(4).withMessage('Valid user ID required'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email address required'),
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be 2-100 characters long')
      .custom(sanitizeString),
    body('role')
      .optional()
      .isIn(['admin', 'ss_secretary', 'viewer'])
      .withMessage('Invalid role specified'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  ],
};

module.exports = {
  validate,
  validationRules,
};
