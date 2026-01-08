const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// Validation rules
const validationRules = {
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').trim().notEmpty(),
    body('role').isIn(['admin', 'ss_secretary', 'viewer'])
  ],
  
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  
  createClass: [
    body('quarter_id').isUUID(),
    body('class_name').trim().notEmpty(),
    body('teacher_name').trim().notEmpty(),
    body('secretary_name').trim().notEmpty(),
    body('secretary_id').optional().isUUID()
  ],
  
  createQuarter: [
    body('name').isIn(['Q1', 'Q2', 'Q3', 'Q4']),
    body('year').isInt({ min: 2020, max: 2100 }),
    body('start_date').isDate(),
    body('end_date').isDate()
  ],
  
  weeklyData: [
    body('class_id').isUUID(),
    body('week_number').isInt({ min: 1, max: 13 }),
    body('sabbath_date').isDate(),
    body('total_attendance').optional().isInt({ min: 0 }),
    body('member_visits').optional().isInt({ min: 0 }),
    body('offering_global_mission').optional().isFloat({ min: 0 })
  ]
};

module.exports = {
  validate,
  validationRules
};