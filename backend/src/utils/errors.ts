import { Request, Response, NextFunction } from 'express';
import Logger from './logger';
import { errorResponse } from './apiResponse';

export class CustomError extends Error {
  constructor(message: string, public statusCode: number, public code?: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string, code?: string) {
    super(message, 400, code);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string, code?: string) {
    super(message, 404, code);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string, code?: string) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string, code?: string) {
    super(message, 403, code);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string, code?: string) {
    super(message, 409, code);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, public details?: any[], code?: string) {
    super(message, 422, code);
  }
}

// Enhanced error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error details
  Logger.error(`${err.name}: ${err.message}`, {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      code: err.code,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
    },
  });

  // Handle specific error types
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json(errorResponse(err.message, err.code));
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors,
    });
  }

  // Handle MongoDB cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json(errorResponse('Invalid ID format'));
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json(errorResponse(`${field} already exists`));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Invalid token'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('Token expired'));
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  
  res.status(statusCode).json(errorResponse(message));
};

// Async error wrapper to catch async errors in route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
