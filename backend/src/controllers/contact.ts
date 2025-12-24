import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import emailService from '../services/emailService';
import Logger from '../utils/logger';
import { errorResponse, successResponse } from '../utils/apiResponse';

export const contactValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Please provide a valid phone number'),
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters'),
    body('equipmentInterest')
        .optional()
        .trim()
        .isIn(['Tents', 'Sleeping Bags', 'Backpacks', 'Cooking Equipment', 'Other', 'None'])
        .withMessage('Invalid equipment interest selection'),
];

export const submitContactForm = async (req: Request, res: Response) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg).join(', ');
            return res.status(400).json(
                errorResponse('Validation failed', errorMessages)
            );
        }

        const { name, email, phone, message, equipmentInterest } = req.body;

        Logger.info(`Contact form submission from: ${email}`);

        // Check if email service is configured
        if (!emailService.isReady()) {
            Logger.warn('Email service not configured, logging contact form submission');
            // Log the contact form data even if email is not configured
            Logger.info(`Contact Form Data: ${JSON.stringify({ name, email, phone, message, equipmentInterest })}`);

            return res.status(200).json(
                successResponse(
                    {
                        submitted: true,
                        note: 'Email notifications are currently unavailable, but your message has been logged.'
                    },
                    'Contact form submitted successfully. We will get back to you soon!'
                )
            );
        }

        // Send confirmation email to user
        const userEmailSent = await emailService.sendContactConfirmation(
            email,
            name,
            message
        );

        // Send notification email to admin
        const adminEmailSent = await emailService.sendContactNotification(
            name,
            email,
            phone || '',
            message,
            equipmentInterest || 'None'
        );

        if (!userEmailSent && !adminEmailSent) {
            Logger.error('Failed to send both user and admin emails');
            return res.status(500).json(
                errorResponse('Failed to send email notifications. Please try again later.')
            );
        }

        Logger.info(`Contact form processed successfully for ${email}`);

        return res.status(200).json(
            successResponse(
                {
                    submitted: true,
                    confirmationSent: userEmailSent,
                },
                'Thank you for contacting us! We will get back to you soon.'
            )
        );
    } catch (error: any) {
        Logger.error('Error processing contact form: ' + error.message);
        return res.status(500).json(
            errorResponse('An error occurred while processing your request. Please try again later.')
        );
    }
};

export const bookingSupportValidation = [
    body('bookingId')
        .trim()
        .notEmpty()
        .withMessage('Booking ID is required'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters'),
];

export const submitBookingSupportRequest = async (req: Request, res: Response) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg).join(', ');
            return res.status(400).json(
                errorResponse('Validation failed', errorMessages)
            );
        }

        const { bookingId, name, email, message } = req.body;

        Logger.info(`Booking support request from: ${email} for booking: ${bookingId}`);

        // Check if email service is configured
        if (!emailService.isReady()) {
            Logger.warn('Email service not configured, logging booking support request');
            Logger.info(`Booking Support Request: ${JSON.stringify({ bookingId, name, email, message })}`);

            return res.status(200).json(
                successResponse(
                    {
                        submitted: true,
                        note: 'Email notifications are currently unavailable, but your support request has been logged.'
                    },
                    'Support request submitted successfully. We will get back to you soon!'
                )
            );
        }

        // Send confirmation email to user
        const userEmailSent = await emailService.sendContactConfirmation(
            email,
            name,
            `Regarding Booking #${bookingId.slice(-8).toUpperCase()}: ${message}`
        );

        // Send notification email to admin with booking context
        const adminEmailSent = await emailService.sendContactNotification(
            name,
            email,
            '',
            `[BOOKING SUPPORT] Booking ID: ${bookingId}\n\n${message}`,
            'None'
        );

        if (!userEmailSent && !adminEmailSent) {
            Logger.error('Failed to send both user and admin emails for booking support');
            return res.status(500).json(
                errorResponse('Failed to send email notifications. Please try again later.')
            );
        }

        Logger.info(`Booking support request processed successfully for ${email}`);

        return res.status(200).json(
            successResponse(
                {
                    submitted: true,
                    confirmationSent: userEmailSent,
                },
                'Thank you for contacting us! We will get back to you soon regarding your booking.'
            )
        );
    } catch (error: any) {
        Logger.error('Error processing booking support request: ' + error.message);
        return res.status(500).json(
            errorResponse('An error occurred while processing your request. Please try again later.')
        );
    }
};
