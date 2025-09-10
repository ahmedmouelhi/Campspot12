import { Request, Response, NextFunction } from 'express';
import { body, check, query, validationResult, Meta } from 'express-validator';
import { ParsedQs } from 'qs';
import { ValidationError } from '../utils/errors';

interface SearchQuery extends ParsedQs {
  dates?: {
    checkIn: string;
    checkOut: string;
  };
  startDate?: string;
}

interface SearchRequest extends Request {
  query: SearchQuery;
}

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  next();
};

export const validateSearchParams = [
  // Search query (optional)
  query('q').optional().trim().escape(),

  // Price range (optional)
  query('priceRange.min').optional().isFloat({ min: 0 }).toFloat(),
  query('priceRange.max').optional().isFloat({ min: 0 }).toFloat(),

  // Location (optional)
  query('location').optional().trim().escape(),

  // Dates (optional)
  query('dates.checkIn')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value: Date) => {
      if (value < new Date()) {
        throw new Error('Check-in date must be in the future');
      }
      return true;
    }),
  query('dates.checkOut')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value: Date, meta: Meta) => {
      const req = meta.req as SearchRequest;
      if (req.query.dates?.checkIn) {
        const checkInDate = new Date(req.query.dates.checkIn);
        if (value <= checkInDate) {
          throw new Error('Check-out date must be after check-in date');
        }
      }
      return true;
    }),

  // Number of guests (optional)
  query('guests').optional().isInt({ min: 1 }).toInt(),

  // Amenities (optional)
  query('amenities')
    .optional()
    .isArray()
    .customSanitizer((value: unknown) => (Array.isArray(value) ? value : [value])),

  // Site types (optional)
  query('type')
    .optional()
    .isArray()
    .customSanitizer((value: unknown) => (Array.isArray(value) ? value : [value]))
    .custom((value: string[]) => {
      const validTypes = ['tent', 'rv', 'cabin', 'glamping'] as const;
      if (!value.every((type: string) => validTypes.includes(type as typeof validTypes[number]))) {
        throw new Error('Invalid site type');
      }
      return true;
    }),

  // Rating (optional)
  query('rating').optional().isFloat({ min: 0, max: 5 }).toFloat(),

  // Pagination
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 50 }).toInt(),

  // Handle validation errors
  handleValidationErrors,
];

// User registration validation
export const validateUserRegistration = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim()
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors,
];

// User login validation
export const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// Booking validation
export const validateBooking = [
  body('campingSiteId')
    .isMongoId()
    .withMessage('Invalid camping site ID'),
  body('startDate')
    .isISO8601()
    .toDate()
    .custom((value: Date) => {
      if (value < new Date()) {
        throw new Error('Start date must be in the future');
      }
      return true;
    }),
  body('endDate')
    .isISO8601()
    .toDate()
    .custom((value: Date, { req }) => {
      if (value <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('guests')
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of guests must be between 1 and 20'),
  handleValidationErrors,
];

// Profile update validation
export const validateProfileUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim()
    .escape(),
  body('phone')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Phone number must be at least 1 character'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters')
    .trim(),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters')
    .trim(),
  handleValidationErrors,
];

export const validateDateRange = [
  query('startDate').isISO8601().toDate(),
  query('endDate')
    .isISO8601()
    .toDate()
    .custom((value: Date, meta: Meta) => {
      const req = meta.req as SearchRequest;
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        if (value <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  handleValidationErrors,
];
